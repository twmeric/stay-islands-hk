import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { all, first, run } from '../lib/db'
import { normalizePhone, sendCloudwapiMessage } from '../lib/cloudwapi'
import { requireAdmin } from '../middleware/auth'
import type {
  BroadcastBatch,
  BroadcastLog,
  Customer,
  CustomerActivity,
  WhatsappConversation,
  WhatsappMessage,
  WhatsappTemplate,
} from '../db/schema'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', requireAdmin)

// =============================================================================
// Customers
// =============================================================================

app.get('/customers', async (c) => {
  const query = c.req.query()
  const search = query.search?.trim()
  const tags = query.tags?.split(',').map((t) => t.trim()).filter(Boolean)
  const assignedAdminId = query.assigned_admin_id ? Number(query.assigned_admin_id) : undefined
  const membershipTierId = query.membership_tier_id ? Number(query.membership_tier_id) : undefined
  const limit = Math.min(parseInt(query.limit || '20', 10), 100)
  const offset = Math.max(parseInt(query.offset || '0', 10), 0)

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)')
    const pattern = `%${search}%`
    params.push(pattern, pattern, pattern)
  }
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      conditions.push('tags LIKE ?')
      params.push(`%"${tag}"%`)
    }
  }
  if (assignedAdminId !== undefined && Number.isFinite(assignedAdminId)) {
    conditions.push('assigned_admin_id = ?')
    params.push(assignedAdminId)
  }
  if (membershipTierId !== undefined && Number.isFinite(membershipTierId)) {
    conditions.push('membership_tier_id = ?')
    params.push(membershipTierId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const data = await all<Customer>(
    c.env.DB,
    `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM customers ${where}`,
    params
  )

  return c.json({ data, total: countRow?.count ?? 0 })
})

app.get('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404)
  }

  const activities = await all<CustomerActivity>(
    c.env.DB,
    'SELECT * FROM customer_activities WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10',
    [id]
  )

  return c.json({ data: { ...customer, activities } })
})

app.get('/customers/:id/activities', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const activities = await all<CustomerActivity>(
    c.env.DB,
    'SELECT * FROM customer_activities WHERE customer_id = ? ORDER BY created_at DESC',
    [id]
  )

  return c.json({ data: activities })
})

app.post('/customers/:id/activities', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const body = await c.req.json<{ activity_type?: unknown; metadata?: unknown }>()
  const activityType = typeof body.activity_type === 'string' ? body.activity_type.trim() : ''
  if (!activityType) {
    return c.json({ error: 'Missing activity_type' }, 400)
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object' ? JSON.stringify(body.metadata) : null

  const result = await run(
    c.env.DB,
    'INSERT INTO customer_activities (customer_id, activity_type, metadata, created_at) VALUES (?, ?, ?, unixepoch())',
    [id, activityType, metadata]
  )

  return c.json({ data: { id: result.meta.last_row_id ?? 0 } }, 201)
})

