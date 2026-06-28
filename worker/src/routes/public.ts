import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import type { Booking, CmsArticle, Customer, Experience, LeadType, Payment, Property, Retreat, RoomType } from '../db/schema'
import { all, first, run } from '../lib/db'
import { notifyReferrerOnLead, notifyReferrerOnBookingInquiry } from './referral'

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

  const [roomTypes, experiences, retreats] = await Promise.all([
    all<RoomType>(
      c.env.DB,
      'SELECT * FROM room_types WHERE property_id = ? AND status = ? ORDER BY price_per_night ASC',
      [id, 'available']
    ),
    all<Experience>(
      c.env.DB,
      `SELECT e.* FROM experiences e
       INNER JOIN property_experiences pe ON pe.experience_id = e.id
       WHERE pe.property_id = ? AND e.status = ?
       ORDER BY e.sort_order ASC, e.created_at DESC`,
      [id, 'active']
    ),
    all<Retreat>(
      c.env.DB,
      `SELECT r.* FROM retreats r
       INNER JOIN property_retreats pr ON pr.retreat_id = r.id
       WHERE pr.property_id = ? AND r.status = ?
       ORDER BY r.sort_order ASC, r.created_at DESC`,
      [id, 'active']
    ),
  ])

  return c.json({ data: { ...property, roomTypes, experiences, retreats } })
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

// GET /api/public/experiences
app.get('/experiences', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 200)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)

  const experiences = await all<Experience>(
    c.env.DB,
    'SELECT * FROM experiences WHERE status = ? ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
    ['active', limit, offset]
  )
  return c.json({ data: experiences })
})

// GET /api/public/experiences/:slug
app.get('/experiences/:slug', async (c) => {
  const slug = c.req.param('slug')
  const experience = await first<Experience>(
    c.env.DB,
    'SELECT * FROM experiences WHERE slug = ? AND status = ?',
    [slug, 'active']
  )
  if (!experience) {
    return c.json({ error: 'Experience not found' }, 404)
  }
  return c.json({ data: experience })
})

// GET /api/public/retreats
app.get('/retreats', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 200)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)

  const retreats = await all<Retreat>(
    c.env.DB,
    'SELECT * FROM retreats WHERE status = ? ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
    ['active', limit, offset]
  )
  return c.json({ data: retreats })
})

// GET /api/public/retreats/:slug
app.get('/retreats/:slug', async (c) => {
  const slug = c.req.param('slug')
  const retreat = await first<Retreat>(
    c.env.DB,
    'SELECT * FROM retreats WHERE slug = ? AND status = ?',
    [slug, 'active']
  )
  if (!retreat) {
    return c.json({ error: 'Retreat not found' }, 404)
  }
  return c.json({ data: retreat })
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
    referral_code?: unknown
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
  const referralCode =
    typeof body.referral_code === 'string' ? body.referral_code.trim().toUpperCase() || null : null

  const result = await run(
    c.env.DB,
    `INSERT INTO leads
      (name, email, phone, lead_type, source, status, metadata, referral_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'new', ?, ?, unixepoch(), unixepoch())`,
    [name, email, phone, leadType, source, metadata, referralCode]
  )

  const leadId = result.meta.last_row_id ?? 0

  // Notify the referrer immediately when a referred visitor leaves contact info.
  // This keeps partners motivated before the deal closes.
  c.executionCtx.waitUntil(
    notifyReferrerOnLead(c.env, {
      name,
      email,
      phone,
      referralCode,
    })
  )

  return c.json({ data: { id: leadId, status: 'new' } }, 201)
})

function toUnixEpoch(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Math.floor(value)
  if (typeof value === 'string') {
    const n = parseInt(value, 10)
    if (String(n) === value && Number.isFinite(n)) return n
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000)
  }
  return null
}

// GET /api/public/bookings
app.get('/bookings', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ data: [], total: 0 })

  const customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE email = ?', [email])
  if (!customer) return c.json({ data: [], total: 0 })

  const bookings = await all<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC',
    [customer.id]
  )
  return c.json({ data: bookings, total: bookings.length })
})

