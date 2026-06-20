import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import type { CmsArticle, LeadType, Property, RoomType } from '../db/schema'
import { all, first, run } from '../lib/db'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/public/properties
app.get('/properties', async (c) => {
  const properties = await all<Property>(
    c.env.DB,
    'SELECT * FROM properties WHERE status = ? ORDER BY created_at DESC',
    ['active']
  )
  return c.json({ data: properties })
})

// GET /api/public/properties/:id
app.get('/properties/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid property id' }, 400)
  }

  const property = await first<Property>(
    c.env.DB,
    'SELECT * FROM properties WHERE id = ? AND status = ?',
    [id, 'active']
  )
  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const roomTypes = await all<RoomType>(
    c.env.DB,
    'SELECT * FROM room_types WHERE property_id = ? AND status = ? ORDER BY price_per_night ASC',
    [id, 'available']
  )

  return c.json({ data: { ...property, roomTypes } })
})

// GET /api/public/articles
app.get('/articles', async (c) => {
  const category = c.req.query('category')
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)

  const baseSql = 'FROM cms_articles WHERE status = ?'
  const params: unknown[] = ['published']
  const countParams: unknown[] = ['published']

  let filterSql = baseSql
  if (category) {
    filterSql += ' AND category = ?'
    params.push(category)
    countParams.push(category)
  }

  const articles = await all<CmsArticle>(
    c.env.DB,
    `SELECT * ${filterSql} ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count ${filterSql}`,
    countParams
  )
  const total = countRow?.count ?? 0

  return c.json({ data: articles, total })
})

// GET /api/public/articles/:slug
app.get('/articles/:slug', async (c) => {
  const slug = c.req.param('slug')
  const article = await first<CmsArticle>(
    c.env.DB,
    'SELECT * FROM cms_articles WHERE slug = ? AND status = ?',
    [slug, 'published']
  )
  if (!article) {
    return c.json({ error: 'Article not found' }, 404)
  }
  return c.json({ data: article })
})

// POST /api/public/inquiries
app.post('/inquiries', async (c) => {
  const body = await c.req.json<{
    name?: unknown
    email?: unknown
    phone?: unknown
    subject?: unknown
    message?: unknown
    property_id?: unknown
    room_type_id?: unknown
  }>()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !subject || !message) {
    return c.json({ error: 'Missing required fields: name, email, subject, message' }, 400)
  }

  const propertyId = body.property_id ? Number(body.property_id) : null
  const roomTypeId = body.room_type_id ? Number(body.room_type_id) : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null

  const result = await run(
    c.env.DB,
    `INSERT INTO inquiries
      (name, email, phone, subject, message, property_id, room_type_id, status, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'medium', unixepoch(), unixepoch())`,
    [name, email, phone, subject, message, propertyId, roomTypeId]
  )

  return c.json({ data: { id: result.meta.last_row_id, status: 'new' } }, 201)
})

// POST /api/public/leads
app.post('/leads', async (c) => {
  const body = await c.req.json<{
    email?: unknown
    lead_type?: unknown
    name?: unknown
    phone?: unknown
    source?: unknown
    metadata?: unknown
  }>()

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const leadType = typeof body.lead_type === 'string' ? body.lead_type : ''
  const validLeadTypes: LeadType[] = [
    'experience_inquiry',
    'island_owner_talk',
    'inspiration_guide',
  ]

  if (!email || !validLeadTypes.includes(leadType as LeadType)) {
    return c.json(
      { error: 'Missing or invalid fields: email, lead_type' },
      400
    )
  }

  const name = typeof body.name === 'string' ? body.name.trim() || null : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const source = typeof body.source === 'string' ? body.source.trim() || null : null
  const metadata =
    body.metadata && typeof body.metadata === 'object'
      ? JSON.stringify(body.metadata)
      : null

  const result = await run(
    c.env.DB,
    `INSERT INTO leads
      (name, email, phone, lead_type, source, status, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'new', ?, unixepoch(), unixepoch())`,
    [name, email, phone, leadType, source, metadata]
  )

  return c.json({ data: { id: result.meta.last_row_id, status: 'new' } }, 201)
})

export default app