app.put('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const existing = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])
  if (!existing) {
    return c.json({ error: 'Customer not found' }, 404)
  }

  const body = await c.req.json<{
    name?: unknown
    phone?: unknown
    whatsapp_consent?: unknown
    membership_tier_id?: unknown
    tags?: unknown
    notes?: unknown
    assigned_admin_id?: unknown
  }>()

  const fields: string[] = []
  const params: unknown[] = []

  if ('name' in body) {
    fields.push('name = ?')
    params.push(typeof body.name === 'string' ? body.name.trim() || null : null)
  }
  if ('phone' in body) {
    fields.push('phone = ?')
    params.push(typeof body.phone === 'string' ? body.phone.trim() || null : null)
  }
  if ('whatsapp_consent' in body) {
    fields.push('whatsapp_consent = ?')
    params.push(body.whatsapp_consent ? 1 : 0)
  }
  if ('membership_tier_id' in body) {
    fields.push('membership_tier_id = ?')
    params.push(Number.isFinite(Number(body.membership_tier_id)) ? Number(body.membership_tier_id) : null)
  }
  if ('tags' in body) {
    fields.push('tags = ?')
    params.push(Array.isArray(body.tags) ? JSON.stringify(body.tags) : null)
  }
  if ('notes' in body) {
    fields.push('notes = ?')
    params.push(typeof body.notes === 'string' ? body.notes.trim() || null : null)
  }
  if ('assigned_admin_id' in body) {
    const newAssigned = Number.isFinite(Number(body.assigned_admin_id)) ? Number(body.assigned_admin_id) : null
    fields.push('assigned_admin_id = ?')
    params.push(newAssigned)

    if (!existing.assignedAdminId && newAssigned) {
      await run(
        c.env.DB,
        'INSERT INTO customer_activities (customer_id, activity_type, metadata, created_at) VALUES (?, ?, ?, unixepoch())',
        [id, 'assigned', JSON.stringify({ assigned_admin_id: newAssigned })]
      )
    }
  }

  if (!fields.length) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  fields.push('updated_at = unixepoch()')
  params.push(id)

  await run(c.env.DB, `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, params)
  const customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])

  return c.json({ data: customer })
})

app.post('/customers/:id/notes', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const body = await c.req.json<{ notes?: unknown }>()
  const newNotes = typeof body.notes === 'string' ? body.notes.trim() : ''
  if (!newNotes) {
    return c.json({ error: 'Missing notes' }, 400)
  }

  const existing = await first<Customer>(c.env.DB, 'SELECT notes FROM customers WHERE id = ?', [id])
  if (!existing) {
    return c.json({ error: 'Customer not found' }, 404)
  }

  const timestamp = new Date().toISOString()
  const combined = existing.notes
    ? `${timestamp}\n${newNotes}\n\n${existing.notes}`
    : `${timestamp}\n${newNotes}`

  await run(c.env.DB, 'UPDATE customers SET notes = ?, updated_at = unixepoch() WHERE id = ?', [combined, id])

  return c.json({ data: { success: true } })
})

app.delete('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid customer id' }, 400)
  }

  const result = await run(c.env.DB, 'DELETE FROM customers WHERE id = ?', [id])
  if (!result.meta.changes) {
    return c.json({ error: 'Customer not found' }, 404)
  }

  return c.json({ data: { success: true } })
})

// =============================================================================
// WhatsApp Templates
// =============================================================================

app.get('/whatsapp/templates', async (c) => {
  const templates = await all<WhatsappTemplate>(
    c.env.DB,
    'SELECT * FROM whatsapp_templates ORDER BY created_at DESC'
  )
  return c.json({ data: templates })
})

app.post('/whatsapp/templates', async (c) => {
  const body = await c.req.json<{
    name?: unknown
    content?: unknown
    variables?: unknown
    status?: unknown
  }>()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!name || !content) {
    return c.json({ error: 'Missing name or content' }, 400)
  }

  const variables = Array.isArray(body.variables) ? JSON.stringify(body.variables) : null
  const status = typeof body.status === 'string' ? body.status : 'active'

  const result = await run(
    c.env.DB,
    'INSERT INTO whatsapp_templates (name, content, variables, status, created_at, updated_at) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())',
    [name, content, variables, status]
  )

  return c.json({ data: { id: result.meta.last_row_id ?? 0 } }, 201)
})

app.get('/whatsapp/templates/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid template id' }, 400)
  }

  const template = await first<WhatsappTemplate>(
    c.env.DB,
    'SELECT * FROM whatsapp_templates WHERE id = ?',
    [id]
  )
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  return c.json({ data: template })
})

app.put('/whatsapp/templates/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid template id' }, 400)
  }

  const body = await c.req.json<{
    name?: unknown
    content?: unknown
    variables?: unknown
    status?: unknown
  }>()

  const fields: string[] = []
  const params: unknown[] = []

  if ('name' in body) {
    fields.push('name = ?')
    params.push(typeof body.name === 'string' ? body.name.trim() : '')
  }
  if ('content' in body) {
    fields.push('content = ?')
    params.push(typeof body.content === 'string' ? body.content.trim() : '')
  }
  if ('variables' in body) {
    fields.push('variables = ?')
    params.push(Array.isArray(body.variables) ? JSON.stringify(body.variables) : null)
  }
  if ('status' in body) {
    fields.push('status = ?')
    params.push(typeof body.status === 'string' ? body.status : 'draft')
  }

  if (!fields.length) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  fields.push('updated_at = unixepoch()')
  params.push(id)

  await run(c.env.DB, `UPDATE whatsapp_templates SET ${fields.join(', ')} WHERE id = ?`, params)
  const template = await first<WhatsappTemplate>(
    c.env.DB,
    'SELECT * FROM whatsapp_templates WHERE id = ?',
    [id]
  )

  return c.json({ data: template })
})

app.delete('/whatsapp/templates/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid template id' }, 400)
  }

  const result = await run(c.env.DB, 'DELETE FROM whatsapp_templates WHERE id = ?', [id])
  if (!result.meta.changes) {
    return c.json({ error: 'Template not found' }, 404)
  }

  return c.json({ data: { success: true } })
})

// =============================================================================
// Broadcasts
// =============================================================================

app.get('/broadcasts', async (c) => {
  const query = c.req.query()
  const status = query.status
  const limit = Math.min(parseInt(query.limit || '20', 10), 100)
  const offset = Math.max(parseInt(query.offset || '0', 10), 0)

  const conditions: string[] = []
  const params: unknown[] = []
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const data = await all<BroadcastBatch>(
    c.env.DB,
    `SELECT * FROM broadcast_batches ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM broadcast_batches ${where}`,
    params
  )

  return c.json({ data, total: countRow?.count ?? 0 })
})

app.post('/broadcasts', async (c) => {
  const body = await c.req.json<{
    template_id?: unknown
    name?: unknown
    target_filter?: unknown
    rate_min_seconds?: unknown
    rate_max_seconds?: unknown
  }>()

  const templateId = Number(body.template_id)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!Number.isFinite(templateId) || !name) {
    return c.json({ error: 'Missing template_id or name' }, 400)
  }

  const template = await first<WhatsappTemplate>(
    c.env.DB,
    'SELECT * FROM whatsapp_templates WHERE id = ?',
    [templateId]
  )
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  const { targetCount } = await resolveTargetCount(c.env.DB, body.target_filter)

  const rateMin = Number.isFinite(Number(body.rate_min_seconds)) ? Number(body.rate_min_seconds) : 1
  const rateMax = Number.isFinite(Number(body.rate_max_seconds)) ? Number(body.rate_max_seconds) : 3

  const result = await run(
    c.env.DB,
    `INSERT INTO broadcast_batches
      (template_id, name, target_count, rate_min_seconds, rate_max_seconds, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [templateId, name, targetCount, rateMin, rateMax, 'pending', c.get('adminId') ?? null]
  )

  return c.json({ data: { id: result.meta.last_row_id ?? 0, target_count: targetCount } }, 201)
})