// GET /api/public/bookings/:id
app.get('/bookings/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const booking = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!booking) return c.json({ error: 'Booking not found' }, 404)

  const [property, roomType] = await Promise.all([
    first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [booking.propertyId]),
    first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [booking.roomTypeId]),
  ])

  return c.json({ data: { ...booking, property, roomType } })
})

function generateToken(length = 16): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// GET /api/public/bookings/token/:token — guest order lookup by secret token
app.get('/bookings/token/:token', async (c) => {
  const token = c.req.param('token')
  if (!token) return c.json({ error: 'Missing token' }, 400)

  const booking = await first<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE token = ?',
    [token]
  )
  if (!booking) return c.json({ error: 'Booking not found' }, 404)

  const [customer, property, roomType, payments] = await Promise.all([
    booking.customerId
      ? first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [booking.customerId])
      : Promise.resolve(null),
    first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [booking.propertyId]),
    first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [booking.roomTypeId]),
    all<Payment>(c.env.DB, 'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC', [booking.id]),
  ])

  return c.json({ data: { ...booking, customer, property, roomType, payments } })
})

// POST /api/public/bookings
app.post('/bookings', async (c) => {
  const body = await c.req.json<Record<string, unknown>>()

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() || null : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const propertyId = Number(body.property_id)
  const roomTypeId = Number(body.room_type_id)
  const guests = Number(body.guests) || 1
  const totalAmount = Number(body.total_amount) || 0
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'HKD'
  const voucherCode = typeof body.voucher_code === 'string' ? body.voucher_code.trim() || null : null
  const addons = Array.isArray(body.addons) ? JSON.stringify(body.addons) : '[]'
  const referralCode = typeof body.referral_code === 'string' ? body.referral_code.trim().toUpperCase() || null : null
  const checkIn = toUnixEpoch(body.check_in)
  const checkOut = toUnixEpoch(body.check_out)

  if (!email) return c.json({ error: 'Missing required field: email' }, 400)
  if (!Number.isFinite(propertyId)) return c.json({ error: 'Missing or invalid property_id' }, 400)
  if (!Number.isFinite(roomTypeId)) return c.json({ error: 'Missing or invalid room_type_id' }, 400)
  if (checkIn == null) return c.json({ error: 'Missing or invalid check_in' }, 400)
  if (checkOut == null) return c.json({ error: 'Missing or invalid check_out' }, 400)

  let customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE email = ?', [email])
  if (!customer) {
    const result = await run(
      c.env.DB,
      'INSERT INTO customers (name, email, phone, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())',
      [name, email, phone]
    )
    customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [
      result.meta.last_row_id,
    ])
  }

  const paymentDeadline = Math.floor(Date.now() / 1000) + 48 * 60 * 60 // 48 hours
  const token = generateToken()

  const result = await run(
    c.env.DB,
    `INSERT INTO bookings
      (customer_id, property_id, room_type_id, check_in, check_out, guests, total_amount, currency, status, payment_status, voucher_code, addons, referral_code, supplier_status, payment_deadline, token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?, 'pending', ?, ?, unixepoch(), unixepoch())`,
    [customer?.id ?? null, propertyId, roomTypeId, checkIn, checkOut, guests, totalAmount, currency, voucherCode, addons, referralCode, paymentDeadline, token]
  )

  const booking = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [
    result.meta.last_row_id,
  ])

  // Notify referrer as soon as a referred visitor submits a booking inquiry.
  // This gives them early momentum before the deal actually closes.
  if (booking && booking.referralCode) {
    c.executionCtx.waitUntil(
      notifyReferrerOnBookingInquiry(c.env, {
        id: booking.id,
        phone: phone,
        token: booking.token,
        referralCode: booking.referralCode,
      })
    )
  }

  return c.json({ data: booking }, 201)
})

// PATCH /api/public/bookings/:id/cancel
app.patch('/bookings/:id/cancel', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  await run(c.env.DB, "UPDATE bookings SET status = 'cancelled', updated_at = unixepoch() WHERE id = ?", [id])

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  return c.json({ data: updated })
})

export default app
