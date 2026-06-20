import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { first, run } from '../lib/db'
import { normalizePhone } from '../lib/cloudwapi'
import type { Customer, WhatsappConversation, WhatsappMessage } from '../db/schema'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.post('/cloudwapi/incoming', async (c) => {
  const body = await c.req.json<{
    phone?: unknown
    message?: unknown
    external_message_id?: unknown
    timestamp?: unknown
  }>()

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!phone || !message) {
    return c.json({ error: 'Missing phone or message' }, 400)
  }

  const normalizedPhone = normalizePhone(phone)
  const now = Math.floor(Date.now() / 1000)
  const incomingAt = typeof body.timestamp === 'number' ? body.timestamp : now

  let customer = await first<Customer>(
    c.env.DB,
    'SELECT * FROM customers WHERE phone = ? OR phone = ?',
    [normalizedPhone, phone]
  )

  if (!customer) {
    const email = `${normalizedPhone.replace('+', '')}@whatsapp.local`
    const result = await run(
      c.env.DB,
      'INSERT INTO customers (name, email, phone, whatsapp_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['', email, normalizedPhone, 1, now, now]
    )
    customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [
      result.meta.last_row_id ?? 0,
    ])
  }

  let conversation = await first<WhatsappConversation>(
    c.env.DB,
    'SELECT * FROM whatsapp_conversations WHERE phone = ? ORDER BY id DESC LIMIT 1',
    [normalizedPhone]
  )

  if (!conversation) {
    const result = await run(
      c.env.DB,
      'INSERT INTO whatsapp_conversations (customer_id, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [customer?.id ?? null, normalizedPhone, 'active', now, now]
    )
    conversation = await first<WhatsappConversation>(
      c.env.DB,
      'SELECT * FROM whatsapp_conversations WHERE id = ?',
      [result.meta.last_row_id ?? 0]
    )
  }

  if (conversation) {
    await run(
      c.env.DB,
      'INSERT INTO whatsapp_messages (conversation_id, customer_id, direction, message, status, external_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        conversation.id,
        customer?.id ?? null,
        'inbound',
        message,
        'delivered',
        typeof body.external_message_id === 'string' ? body.external_message_id : null,
        incomingAt,
      ]
    )

    await run(
      c.env.DB,
      'UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
      [now, now, conversation.id]
    )
  }

  if (customer) {
    await run(
      c.env.DB,
      'INSERT INTO customer_activities (customer_id, activity_type, metadata, created_at) VALUES (?, ?, ?, ?)',
      [
        customer.id,
        'whatsapp',
        JSON.stringify({ direction: 'inbound', message, phone: normalizedPhone }),
        now,
      ]
    )
  }

  return c.json({ ok: true })
})

app.post('/cloudwapi/status', async (c) => {
  const body = await c.req.json<{ external_message_id?: unknown; status?: unknown }>()

  const externalId = typeof body.external_message_id === 'string' ? body.external_message_id.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : ''
  if (!externalId || !status) {
    return c.json({ error: 'Missing external_message_id or status' }, 400)
  }

  const validStatuses = ['sent', 'delivered', 'read', 'failed']
  if (!validStatuses.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  const message = await first<WhatsappMessage>(
    c.env.DB,
    'SELECT * FROM whatsapp_messages WHERE external_message_id = ?',
    [externalId]
  )
  if (!message) {
    return c.json({ error: 'Message not found' }, 404)
  }

  await run(c.env.DB, 'UPDATE whatsapp_messages SET status = ? WHERE id = ?', [status, message.id])

  return c.json({ ok: true })
})

export default app