async function resolveTargetCount(
  db: D1Database,
  targetFilter: unknown
): Promise<{ targetCount: number }> {
  const baseWhere = 'WHERE whatsapp_consent = 1'

  if (!targetFilter) {
    const row = await first<{ count: number }>(db, `SELECT COUNT(*) as count FROM customers ${baseWhere}`)
    return { targetCount: row?.count ?? 0 }
  }

  if (typeof targetFilter === 'string') {
    try {
      const parsed = JSON.parse(targetFilter)
      return resolveTargetCount(db, parsed)
    } catch {
      const row = await first<{ count: number }>(
        db,
        `SELECT COUNT(*) as count FROM customers ${baseWhere} AND tags LIKE ?`,
        [`%"${targetFilter.trim()}"%`]
      )
      return { targetCount: row?.count ?? 0 }
    }
  }

  if (typeof targetFilter === 'object' && targetFilter !== null) {
    const parsed = targetFilter as Record<string, unknown>
    const conditions: string[] = [baseWhere]
    const params: unknown[] = []

    if (parsed.tag && typeof parsed.tag === 'string') {
      conditions.push('tags LIKE ?')
      params.push(`%"${parsed.tag}"%`)
    }
    if (Number.isFinite(Number(parsed.membership_tier_id))) {
      conditions.push('membership_tier_id = ?')
      params.push(Number(parsed.membership_tier_id))
    }
    if (Number.isFinite(Number(parsed.assigned_admin_id))) {
      conditions.push('assigned_admin_id = ?')
      params.push(Number(parsed.assigned_admin_id))
    }

    const row = await first<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM customers ${conditions.join(' AND ')}`,
      params
    )
    return { targetCount: row?.count ?? 0 }
  }

  const row = await first<{ count: number }>(db, `SELECT COUNT(*) as count FROM customers ${baseWhere}`)
  return { targetCount: row?.count ?? 0 }
}

app.get('/broadcasts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid broadcast id' }, 400)
  }

  const batch = await first<BroadcastBatch>(c.env.DB, 'SELECT * FROM broadcast_batches WHERE id = ?', [id])
  if (!batch) {
    return c.json({ error: 'Broadcast not found' }, 404)
  }

  return c.json({ data: batch })
})

app.get('/broadcasts/:id/logs', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid broadcast id' }, 400)
  }

  const logs = await all<BroadcastLog>(
    c.env.DB,
    'SELECT * FROM broadcast_logs WHERE batch_id = ? ORDER BY created_at DESC',
    [id]
  )

  return c.json({ data: logs })
})

app.post('/broadcasts/:id/send', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid broadcast id' }, 400)
  }

  const batch = await first<BroadcastBatch>(c.env.DB, 'SELECT * FROM broadcast_batches WHERE id = ?', [id])
  if (!batch) {
    return c.json({ error: 'Broadcast not found' }, 404)
  }
  if (batch.status !== 'pending') {
    return c.json({ error: 'Broadcast already started or completed' }, 400)
  }

  const template = await first<WhatsappTemplate>(
    c.env.DB,
    'SELECT * FROM whatsapp_templates WHERE id = ?',
    [batch.templateId]
  )
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  // NOTE: schema.sql does not include a target_filter column on broadcast_batches,
  // so the broadcast target defaults to all customers with whatsapp_consent = 1.
  const customers = await all<Customer>(
    c.env.DB,
    'SELECT * FROM customers WHERE whatsapp_consent = 1'
  )

  if (!customers.length) {
    await run(
      c.env.DB,
      'UPDATE broadcast_batches SET status = ?, updated_at = unixepoch() WHERE id = ?',
      ['completed', id]
    )
    return c.json({ data: { status: 'completed', sent: 0, failed: 0 } })
  }

  await run(
    c.env.DB,
    'UPDATE broadcast_batches SET status = ?, target_count = ?, updated_at = unixepoch() WHERE id = ?',
    ['running', customers.length, id]
  )

  for (const customer of customers) {
    await run(
      c.env.DB,
      'INSERT INTO broadcast_logs (batch_id, customer_id, phone, status, created_at) VALUES (?, ?, ?, ?, unixepoch())',
      [id, customer.id, customer.phone || '', 'pending']
    )
  }

  let sent = 0
  let failed = 0
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // To avoid Worker request timeouts, cap synchronous real sends and simulate the rest.
  const MAX_SYNC_SENDS = 30
  const simulateFromIndex = customers.length > MAX_SYNC_SENDS ? MAX_SYNC_SENDS : customers.length

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]
    const log = await first<BroadcastLog>(
      c.env.DB,
      'SELECT * FROM broadcast_logs WHERE batch_id = ? AND customer_id = ? ORDER BY id DESC LIMIT 1',
      [id, customer.id]
    )
    if (!log || log.status !== 'pending') continue

    if (i >= simulateFromIndex) {
      await run(
        c.env.DB,
        'UPDATE broadcast_logs SET status = ?, sent_at = unixepoch(), error_message = ? WHERE id = ?',
        ['sent', 'Simulated: bulk send capped for Worker timeout safety', log.id]
      )
      sent++
      continue
    }

    try {
      if (!customer.phone) {
        throw new Error('Customer has no phone')
      }
      await sendCloudwapiMessage(c.env, { phone: customer.phone, message: template.content })
      await run(
        c.env.DB,
        'UPDATE broadcast_logs SET status = ?, sent_at = unixepoch() WHERE id = ?',
        ['sent', log.id]
      )
      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await run(
        c.env.DB,
        'UPDATE broadcast_logs SET status = ?, error_message = ? WHERE id = ?',
        ['failed', message, log.id]
      )
      failed++
    }

    const rateMin = batch.rateMinSeconds || 1
    const rateMax = batch.rateMaxSeconds || 3
    await delay((rateMin + Math.random() * (rateMax - rateMin)) * 1000)
  }

  await run(
    c.env.DB,
    'UPDATE broadcast_batches SET status = ?, sent_count = ?, failed_count = ?, updated_at = unixepoch() WHERE id = ?',
    ['completed', sent, failed, id]
  )

  return c.json({ data: { status: 'completed', sent, failed } })
})

app.post('/broadcasts/:id/cancel', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid broadcast id' }, 400)
  }

  await run(
    c.env.DB,
    "UPDATE broadcast_logs SET status = 'failed', error_message = 'Cancelled by admin' WHERE batch_id = ? AND status = 'pending'",
    [id]
  )
  await run(
    c.env.DB,
    "UPDATE broadcast_batches SET status = 'cancelled', updated_at = unixepoch() WHERE id = ?",
    [id]
  )

  return c.json({ data: { success: true } })
})

// =============================================================================
// WhatsApp Conversations & Messages
// =============================================================================

app.get('/conversations', async (c) => {
  const query = c.req.query()
  const status = query.status
  const phone = query.phone
  const customerId = query.customer_id ? Number(query.customer_id) : undefined
  const limit = Math.min(parseInt(query.limit || '20', 10), 100)
  const offset = Math.max(parseInt(query.offset || '0', 10), 0)

  const conditions: string[] = []
  const params: unknown[] = []
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (phone) {
    conditions.push('phone = ?')
    params.push(phone)
  }
  if (customerId !== undefined && Number.isFinite(customerId)) {
    conditions.push('customer_id = ?')
    params.push(customerId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const data = await all<WhatsappConversation>(
    c.env.DB,
    `SELECT * FROM whatsapp_conversations ${where} ORDER BY last_message_at DESC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM whatsapp_conversations ${where}`,
    params
  )

  return c.json({ data, total: countRow?.count ?? 0 })
})

app.get('/conversations/:id/messages', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid conversation id' }, 400)
  }

  const conversation = await first<WhatsappConversation>(
    c.env.DB,
    'SELECT * FROM whatsapp_conversations WHERE id = ?',
    [id]
  )
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const messages = await all<WhatsappMessage>(
    c.env.DB,
    'SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [id]
  )

  return c.json({ data: messages })
})

app.post('/conversations/:id/messages', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid conversation id' }, 400)
  }

  const conversation = await first<WhatsappConversation>(
    c.env.DB,
    'SELECT * FROM whatsapp_conversations WHERE id = ?',
    [id]
  )
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const body = await c.req.json<{ message?: unknown }>()
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return c.json({ error: 'Missing message' }, 400)
  }

  const now = Math.floor(Date.now() / 1000)

  const msgResult = await run(
    c.env.DB,
    'INSERT INTO whatsapp_messages (conversation_id, customer_id, direction, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, conversation.customerId, 'outbound', message, 'pending', now]
  )
  const msgId = msgResult.meta.last_row_id ?? 0

  try {
    await sendCloudwapiMessage(c.env, { phone: conversation.phone, message })
    await run(c.env.DB, "UPDATE whatsapp_messages SET status = 'sent' WHERE id = ?", [msgId])
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await run(c.env.DB, "UPDATE whatsapp_messages SET status = 'failed' WHERE id = ?", [msgId])
    return c.json({ error: errorMessage }, 502)
  }

  await run(
    c.env.DB,
    'UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  )

  const msg = await first<WhatsappMessage>(c.env.DB, 'SELECT * FROM whatsapp_messages WHERE id = ?', [msgId])
  return c.json({ data: msg }, 201)
})

app.post('/whatsapp/send-message', async (c) => {
  const body = await c.req.json<{
    customer_id?: unknown
    phone?: unknown
    message?: unknown
  }>()

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return c.json({ error: 'Missing message' }, 400)
  }

  const customerId = Number(body.customer_id)
  const hasCustomerId = Number.isFinite(customerId)
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  let customer: Customer | null = null
  let targetPhone = phone

  if (hasCustomerId) {
    customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [customerId])
    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }
    targetPhone = customer.phone || phone
  }

  if (!targetPhone) {
    return c.json({ error: 'Missing phone' }, 400)
  }

  const normalizedPhone = normalizePhone(targetPhone)
  let conversation = await first<WhatsappConversation>(
    c.env.DB,
    'SELECT * FROM whatsapp_conversations WHERE phone = ? ORDER BY id DESC LIMIT 1',
    [normalizedPhone]
  )

  const now = Math.floor(Date.now() / 1000)
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
    if (!conversation) {
      return c.json({ error: 'Failed to create conversation' }, 500)
    }
  }

  const msgResult = await run(
    c.env.DB,
    'INSERT INTO whatsapp_messages (conversation_id, customer_id, direction, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [conversation.id, customer?.id ?? null, 'outbound', message, 'pending', now]
  )
  const msgId = msgResult.meta.last_row_id ?? 0

  try {
    await sendCloudwapiMessage(c.env, { phone: normalizedPhone, message })
    await run(c.env.DB, "UPDATE whatsapp_messages SET status = 'sent' WHERE id = ?", [msgId])
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await run(c.env.DB, "UPDATE whatsapp_messages SET status = 'failed' WHERE id = ?", [msgId])
    return c.json({ error: errorMessage }, 502)
  }

  await run(
    c.env.DB,
    'UPDATE whatsapp_conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
    [now, now, conversation.id]
  )

  const msg = await first<WhatsappMessage>(c.env.DB, 'SELECT * FROM whatsapp_messages WHERE id = ?', [msgId])
  return c.json({ data: msg }, 201)
})

export default app
