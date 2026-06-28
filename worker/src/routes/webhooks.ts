import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { first, run } from '../lib/db'
import { normalizePhone, sendCloudwapiMessage } from '../lib/cloudwapi'
import { handleReferralWhatsAppMessage } from './referral'
import type { Customer, WhatsappConversation, WhatsappMessage } from '../db/schema'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =============================================================================
// Shared inbound WhatsApp processor (CloudWAPI + SaleSmartly)
// =============================================================================

type InboundWhatsAppInput = {
  phone: string
  message: string
  name?: string
  externalMessageId?: string | null
  timestamp?: number
}

async function processInboundWhatsApp(env: Bindings, input: InboundWhatsAppInput) {
  const normalizedPhone = normalizePhone(input.phone)
  const message = input.message.trim()

  if (!normalizedPhone || !message) {
    return { ok: true, handled: false, replied: false }
  }

  const now = Math.floor(Date.now() / 1000)
  const incomingAt = typeof input.timestamp === 'number' ? input.timestamp : now

  // 1. Ensure customer
  let customer = await first<Customer>(
    env.DB,
    'SELECT * FROM customers WHERE phone = ? OR phone = ?',
    [normalizedPhone, input.phone]
  )

  if (!customer) {
    const email = `${normalizedPhone.replace('+', '')}@whatsapp.local`
    const result = await run(
      env.DB,
      'INSERT INTO customers (name, email, phone, whatsapp_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [input.name || '', email, normalizedPhone, 1, now, now]
    )
    customer = await first<Customer>(env.DB, 'SELECT * FROM customers WHERE id = ?', [
      result.meta.last_row_id ?? 0,
    ])
  } else if (input.name && !customer.name) {
    await run(env.DB, 'UPDATE customers SET name = ?, updated_at = ? WHERE id = ?', [
      input.name,
      now,
      customer.id,
    ])
    customer = { ...customer, name: input.name }
  }

  // 2. Ensure conversation
  let conversation = await first<WhatsappConversation>(
    env.DB,
    'SELECT * FROM whatsapp_conversations WHERE phone = ? ORDER BY id DESC LIMIT 1',
    [normalizedPhone]
  )

  if (!conversation) {
    const result = await run(
      env.DB,
      'INSERT INTO whatsapp_conversations (customer_id, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [customer?.id ?? null, normalizedPhone, 'active', now, now]
    )
    conversation = await first<WhatsappConversation>(
      env.DB,
      'SELECT * FROM whatsapp_conversations WHERE id = ?',
      [result.meta.last_row_id ?? 0]
    )
  }

  // 3. Record inbound message
  if (conversation) {
    await run(
      env.DB,
      'INSERT INTO whatsapp_messages (conversation_id, customer_id, direction, message, status, external_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        conversation.id,
        customer?.id ?? null,
        'inbound',
        message,
        'delivered',
        input.externalMessageId ?? null,
        incomingAt,
      ]
    )

    await run(
      env.DB,
      'UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
      [now, now, conversation.id]
    )
  }

  // 4. Record inbound activity
  if (customer) {
    await run(
      env.DB,
      'INSERT INTO customer_activities (customer_id, activity_type, metadata, created_at) VALUES (?, ?, ?, ?)',
      [
        customer.id,
        'whatsapp',
        JSON.stringify({ direction: 'inbound', message, phone: normalizedPhone }),
        now,
      ]
    )
  }

  // 5. Referral auto-reply (always sent via CloudWAPI)
  const referral = await handleReferralWhatsAppMessage(env, normalizedPhone, message)
  let replied = false

  if (referral.handled && referral.message) {
    try {
      const sendResult = (await sendCloudwapiMessage(env, {
        phone: normalizedPhone,
        message: referral.message,
      })) as { message_id?: string; id?: string; external_message_id?: string } | undefined

      replied = true
      const outboundExternalId =
        sendResult?.message_id ?? sendResult?.id ?? sendResult?.external_message_id ?? null

      // Record outbound message + activity
      if (conversation) {
        await run(
          env.DB,
          'INSERT INTO whatsapp_messages (conversation_id, customer_id, direction, message, status, external_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            conversation.id,
            customer?.id ?? null,
            'outbound',
            referral.message,
            'sent',
            outboundExternalId,
            now,
          ]
        )

        await run(
          env.DB,
          'UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
          [now, now, conversation.id]
        )
      }

      if (customer) {
        await run(
          env.DB,
          'INSERT INTO customer_activities (customer_id, activity_type, metadata, created_at) VALUES (?, ?, ?, ?)',
          [
            customer.id,
            'whatsapp',
            JSON.stringify({ direction: 'outbound', message: referral.message, phone: normalizedPhone }),
            now,
          ]
        )
      }
    } catch (err) {
      console.error('[webhook] referral reply failed:', err)
    }
  }

  return { ok: true, handled: referral.handled, replied }
}

// =============================================================================
// CloudWAPI incoming webhook
// =============================================================================

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

  const result = await processInboundWhatsApp(c.env, {
    phone,
    message,
    externalMessageId:
      typeof body.external_message_id === 'string' ? body.external_message_id : null,
    timestamp: typeof body.timestamp === 'number' ? body.timestamp : undefined,
  })

  return c.json(result)
})

// =============================================================================
// SaleSmartly incoming webhook
// Expected custom payload:
// {
//   "event": "message",
//   "data": {
//     "from": "{{PHONE}}",
//     "text": "{{LAST_INPUT_TEXT}}",
//     "customer_id": "{{NAME}}"
//   }
// }
// =============================================================================

app.post('/salesmartly/incoming', async (c) => {
  const secret = c.env.SALESMARTLY_WEBHOOK_SECRET
  if (secret) {
    const token = c.req.query('token')
    if (token !== secret) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }

  const body = await c.req.json<{
    event?: unknown
    data?: Record<string, unknown>
  }>()

  if (body.event !== 'message') {
    return c.json({ ok: true })
  }

  const data = body.data
  if (!data) {
    return c.json({ ok: true })
  }

  const phone = typeof data.from === 'string' ? data.from.trim() : ''
  const message = typeof data.text === 'string' ? data.text.trim() : ''
  const name = typeof data.customer_id === 'string' ? data.customer_id.trim() : ''

  if (!phone || !message) {
    return c.json({ error: 'Missing from or text' }, 400)
  }

  const result = await processInboundWhatsApp(c.env, {
    phone,
    message,
    name: name || undefined,
  })

  return c.json(result)
})

// =============================================================================
// CloudWAPI status webhook
// =============================================================================

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
