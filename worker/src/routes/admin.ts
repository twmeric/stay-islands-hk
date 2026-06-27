import { Hono } from 'hono'
import bcryptjs from 'bcryptjs'
import type { Bindings, Variables } from '../types'
import { all, first, run } from '../lib/db'
import {
  requireAdmin,
  requireRole,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth'
import type {
  Admin,
  AdminRole,
  ArticleStatus,
  Booking,
  BookingStatus,
  Coupon,
  CouponStatus,
  CmsArticle,
  CouponDiscountType,
  Customer,
  Experience,
  Inquiry,
  InquiryPriority,
  InquiryStatus,
  Lead,
  LeadStatus,
  LeadType,
  Payment,
  PaymentGateway,
  Property,
  PropertyStatus,
  Retreat,
  RoomType,
  RoomTypeStatus,
  TransactionStatus,
} from '../db/schema'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ============================================================================
// Helpers
// ============================================================================

function parseIntParam(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? String(fallback), 10)
  return Number.isFinite(n) ? n : fallback
}

function toJson(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

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

async function logAudit(
  db: D1Database,
  opts: {
    adminId: number | null
    action: string
    targetTable: string
    targetId?: string | number | null
    before?: unknown
    after?: unknown
    ip?: string | null
  }
): Promise<void> {
  await run(
    db,
    `INSERT INTO audit_logs
      (admin_id, action, target_table, target_id, before_json, after_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    [
      opts.adminId ?? null,
      opts.action,
      opts.targetTable,
      opts.targetId != null ? String(opts.targetId) : null,
      opts.before ? JSON.stringify(opts.before as Record<string, unknown>) : null,
      opts.after ? JSON.stringify(opts.after as Record<string, unknown>) : null,
      opts.ip ?? null,
    ]
  )
}

// ============================================================================
// Auth
// ============================================================================

app.post('/auth/login', async (c) => {
  const body = await c.req.json<{ email?: unknown; password?: unknown }>()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return c.json({ error: 'Missing email or password' }, 401)
  }

  const admin = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE email = ?', [email])
  if (!admin || admin.isActive !== 1) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const ok = await bcryptjs.compare(password, admin.passwordHash)
  if (!ok) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  await run(c.env.DB, 'UPDATE admins SET last_login = unixepoch(), updated_at = unixepoch() WHERE id = ?', [
    admin.id,
  ])

  const payload = { adminId: admin.id, email: admin.email, role: admin.role }
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(c.env, payload),
    signRefreshToken(c.env, payload),
  ])

  await logAudit(c.env.DB, {
    adminId: admin.id,
    action: 'login',
    targetTable: 'admins',
    targetId: admin.id,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({
    data: {
      accessToken,
      refreshToken,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    },
  })
})

app.post('/auth/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken?: unknown }>()
  const token = typeof body.refreshToken === 'string' ? body.refreshToken : ''
  if (!token) {
    return c.json({ error: 'Missing refresh token' }, 401)
  }
  const payload = await verifyRefreshToken(c.env, token)
  if (!payload) {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }
  const accessToken = await signAccessToken(c.env, {
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role,
  })
  return c.json({ data: { accessToken } })
})

app.get('/auth/me', requireAdmin, async (c) => {
  const admin = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [c.get('adminId')!])
  if (!admin) {
    return c.json({ error: 'Admin not found' }, 404)
  }
  const { passwordHash: _, ...safe } = admin
  return c.json({ data: safe })
})

app.post('/auth/logout', requireAdmin, async (c) => {
  const auth = c.req.header('Authorization')
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (token && c.env.CACHE) {
    try {
      await c.env.CACHE.put(`logout:${token}`, '1', { expirationTtl: 15 * 60 })
    } catch {
      // Optional: ignore KV errors
    }
  }
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'logout',
    targetTable: 'admins',
    targetId: c.get('adminId'),
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })
  return c.json({ data: { ok: true } })
})

// GET /api/admin/check - verify current admin session and role
app.get('/check', requireAdmin, async (c) => {
  return c.json({
    data: {
      isAdmin: true,
      role: c.get('adminRole') ?? null,
      adminId: c.get('adminId') ?? null,
    },
  })
})


// ============================================================================
// Dashboard
// ============================================================================

app.get('/dashboard', requireAdmin, async (c) => {
  const db = c.env.DB
  const [
    totalInquiries,
    totalLeads,
    totalBookings,
    totalCustomers,
    totalRevenue,
    pendingInquiries,
    upcomingCheckIns,
  ] = await Promise.all([
    first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM inquiries'),
    first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM leads'),
    first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM bookings'),
    first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM customers'),
    first<{ total: number }>(db, "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'succeeded'"),
    first<{ count: number }>(db, "SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'"),
    first<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM bookings WHERE check_in >= unixepoch() AND status != ?',
      ['cancelled']
    ),
  ])

  const recentActivities = await all<{
    id: number
    adminId: number | null
    action: string
    targetTable: string
    targetId: string | null
    createdAt: number
  }>(db, 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5')

  return c.json({
    data: {
      totalInquiries: totalInquiries?.count ?? 0,
      totalLeads: totalLeads?.count ?? 0,
      totalBookings: totalBookings?.count ?? 0,
      totalCustomers: totalCustomers?.count ?? 0,
      totalRevenue: totalRevenue?.total ?? 0,
      pendingInquiries: pendingInquiries?.count ?? 0,
      upcomingCheckIns: upcomingCheckIns?.count ?? 0,
      recentActivities,
    },
  })
})


// ============================================================================
// Properties
// ============================================================================

app.get('/properties', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  const properties = await all<Property>(
    c.env.DB,
    `SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM properties ${where}`,
    params
  )
  return c.json({ data: properties, total: countRow?.count ?? 0 })
})

app.get('/properties/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid property id' }, 400)

  const property = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [id])
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const roomTypes = await all<RoomType>(
    c.env.DB,
    'SELECT * FROM room_types WHERE property_id = ? ORDER BY price_per_night ASC',
    [id]
  )
  return c.json({ data: { ...property, roomTypes } })
})

app.post('/properties', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const nameZh = typeof body.nameZh === 'string' ? body.nameZh.trim() : ''
  if (!name || !nameZh) {
    return c.json({ error: 'Missing required fields: name, nameZh' }, 400)
  }

  const status: PropertyStatus =
    typeof body.status === 'string' && ['active', 'inactive', 'draft'].includes(body.status)
      ? (body.status as PropertyStatus)
      : 'draft'

  const result = await run(
    c.env.DB,
    `INSERT INTO properties
      (name, name_zh, description, description_zh, location, price_per_night, max_guests, image_url, amenities, gallery, facilities, activities, location_details, story, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      name,
      nameZh,
      typeof body.description === 'string' ? body.description.trim() || null : null,
      typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null,
      typeof body.location === 'string' ? body.location.trim() || null : null,
      Number(body.pricePerNight) || 0,
      body.maxGuests != null ? Number(body.maxGuests) : null,
      typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
      toJson(body.amenities),
      toJson(body.gallery),
      toJson(body.facilities),
      toJson(body.activities),
      toJson(body.locationDetails),
      toJson(body.story),
      status,
    ]
  )

  const property = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [
    result.meta.last_row_id,
  ])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'properties',
    targetId: result.meta.last_row_id,
    after: property as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: property }, 201)
})

app.put('/properties/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid property id' }, 400)

  const existing = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Property not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    fields.push('name = ?')
    values.push(String(body.name).trim())
  }
  if (body.nameZh !== undefined) {
    fields.push('name_zh = ?')
    values.push(String(body.nameZh).trim())
  }
  if (body.description !== undefined) {
    fields.push('description = ?')
    values.push(typeof body.description === 'string' ? body.description.trim() || null : null)
  }
  if (body.descriptionZh !== undefined) {
    fields.push('description_zh = ?')
    values.push(typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null)
  }
  if (body.location !== undefined) {
    fields.push('location = ?')
    values.push(typeof body.location === 'string' ? body.location.trim() || null : null)
  }
  if (body.pricePerNight !== undefined) {
    fields.push('price_per_night = ?')
    values.push(Number(body.pricePerNight) || 0)
  }
  if (body.maxGuests !== undefined) {
    fields.push('max_guests = ?')
    values.push(body.maxGuests != null ? Number(body.maxGuests) : null)
  }
  if (body.imageUrl !== undefined) {
    fields.push('image_url = ?')
    values.push(typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null)
  }
  if (body.amenities !== undefined) {
    fields.push('amenities = ?')
    values.push(toJson(body.amenities))
  }
  if (body.gallery !== undefined) {
    fields.push('gallery = ?')
    values.push(toJson(body.gallery))
  }
  if (body.facilities !== undefined) {
    fields.push('facilities = ?')
    values.push(toJson(body.facilities))
  }
  if (body.activities !== undefined) {
    fields.push('activities = ?')
    values.push(toJson(body.activities))
  }
  if (body.locationDetails !== undefined) {
    fields.push('location_details = ?')
    values.push(toJson(body.locationDetails))
  }
  if (body.story !== undefined) {
    fields.push('story = ?')
    values.push(toJson(body.story))
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }
  if (body.cancellationPolicy !== undefined) {
    fields.push('cancellation_policy = ?')
    values.push(toJson(body.cancellationPolicy))
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'properties',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/properties/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid property id' }, 400)

  const existing = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Property not found' }, 404)

  await run(c.env.DB, 'DELETE FROM properties WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'properties',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Room Types
// ============================================================================

app.get('/properties/:id/room-types', requireAdmin, async (c) => {
  const propertyId = Number(c.req.param('id'))
  if (!Number.isFinite(propertyId)) return c.json({ error: 'Invalid property id' }, 400)

  const roomTypes = await all<RoomType>(
    c.env.DB,
    'SELECT * FROM room_types WHERE property_id = ? ORDER BY price_per_night ASC',
    [propertyId]
  )
  return c.json({ data: roomTypes })
})

app.post('/properties/:id/room-types', requireAdmin, async (c) => {
  const propertyId = Number(c.req.param('id'))
  if (!Number.isFinite(propertyId)) return c.json({ error: 'Invalid property id' }, 400)

  const body = await c.req.json<Record<string, unknown>>()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const nameZh = typeof body.nameZh === 'string' ? body.nameZh.trim() : ''
  if (!name || !nameZh) {
    return c.json({ error: 'Missing required fields: name, nameZh' }, 400)
  }

  const status: RoomTypeStatus =
    typeof body.status === 'string' && ['available', 'unavailable', 'hidden'].includes(body.status)
      ? (body.status as RoomTypeStatus)
      : 'available'

  const result = await run(
    c.env.DB,
    `INSERT INTO room_types
      (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities, bed_type, view, size_sqm, occupancy, gallery, features, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      propertyId,
      name,
      nameZh,
      typeof body.description === 'string' ? body.description.trim() || null : null,
      typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null,
      Number(body.pricePerNight) || 0,
      body.maxGuests != null ? Number(body.maxGuests) : null,
      Number(body.inventory) || 1,
      typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
      toJson(body.amenities),
      typeof body.bedType === 'string' ? body.bedType.trim() || null : null,
      typeof body.view === 'string' ? body.view.trim() || null : null,
      body.sizeSqm != null ? Number(body.sizeSqm) : null,
      typeof body.occupancy === 'string' ? body.occupancy.trim() || null : null,
      toJson(body.gallery),
      toJson(body.features),
      status,
    ]
  )

  const roomType = await first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'room_types',
    targetId: result.meta.last_row_id,
    after: roomType as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: roomType }, 201)
})

app.put('/room-types/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid room type id' }, 400)

  const existing = await first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Room type not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    fields.push('name = ?')
    values.push(String(body.name).trim())
  }
  if (body.nameZh !== undefined) {
    fields.push('name_zh = ?')
    values.push(String(body.nameZh).trim())
  }
  if (body.description !== undefined) {
    fields.push('description = ?')
    values.push(typeof body.description === 'string' ? body.description.trim() || null : null)
  }
  if (body.descriptionZh !== undefined) {
    fields.push('description_zh = ?')
    values.push(typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null)
  }
  if (body.pricePerNight !== undefined) {
    fields.push('price_per_night = ?')
    values.push(Number(body.pricePerNight) || 0)
  }
  if (body.maxGuests !== undefined) {
    fields.push('max_guests = ?')
    values.push(body.maxGuests != null ? Number(body.maxGuests) : null)
  }
  if (body.inventory !== undefined) {
    fields.push('inventory = ?')
    values.push(Number(body.inventory) || 1)
  }
  if (body.imageUrl !== undefined) {
    fields.push('image_url = ?')
    values.push(typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null)
  }
  if (body.amenities !== undefined) {
    fields.push('amenities = ?')
    values.push(toJson(body.amenities))
  }
  if (body.bedType !== undefined) {
    fields.push('bed_type = ?')
    values.push(typeof body.bedType === 'string' ? body.bedType.trim() || null : null)
  }
  if (body.view !== undefined) {
    fields.push('view = ?')
    values.push(typeof body.view === 'string' ? body.view.trim() || null : null)
  }
  if (body.sizeSqm !== undefined) {
    fields.push('size_sqm = ?')
    values.push(body.sizeSqm != null ? Number(body.sizeSqm) : null)
  }
  if (body.occupancy !== undefined) {
    fields.push('occupancy = ?')
    values.push(typeof body.occupancy === 'string' ? body.occupancy.trim() || null : null)
  }
  if (body.gallery !== undefined) {
    fields.push('gallery = ?')
    values.push(toJson(body.gallery))
  }
  if (body.features !== undefined) {
    fields.push('features = ?')
    values.push(toJson(body.features))
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!['available', 'unavailable', 'hidden'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }
  if (body.cancellationPolicy !== undefined) {
    fields.push('cancellation_policy = ?')
    values.push(toJson(body.cancellationPolicy))
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE room_types SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'room_types',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/room-types/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid room type id' }, 400)

  const existing = await first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Room type not found' }, 404)

  await run(c.env.DB, 'DELETE FROM room_types WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'room_types',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Experiences
// ============================================================================

const validExperienceStatuses = ['active', 'inactive']

app.get('/experiences', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 100), 200)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  let where = 'WHERE 1=1'
  const params: unknown[] = []
  if (status && validExperienceStatuses.includes(status)) {
    where += ' AND status = ?'
    params.push(status)
  }

  const experiences = await all<Experience>(
    c.env.DB,
    `SELECT * FROM experiences ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(c.env.DB, `SELECT COUNT(*) as count FROM experiences ${where}`, params)
  return c.json({ data: experiences, total: countRow?.count ?? 0 })
})

app.get('/experiences/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid experience id' }, 400)

  const experience = await first<Experience>(c.env.DB, 'SELECT * FROM experiences WHERE id = ?', [id])
  if (!experience) return c.json({ error: 'Experience not found' }, 404)
  return c.json({ data: experience })
})

app.post('/experiences', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const nameZh = typeof body.nameZh === 'string' ? body.nameZh.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!name || !nameZh || !slug) {
    return c.json({ error: 'Missing required fields: name, nameZh, slug' }, 400)
  }

  const status = validExperienceStatuses.includes(String(body.status)) ? String(body.status) : 'active'

  const result = await run(
    c.env.DB,
    `INSERT INTO experiences
      (name, name_zh, slug, description, description_zh, duration, group_size, includes, price_note, image_url, icon_name, sort_order, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      name,
      nameZh,
      slug,
      typeof body.description === 'string' ? body.description.trim() || null : null,
      typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null,
      typeof body.duration === 'string' ? body.duration.trim() || null : null,
      typeof body.groupSize === 'string' ? body.groupSize.trim() || null : null,
      toJson(body.includes),
      typeof body.priceNote === 'string' ? body.priceNote.trim() || null : null,
      typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
      typeof body.iconName === 'string' ? body.iconName.trim() || null : null,
      Number(body.sortOrder) || 0,
      status,
    ]
  )

  const experience = await first<Experience>(c.env.DB, 'SELECT * FROM experiences WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'experiences',
    targetId: result.meta.last_row_id,
    after: experience as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: experience }, 201)
})

app.put('/experiences/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid experience id' }, 400)

  const existing = await first<Experience>(c.env.DB, 'SELECT * FROM experiences WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Experience not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fieldMap: Record<string, string> = {
    name: 'name',
    nameZh: 'name_zh',
    slug: 'slug',
    description: 'description',
    descriptionZh: 'description_zh',
    duration: 'duration',
    groupSize: 'group_size',
    includes: 'includes',
    priceNote: 'price_note',
    imageUrl: 'image_url',
    iconName: 'icon_name',
    sortOrder: 'sort_order',
    status: 'status',
  }

  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      fields.push(`${dbKey} = ?`)
      if (['includes'].includes(key)) {
        values.push(toJson(body[key]))
      } else if (key === 'sortOrder') {
        values.push(Number(body[key]) || 0)
      } else if (key === 'status') {
        const s = String(body[key])
        if (!validExperienceStatuses.includes(s)) {
          return c.json({ error: 'Invalid status' }, 400)
        }
        values.push(s)
      } else {
        values.push(typeof body[key] === 'string' ? String(body[key]).trim() || null : null)
      }
    }
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE experiences SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Experience>(c.env.DB, 'SELECT * FROM experiences WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'experiences',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/experiences/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid experience id' }, 400)

  const existing = await first<Experience>(c.env.DB, 'SELECT * FROM experiences WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Experience not found' }, 404)

  await run(c.env.DB, 'DELETE FROM experiences WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'experiences',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Retreats
// ============================================================================

const validRetreatStatuses = ['active', 'inactive']

app.get('/retreats', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 100), 200)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  let where = 'WHERE 1=1'
  const params: unknown[] = []
  if (status && validRetreatStatuses.includes(status)) {
    where += ' AND status = ?'
    params.push(status)
  }

  const retreats = await all<Retreat>(
    c.env.DB,
    `SELECT * FROM retreats ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const countRow = await first<{ count: number }>(c.env.DB, `SELECT COUNT(*) as count FROM retreats ${where}`, params)
  return c.json({ data: retreats, total: countRow?.count ?? 0 })
})

app.get('/retreats/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid retreat id' }, 400)

  const retreat = await first<Retreat>(c.env.DB, 'SELECT * FROM retreats WHERE id = ?', [id])
  if (!retreat) return c.json({ error: 'Retreat not found' }, 404)
  return c.json({ data: retreat })
})

app.post('/retreats', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const nameZh = typeof body.nameZh === 'string' ? body.nameZh.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!name || !nameZh || !slug) {
    return c.json({ error: 'Missing required fields: name, nameZh, slug' }, 400)
  }

  const status = validRetreatStatuses.includes(String(body.status)) ? String(body.status) : 'active'

  const result = await run(
    c.env.DB,
    `INSERT INTO retreats
      (name, name_zh, slug, description, description_zh, duration, location, audience, itinerary, price_note, image_url, icon_name, sort_order, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      name,
      nameZh,
      slug,
      typeof body.description === 'string' ? body.description.trim() || null : null,
      typeof body.descriptionZh === 'string' ? body.descriptionZh.trim() || null : null,
      typeof body.duration === 'string' ? body.duration.trim() || null : null,
      typeof body.location === 'string' ? body.location.trim() || null : null,
      typeof body.audience === 'string' ? body.audience.trim() || null : null,
      toJson(body.itinerary),
      typeof body.priceNote === 'string' ? body.priceNote.trim() || null : null,
      typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
      typeof body.iconName === 'string' ? body.iconName.trim() || null : null,
      Number(body.sortOrder) || 0,
      status,
    ]
  )

  const retreat = await first<Retreat>(c.env.DB, 'SELECT * FROM retreats WHERE id = ?', [result.meta.last_row_id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'retreats',
    targetId: result.meta.last_row_id,
    after: retreat as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: retreat }, 201)
})

app.put('/retreats/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid retreat id' }, 400)

  const existing = await first<Retreat>(c.env.DB, 'SELECT * FROM retreats WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Retreat not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fieldMap: Record<string, string> = {
    name: 'name',
    nameZh: 'name_zh',
    slug: 'slug',
    description: 'description',
    descriptionZh: 'description_zh',
    duration: 'duration',
    location: 'location',
    audience: 'audience',
    itinerary: 'itinerary',
    priceNote: 'price_note',
    imageUrl: 'image_url',
    iconName: 'icon_name',
    sortOrder: 'sort_order',
    status: 'status',
  }

  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      fields.push(`${dbKey} = ?`)
      if (['itinerary'].includes(key)) {
        values.push(toJson(body[key]))
      } else if (key === 'sortOrder') {
        values.push(Number(body[key]) || 0)
      } else if (key === 'status') {
        const s = String(body[key])
        if (!validRetreatStatuses.includes(s)) {
          return c.json({ error: 'Invalid status' }, 400)
        }
        values.push(s)
      } else {
        values.push(typeof body[key] === 'string' ? String(body[key]).trim() || null : null)
      }
    }
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE retreats SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Retreat>(c.env.DB, 'SELECT * FROM retreats WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'retreats',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/retreats/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid retreat id' }, 400)

  const existing = await first<Retreat>(c.env.DB, 'SELECT * FROM retreats WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Retreat not found' }, 404)

  await run(c.env.DB, 'DELETE FROM retreats WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'retreats',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})


// ============================================================================
// Inquiries
// ============================================================================

const validInquiryStatuses: InquiryStatus[] = ['new', 'contacted', 'qualified', 'closed', 'spam']
const validInquiryPriorities: InquiryPriority[] = ['low', 'medium', 'high', 'urgent']

app.get('/inquiries', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const priority = c.req.query('priority')
  const assignedAdminId = c.req.query('assigned_admin_id')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (priority) {
    where += ' AND priority = ?'
    params.push(priority)
  }
  if (assignedAdminId) {
    where += ' AND assigned_admin_id = ?'
    params.push(Number(assignedAdminId))
  }

  const inquiries = await all<Inquiry>(
    c.env.DB,
    `SELECT * FROM inquiries ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM inquiries ${where}`,
    params
  )
  return c.json({ data: inquiries, total: countRow?.count ?? 0 })
})

app.get('/inquiries/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid inquiry id' }, 400)

  const inquiry = await first<Inquiry>(c.env.DB, 'SELECT * FROM inquiries WHERE id = ?', [id])
  if (!inquiry) return c.json({ error: 'Inquiry not found' }, 404)
  return c.json({ data: inquiry })
})

app.patch('/inquiries/:id/status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid inquiry id' }, 400)

  const body = await c.req.json<{ status?: unknown }>()
  const status = typeof body.status === 'string' ? body.status : ''
  if (!validInquiryStatuses.includes(status as InquiryStatus)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  const existing = await first<Inquiry>(c.env.DB, 'SELECT * FROM inquiries WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Inquiry not found' }, 404)

  await run(c.env.DB, 'UPDATE inquiries SET status = ?, updated_at = unixepoch() WHERE id = ?', [
    status,
    id,
  ])
  const updated = await first<Inquiry>(c.env.DB, 'SELECT * FROM inquiries WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update_status',
    targetTable: 'inquiries',
    targetId: id,
    before: { status: existing.status },
    after: { status: updated?.status },
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.patch('/inquiries/:id/assign', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid inquiry id' }, 400)

  const body = await c.req.json<{ assigned_admin_id?: unknown }>()
  const assignedAdminId =
    body.assigned_admin_id != null ? Number(body.assigned_admin_id) : null
  if (assignedAdminId != null && !Number.isFinite(assignedAdminId)) {
    return c.json({ error: 'Invalid assigned_admin_id' }, 400)
  }

  const existing = await first<Inquiry>(c.env.DB, 'SELECT * FROM inquiries WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Inquiry not found' }, 404)

  await run(c.env.DB, 'UPDATE inquiries SET assigned_admin_id = ?, updated_at = unixepoch() WHERE id = ?', [
    assignedAdminId,
    id,
  ])
  const updated = await first<Inquiry>(c.env.DB, 'SELECT * FROM inquiries WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'assign',
    targetTable: 'inquiries',
    targetId: id,
    before: { assignedAdminId: existing.assignedAdminId },
    after: { assignedAdminId: updated?.assignedAdminId },
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

// ============================================================================
// Leads
// ============================================================================

const validLeadStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'archived']
const validLeadTypes: LeadType[] = ['experience_inquiry', 'island_owner_talk', 'inspiration_guide']

app.get('/leads', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const leadType = c.req.query('lead_type')
  const source = c.req.query('source')
  const assignedAdminId = c.req.query('assigned_admin_id')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (leadType) {
    where += ' AND lead_type = ?'
    params.push(leadType)
  }
  if (source) {
    where += ' AND source = ?'
    params.push(source)
  }
  if (assignedAdminId) {
    where += ' AND assigned_admin_id = ?'
    params.push(Number(assignedAdminId))
  }

  const leads = await all<Lead>(
    c.env.DB,
    `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM leads ${where}`,
    params
  )
  return c.json({ data: leads, total: countRow?.count ?? 0 })
})

app.get('/leads/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid lead id' }, 400)

  const lead = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])
  if (!lead) return c.json({ error: 'Lead not found' }, 404)
  return c.json({ data: lead })
})

app.patch('/leads/:id/status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid lead id' }, 400)

  const body = await c.req.json<{ status?: unknown }>()
  const status = typeof body.status === 'string' ? body.status : ''
  if (!validLeadStatuses.includes(status as LeadStatus)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  const existing = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Lead not found' }, 404)

  await run(c.env.DB, 'UPDATE leads SET status = ?, updated_at = unixepoch() WHERE id = ?', [status, id])
  const updated = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update_status',
    targetTable: 'leads',
    targetId: id,
    before: { status: existing.status },
    after: { status: updated?.status },
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.patch('/leads/:id/assign', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid lead id' }, 400)

  const body = await c.req.json<{ assigned_admin_id?: unknown }>()
  const assignedAdminId =
    body.assigned_admin_id != null ? Number(body.assigned_admin_id) : null
  if (assignedAdminId != null && !Number.isFinite(assignedAdminId)) {
    return c.json({ error: 'Invalid assigned_admin_id' }, 400)
  }

  const existing = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Lead not found' }, 404)

  await run(c.env.DB, 'UPDATE leads SET assigned_admin_id = ?, updated_at = unixepoch() WHERE id = ?', [
    assignedAdminId,
    id,
  ])
  const updated = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'assign',
    targetTable: 'leads',
    targetId: id,
    before: { assignedAdminId: existing.assignedAdminId },
    after: { assignedAdminId: updated?.assignedAdminId },
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.patch('/leads/:id/notes', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid lead id' }, 400)

  const body = await c.req.json<{ notes?: unknown }>()
  const newNotes = typeof body.notes === 'string' ? body.notes.trim() : ''

  const existing = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Lead not found' }, 404)

  const timestamp = new Date().toISOString()
  const append = `[${timestamp}] ${newNotes}`
  const currentNotes = existing.notes ? existing.notes + '\n' + append : append

  await run(c.env.DB, 'UPDATE leads SET notes = ?, updated_at = unixepoch() WHERE id = ?', [
    currentNotes,
    id,
  ])
  const updated = await first<Lead>(c.env.DB, 'SELECT * FROM leads WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update_notes',
    targetTable: 'leads',
    targetId: id,
    before: { notes: existing.notes },
    after: { notes: updated?.notes },
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})


// ============================================================================
// Bookings
// ============================================================================

const validBookingStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed']

function parseBookingBody(body: Record<string, unknown>): {
  customerId: number | null
  propertyId: number
  roomTypeId: number
  checkIn: number
  checkOut: number
  guests: number
  totalAmount: number
  currency: string
  status: BookingStatus
  voucherCode: string | null
  addons: string
  paymentMethod: string | null
  paymentReference: string | null
  paymentDeadline: number | null
  supplierStatus: string
  adminNotes: string | null
} {
  const propertyId = Number(body.propertyId)
  const roomTypeId = Number(body.roomTypeId)
  const checkIn = toUnixEpoch(body.checkIn)
  const checkOut = toUnixEpoch(body.checkOut)

  if (!Number.isFinite(propertyId)) throw new Error('Missing or invalid property_id')
  if (!Number.isFinite(roomTypeId)) throw new Error('Missing or invalid room_type_id')
  if (checkIn == null) throw new Error('Missing or invalid check_in')
  if (checkOut == null) throw new Error('Missing or invalid check_out')

  const status: BookingStatus =
    typeof body.status === 'string' && validBookingStatuses.includes(body.status as BookingStatus)
      ? (body.status as BookingStatus)
      : 'pending'

  return {
    customerId: body.customerId != null ? Number(body.customerId) : null,
    propertyId,
    roomTypeId,
    checkIn,
    checkOut,
    guests: Number(body.guests) || 1,
    totalAmount: Number(body.totalAmount) || 0,
    currency: typeof body.currency === 'string' ? body.currency.toUpperCase() : 'HKD',
    status,
    voucherCode: typeof body.voucherCode === 'string' ? body.voucherCode.trim() || null : null,
    addons: Array.isArray(body.addons) ? JSON.stringify(body.addons) : '[]',
    paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() || null : null,
    paymentReference: typeof body.paymentReference === 'string' ? body.paymentReference.trim() || null : null,
    paymentDeadline: typeof body.paymentDeadline === 'number' ? body.paymentDeadline : null,
    supplierStatus: typeof body.supplierStatus === 'string' ? body.supplierStatus : 'pending',
    adminNotes: typeof body.adminNotes === 'string' ? body.adminNotes.trim() || null : null,
  }
}

interface CancellationRule {
  daysBefore: number
  refundPercent: number
}

interface CancellationPolicy {
  rules: CancellationRule[]
}

function parseCancellationPolicy(value: string | null | undefined): CancellationPolicy {
  if (!value) return { rules: [] }
  try {
    const parsed = JSON.parse(value) as CancellationPolicy
    if (Array.isArray(parsed.rules)) return parsed
    return { rules: [] }
  } catch {
    return { rules: [] }
  }
}

function calculateRefund(totalAmount: number, checkIn: number, policyValue: string | null | undefined): { refundAmount: number; refundPercent: number } {
  const policy = parseCancellationPolicy(policyValue)
  const rules = policy.rules
    .filter((r) => typeof r.daysBefore === 'number' && typeof r.refundPercent === 'number')
    .sort((a, b) => b.daysBefore - a.daysBefore)

  const now = Math.floor(Date.now() / 1000)
  const daysBeforeCheckIn = Math.max(0, Math.floor((checkIn - now) / (24 * 60 * 60)))

  let matchedPercent = 0
  for (const rule of rules) {
    if (daysBeforeCheckIn >= rule.daysBefore) {
      matchedPercent = rule.refundPercent
      break
    }
  }

  const refundAmount = Math.floor((totalAmount * matchedPercent) / 100)
  return { refundAmount, refundPercent: matchedPercent }
}

app.get('/bookings', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const paymentStatus = c.req.query('payment_status')
  const customerId = c.req.query('customer_id')
  const propertyId = c.req.query('property_id')
  const search = c.req.query('search')?.trim()
  const checkInFrom = toUnixEpoch(c.req.query('check_in_from'))
  const checkInTo = toUnixEpoch(c.req.query('check_in_to'))
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (paymentStatus) {
    where += ' AND payment_status = ?'
    params.push(paymentStatus)
  }
  if (customerId) {
    where += ' AND customer_id = ?'
    params.push(Number(customerId))
  }
  if (propertyId) {
    where += ' AND property_id = ?'
    params.push(Number(propertyId))
  }
  if (search) {
    where += ` AND (
      b.id = ?
      OR EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = b.customer_id
        AND (c.email LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
      )
    )`
    const like = `%${search}%`
    params.push(Number(search) || 0, like, like, like)
  }
  if (checkInFrom != null) {
    where += ' AND check_in >= ?'
    params.push(checkInFrom)
  }
  if (checkInTo != null) {
    where += ' AND check_in <= ?'
    params.push(checkInTo)
  }

  const bookings = await all<Booking>(
    c.env.DB,
    `SELECT b.* FROM bookings b ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM bookings b ${where}`,
    params
  )
  return c.json({ data: bookings, total: countRow?.count ?? 0 })
})

app.get('/bookings/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const booking = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!booking) return c.json({ error: 'Booking not found' }, 404)

  const [customer, property, roomType, payments] = await Promise.all([
    booking.customerId
      ? first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [booking.customerId])
      : Promise.resolve(null),
    first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [booking.propertyId]),
    first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [booking.roomTypeId]),
    all<Payment>(c.env.DB, 'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC', [id]),
  ])

  return c.json({ data: { ...booking, customer, property, roomType, payments } })
})

app.post('/bookings', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  let parsed: ReturnType<typeof parseBookingBody>
  try {
    parsed = parseBookingBody(body)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Invalid booking data' }, 400)
  }

  const result = await run(
    c.env.DB,
    `INSERT INTO bookings
      (customer_id, property_id, room_type_id, check_in, check_out, guests, total_amount, currency, status, payment_status, voucher_code, addons, payment_method, payment_reference, payment_deadline, supplier_status, admin_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      parsed.customerId,
      parsed.propertyId,
      parsed.roomTypeId,
      parsed.checkIn,
      parsed.checkOut,
      parsed.guests,
      parsed.totalAmount,
      parsed.currency,
      parsed.status,
      'unpaid',
      parsed.voucherCode,
      parsed.addons,
      parsed.paymentMethod,
      parsed.paymentReference,
      parsed.paymentDeadline,
      parsed.supplierStatus,
      parsed.adminNotes,
    ]
  )

  const booking = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'bookings',
    targetId: result.meta.last_row_id,
    after: booking as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: booking }, 201)
})

app.put('/bookings/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.customerId !== undefined) {
    fields.push('customer_id = ?')
    values.push(body.customerId != null ? Number(body.customerId) : null)
  }
  if (body.propertyId !== undefined) {
    fields.push('property_id = ?')
    values.push(Number(body.propertyId))
  }
  if (body.roomTypeId !== undefined) {
    fields.push('room_type_id = ?')
    values.push(Number(body.roomTypeId))
  }
  if (body.checkIn !== undefined) {
    const t = toUnixEpoch(body.checkIn)
    if (t == null) return c.json({ error: 'Invalid check_in' }, 400)
    fields.push('check_in = ?')
    values.push(t)
  }
  if (body.checkOut !== undefined) {
    const t = toUnixEpoch(body.checkOut)
    if (t == null) return c.json({ error: 'Invalid check_out' }, 400)
    fields.push('check_out = ?')
    values.push(t)
  }
  if (body.guests !== undefined) {
    fields.push('guests = ?')
    values.push(Number(body.guests) || 1)
  }
  if (body.totalAmount !== undefined) {
    fields.push('total_amount = ?')
    values.push(Number(body.totalAmount) || 0)
  }
  if (body.currency !== undefined) {
    fields.push('currency = ?')
    values.push(String(body.currency).toUpperCase())
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!validBookingStatuses.includes(status as BookingStatus)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }
  if (body.paymentStatus !== undefined) {
    fields.push('payment_status = ?')
    values.push(String(body.paymentStatus))
  }
  if (body.voucherCode !== undefined) {
    fields.push('voucher_code = ?')
    values.push(typeof body.voucherCode === 'string' ? body.voucherCode.trim() || null : null)
  }
  if (body.addons !== undefined) {
    fields.push('addons = ?')
    values.push(Array.isArray(body.addons) ? JSON.stringify(body.addons) : '[]')
  }
  if (body.paymentMethod !== undefined) {
    fields.push('payment_method = ?')
    values.push(typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() || null : null)
  }
  if (body.paymentReference !== undefined) {
    fields.push('payment_reference = ?')
    values.push(typeof body.paymentReference === 'string' ? body.paymentReference.trim() || null : null)
  }
  if (body.paymentDeadline !== undefined) {
    fields.push('payment_deadline = ?')
    values.push(typeof body.paymentDeadline === 'number' ? body.paymentDeadline : null)
  }
  if (body.paidAt !== undefined) {
    fields.push('paid_at = ?')
    values.push(typeof body.paidAt === 'number' ? body.paidAt : null)
  }
  if (body.supplierStatus !== undefined) {
    fields.push('supplier_status = ?')
    values.push(typeof body.supplierStatus === 'string' ? body.supplierStatus : 'pending')
  }
  if (body.adminNotes !== undefined) {
    fields.push('admin_notes = ?')
    values.push(typeof body.adminNotes === 'string' ? body.adminNotes.trim() || null : null)
  }
  if (body.cancellationReason !== undefined) {
    fields.push('cancellation_reason = ?')
    values.push(typeof body.cancellationReason === 'string' ? body.cancellationReason.trim() || null : null)
  }
  if (body.refundAmount !== undefined) {
    fields.push('refund_amount = ?')
    values.push(Number(body.refundAmount) || 0)
  }
  if (body.cancelledAt !== undefined) {
    fields.push('cancelled_at = ?')
    values.push(typeof body.cancelledAt === 'number' ? body.cancelledAt : null)
  }
  if (body.confirmedAt !== undefined) {
    fields.push('confirmed_at = ?')
    values.push(typeof body.confirmedAt === 'number' ? body.confirmedAt : null)
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

// PATCH /api/admin/bookings/:id/cancel - cancel booking with automatic refund calculation
app.patch('/bookings/:id/cancel', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null
  const now = Math.floor(Date.now() / 1000)

  // Find applicable cancellation policy from room_type first, then property
  let policyValue: string | null = null
  const roomType = await first<RoomType>(c.env.DB, 'SELECT * FROM room_types WHERE id = ?', [existing.roomTypeId])
  if (roomType?.cancellationPolicy) {
    policyValue = roomType.cancellationPolicy
  } else {
    const property = await first<Property>(c.env.DB, 'SELECT * FROM properties WHERE id = ?', [existing.propertyId])
    policyValue = property?.cancellationPolicy ?? null
  }

  const { refundAmount, refundPercent } = calculateRefund(existing.totalAmount, existing.checkIn, policyValue)

  await run(
    c.env.DB,
    `UPDATE bookings SET status = 'cancelled', payment_status = 'refunded', supplier_status = 'rejected', cancellation_reason = ?, refund_amount = ?, cancelled_at = ?, updated_at = unixepoch() WHERE id = ?`,
    [reason, refundAmount, now, id]
  )

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'cancel',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated, refund: { amount: refundAmount, percent: refundPercent } })
})

// PATCH /api/admin/bookings/:id/mark-paid - mark booking as paid manually
app.patch('/bookings/:id/mark-paid', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : 'manual'
  const paymentReference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() || null : null
  const now = Math.floor(Date.now() / 1000)

  await run(
    c.env.DB,
    `UPDATE bookings SET payment_status = 'paid', payment_method = ?, payment_reference = ?, paid_at = ?, updated_at = unixepoch() WHERE id = ?`,
    [paymentMethod, paymentReference, now, id]
  )

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'mark_paid',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

// PATCH /api/admin/bookings/:id/confirm - confirm booking and supplier availability
app.patch('/bookings/:id/confirm', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  const now = Math.floor(Date.now() / 1000)

  await run(
    c.env.DB,
    `UPDATE bookings SET status = 'confirmed', supplier_status = 'confirmed', confirmed_at = ?, updated_at = unixepoch() WHERE id = ?`,
    [now, id]
  )

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'confirm',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

// PATCH /api/admin/bookings/:id/supplier-status - manually set supplier confirmation status
app.patch('/bookings/:id/supplier-status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const supplierStatus = typeof body.supplierStatus === 'string' ? body.supplierStatus.trim() : ''
  if (!['pending', 'confirmed', 'rejected'].includes(supplierStatus)) {
    return c.json({ error: 'Invalid supplier_status' }, 400)
  }

  await run(
    c.env.DB,
    `UPDATE bookings SET supplier_status = ?, updated_at = unixepoch() WHERE id = ?`,
    [supplierStatus, id]
  )

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update_supplier_status',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

// PATCH /api/admin/bookings/:id/voucher - generate and assign a voucher code
app.patch('/bookings/:id/voucher', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  function generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'HKI-'
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  let voucherCode = existing.voucherCode
  if (!voucherCode) {
    let attempts = 0
    do {
      voucherCode = generateVoucherCode()
      const dup = await first<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM bookings WHERE voucher_code = ? AND id != ?',
        [voucherCode, id]
      )
      if ((dup?.count ?? 0) === 0) break
      attempts++
    } while (attempts < 10)
  }

  await run(
    c.env.DB,
    `UPDATE bookings SET voucher_code = ?, updated_at = unixepoch() WHERE id = ?`,
    [voucherCode, id]
  )

  const updated = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'generate_voucher',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/bookings/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid booking id' }, 400)

  const existing = await first<Booking>(c.env.DB, 'SELECT * FROM bookings WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Booking not found' }, 404)

  await run(c.env.DB, 'DELETE FROM bookings WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'bookings',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})


// ============================================================================
// Payments
// ============================================================================

const validTransactionStatuses: TransactionStatus[] = ['pending', 'succeeded', 'failed', 'refunded']
const validPaymentGateways: PaymentGateway[] = [
  'stripe',
  'paypal',
  'payme',
  'fps',
  'alipayhk',
  'wechatpay',
  'manual',
]

app.get('/payments', requireAdmin, async (c) => {
  const bookingId = c.req.query('booking_id')
  const status = c.req.query('status')
  const gateway = c.req.query('gateway')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (bookingId) {
    where += ' AND booking_id = ?'
    params.push(Number(bookingId))
  }
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (gateway) {
    where += ' AND gateway = ?'
    params.push(gateway)
  }

  const payments = await all<Payment>(
    c.env.DB,
    `SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM payments ${where}`,
    params
  )
  return c.json({ data: payments, total: countRow?.count ?? 0 })
})

app.get('/payments/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid payment id' }, 400)

  const payment = await first<Payment>(c.env.DB, 'SELECT * FROM payments WHERE id = ?', [id])
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  return c.json({ data: payment })
})

app.post('/payments', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const bookingId = Number(body.bookingId)
  if (!Number.isFinite(bookingId)) {
    return c.json({ error: 'Missing or invalid booking_id' }, 400)
  }
  const gateway = String(body.gateway || '')
  if (!validPaymentGateways.includes(gateway as PaymentGateway)) {
    return c.json({ error: 'Invalid gateway' }, 400)
  }
  const status: TransactionStatus =
    typeof body.status === 'string' && validTransactionStatuses.includes(body.status as TransactionStatus)
      ? (body.status as TransactionStatus)
      : 'pending'

  const result = await run(
    c.env.DB,
    `INSERT INTO payments
      (booking_id, gateway, gateway_transaction_id, amount, currency, status, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    [
      bookingId,
      gateway,
      typeof body.gatewayTransactionId === 'string' ? body.gatewayTransactionId.trim() || null : null,
      Number(body.amount) || 0,
      typeof body.currency === 'string' ? body.currency.toUpperCase() : 'HKD',
      status,
      toJson(body.payload),
    ]
  )

  const payment = await first<Payment>(c.env.DB, 'SELECT * FROM payments WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'payments',
    targetId: result.meta.last_row_id,
    after: payment as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: payment }, 201)
})

app.put('/payments/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid payment id' }, 400)

  const existing = await first<Payment>(c.env.DB, 'SELECT * FROM payments WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Payment not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.bookingId !== undefined) {
    fields.push('booking_id = ?')
    values.push(Number(body.bookingId))
  }
  if (body.gateway !== undefined) {
    const gateway = String(body.gateway)
    if (!validPaymentGateways.includes(gateway as PaymentGateway)) {
      return c.json({ error: 'Invalid gateway' }, 400)
    }
    fields.push('gateway = ?')
    values.push(gateway)
  }
  if (body.gatewayTransactionId !== undefined) {
    fields.push('gateway_transaction_id = ?')
    values.push(
      typeof body.gatewayTransactionId === 'string' ? body.gatewayTransactionId.trim() || null : null
    )
  }
  if (body.amount !== undefined) {
    fields.push('amount = ?')
    values.push(Number(body.amount) || 0)
  }
  if (body.currency !== undefined) {
    fields.push('currency = ?')
    values.push(String(body.currency).toUpperCase())
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!validTransactionStatuses.includes(status as TransactionStatus)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }
  if (body.payload !== undefined) {
    fields.push('payload = ?')
    values.push(toJson(body.payload))
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  values.push(id)

  await run(c.env.DB, `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Payment>(c.env.DB, 'SELECT * FROM payments WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'payments',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/payments/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid payment id' }, 400)

  const existing = await first<Payment>(c.env.DB, 'SELECT * FROM payments WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Payment not found' }, 404)

  await run(c.env.DB, 'DELETE FROM payments WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'payments',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Customers
// ============================================================================

app.get('/customers', requireAdmin, async (c) => {
  const search = c.req.query('search')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (search) {
    where += ' AND (email LIKE ? OR name LIKE ? OR phone LIKE ?)'
    const like = `%${search}%`
    params.push(like, like, like)
  }

  const customers = await all<Customer>(
    c.env.DB,
    `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM customers ${where}`,
    params
  )
  return c.json({ data: customers, total: countRow?.count ?? 0 })
})

app.get('/customers/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid customer id' }, 400)

  const customer = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])
  if (!customer) return c.json({ error: 'Customer not found' }, 404)
  return c.json({ data: customer })
})

app.put('/customers/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid customer id' }, 400)

  const existing = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Customer not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    fields.push('name = ?')
    values.push(typeof body.name === 'string' ? body.name.trim() || null : null)
  }
  if (body.phone !== undefined) {
    fields.push('phone = ?')
    values.push(typeof body.phone === 'string' ? body.phone.trim() || null : null)
  }
  if (body.whatsappConsent !== undefined) {
    fields.push('whatsapp_consent = ?')
    values.push(body.whatsappConsent ? 1 : 0)
  }
  if (body.membershipTierId !== undefined) {
    fields.push('membership_tier_id = ?')
    values.push(body.membershipTierId != null ? Number(body.membershipTierId) : null)
  }
  if (body.tags !== undefined) {
    fields.push('tags = ?')
    values.push(toJson(body.tags))
  }
  if (body.notes !== undefined) {
    fields.push('notes = ?')
    values.push(typeof body.notes === 'string' ? body.notes.trim() || null : null)
  }
  if (body.assignedAdminId !== undefined) {
    fields.push('assigned_admin_id = ?')
    values.push(body.assignedAdminId != null ? Number(body.assignedAdminId) : null)
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'customers',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/customers/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid customer id' }, 400)

  const existing = await first<Customer>(c.env.DB, 'SELECT * FROM customers WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Customer not found' }, 404)

  await run(c.env.DB, 'DELETE FROM customers WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'customers',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})


// ============================================================================
// CMS Articles
// ============================================================================

const validArticleStatuses: ArticleStatus[] = ['draft', 'published', 'archived']

app.get('/articles', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const category = c.req.query('category')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (category) {
    where += ' AND category = ?'
    params.push(category)
  }

  const articles = await all<CmsArticle>(
    c.env.DB,
    `SELECT * FROM cms_articles ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM cms_articles ${where}`,
    params
  )
  return c.json({ data: articles, total: countRow?.count ?? 0 })
})

app.get('/articles/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid article id' }, 400)

  const article = await first<CmsArticle>(c.env.DB, 'SELECT * FROM cms_articles WHERE id = ?', [id])
  if (!article) return c.json({ error: 'Article not found' }, 404)
  return c.json({ data: article })
})

app.post('/articles', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const titleZh = typeof body.titleZh === 'string' ? body.titleZh.trim() : ''
  const contentZh = typeof body.contentZh === 'string' ? body.contentZh.trim() : ''
  if (!slug || !titleZh || !contentZh) {
    return c.json({ error: 'Missing required fields: slug, titleZh, contentZh' }, 400)
  }

  const status: ArticleStatus =
    typeof body.status === 'string' && validArticleStatuses.includes(body.status as ArticleStatus)
      ? (body.status as ArticleStatus)
      : 'draft'
  const publishedAt = toUnixEpoch(body.publishedAt)

  const result = await run(
    c.env.DB,
    `INSERT INTO cms_articles
      (slug, title_zh, content_zh, cover_image, category, tags, status, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      slug,
      titleZh,
      contentZh,
      typeof body.coverImage === 'string' ? body.coverImage.trim() || null : null,
      typeof body.category === 'string' ? body.category.trim() || null : null,
      toJson(body.tags),
      status,
      publishedAt,
    ]
  )

  const article = await first<CmsArticle>(c.env.DB, 'SELECT * FROM cms_articles WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'cms_articles',
    targetId: result.meta.last_row_id,
    after: article as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: article }, 201)
})

app.put('/articles/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid article id' }, 400)

  const existing = await first<CmsArticle>(c.env.DB, 'SELECT * FROM cms_articles WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Article not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.slug !== undefined) {
    fields.push('slug = ?')
    values.push(String(body.slug).trim())
  }
  if (body.titleZh !== undefined) {
    fields.push('title_zh = ?')
    values.push(String(body.titleZh).trim())
  }
  if (body.contentZh !== undefined) {
    fields.push('content_zh = ?')
    values.push(String(body.contentZh).trim())
  }
  if (body.coverImage !== undefined) {
    fields.push('cover_image = ?')
    values.push(typeof body.coverImage === 'string' ? body.coverImage.trim() || null : null)
  }
  if (body.category !== undefined) {
    fields.push('category = ?')
    values.push(typeof body.category === 'string' ? body.category.trim() || null : null)
  }
  if (body.tags !== undefined) {
    fields.push('tags = ?')
    values.push(toJson(body.tags))
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!validArticleStatuses.includes(status as ArticleStatus)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }
  if (body.publishedAt !== undefined) {
    fields.push('published_at = ?')
    values.push(toUnixEpoch(body.publishedAt))
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE cms_articles SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<CmsArticle>(c.env.DB, 'SELECT * FROM cms_articles WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'cms_articles',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/articles/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid article id' }, 400)

  const existing = await first<CmsArticle>(c.env.DB, 'SELECT * FROM cms_articles WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Article not found' }, 404)

  await run(c.env.DB, 'DELETE FROM cms_articles WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'cms_articles',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Coupons
// ============================================================================

const validCouponStatuses: CouponStatus[] = ['active', 'inactive', 'expired']
const validCouponDiscountTypes: CouponDiscountType[] = ['fixed', 'percentage']

app.get('/coupons', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  const coupons = await all<Coupon>(
    c.env.DB,
    `SELECT * FROM coupons ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM coupons ${where}`,
    params
  )
  return c.json({ data: coupons, total: countRow?.count ?? 0 })
})

app.get('/coupons/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid coupon id' }, 400)

  const coupon = await first<Coupon>(c.env.DB, 'SELECT * FROM coupons WHERE id = ?', [id])
  if (!coupon) return c.json({ error: 'Coupon not found' }, 404)
  return c.json({ data: coupon })
})

app.post('/coupons', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const discountType = String(body.discountType || '')
  if (!code) return c.json({ error: 'Missing required field: code' }, 400)
  if (!validCouponDiscountTypes.includes(discountType as CouponDiscountType)) {
    return c.json({ error: 'Invalid discount_type' }, 400)
  }

  const status: CouponStatus =
    typeof body.status === 'string' && validCouponStatuses.includes(body.status as CouponStatus)
      ? (body.status as CouponStatus)
      : 'active'

  const result = await run(
    c.env.DB,
    `INSERT INTO coupons
      (code, discount_type, discount_value, min_amount, usage_limit, valid_from, valid_to, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [
      code,
      discountType,
      Number(body.discountValue) || 0,
      Number(body.minAmount) || 0,
      body.usageLimit != null ? Number(body.usageLimit) : null,
      toUnixEpoch(body.validFrom),
      toUnixEpoch(body.validTo),
      status,
    ]
  )

  const coupon = await first<Coupon>(c.env.DB, 'SELECT * FROM coupons WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'coupons',
    targetId: result.meta.last_row_id,
    after: coupon as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: coupon }, 201)
})

app.put('/coupons/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid coupon id' }, 400)

  const existing = await first<Coupon>(c.env.DB, 'SELECT * FROM coupons WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Coupon not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  if (body.code !== undefined) {
    fields.push('code = ?')
    values.push(String(body.code).trim())
  }
  if (body.discountType !== undefined) {
    const dt = String(body.discountType)
    if (!validCouponDiscountTypes.includes(dt as CouponDiscountType)) {
      return c.json({ error: 'Invalid discount_type' }, 400)
    }
    fields.push('discount_type = ?')
    values.push(dt)
  }
  if (body.discountValue !== undefined) {
    fields.push('discount_value = ?')
    values.push(Number(body.discountValue) || 0)
  }
  if (body.minAmount !== undefined) {
    fields.push('min_amount = ?')
    values.push(Number(body.minAmount) || 0)
  }
  if (body.usageLimit !== undefined) {
    fields.push('usage_limit = ?')
    values.push(body.usageLimit != null ? Number(body.usageLimit) : null)
  }
  if (body.validFrom !== undefined) {
    fields.push('valid_from = ?')
    values.push(toUnixEpoch(body.validFrom))
  }
  if (body.validTo !== undefined) {
    fields.push('valid_to = ?')
    values.push(toUnixEpoch(body.validTo))
  }
  if (body.status !== undefined) {
    const status = String(body.status)
    if (!validCouponStatuses.includes(status as CouponStatus)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    fields.push('status = ?')
    values.push(status)
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Coupon>(c.env.DB, 'SELECT * FROM coupons WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'update',
    targetTable: 'coupons',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: updated })
})

app.delete('/coupons/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid coupon id' }, 400)

  const existing = await first<Coupon>(c.env.DB, 'SELECT * FROM coupons WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Coupon not found' }, 404)

  await run(c.env.DB, 'DELETE FROM coupons WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'coupons',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})


// ============================================================================
// Admin Accounts
// ============================================================================

const validAdminRoles: AdminRole[] = ['superadmin', 'admin', 'editor', 'support']

app.get('/admins', requireAdmin, requireRole('superadmin', 'admin'), async (c) => {
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const admins = await all<Admin>(
    c.env.DB,
    'SELECT * FROM admins ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  )
  const countRow = await first<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM admins')

  const safe = admins.map(({ passwordHash: _, ...rest }) => rest)
  return c.json({ data: safe, total: countRow?.count ?? 0 })
})

app.get('/admins/:id', requireAdmin, requireRole('superadmin', 'admin'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid admin id' }, 400)

  const admin = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [id])
  if (!admin) return c.json({ error: 'Admin not found' }, 404)

  const { passwordHash: _, ...safe } = admin
  return c.json({ data: safe })
})

app.post('/admins', requireAdmin, requireRole('superadmin'), async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const role = String(body.role || '')

  if (!email || !name || !password) {
    return c.json({ error: 'Missing required fields: email, name, password' }, 400)
  }
  if (!validAdminRoles.includes(role as AdminRole)) {
    return c.json({ error: 'Invalid role' }, 400)
  }

  const passwordHash = bcryptjs.hashSync(password, 10)
  const result = await run(
    c.env.DB,
    `INSERT INTO admins
      (email, name, role, password_hash, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, unixepoch(), unixepoch())`,
    [email, name, role, passwordHash]
  )

  const admin = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [
    result.meta.last_row_id,
  ])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'create',
    targetTable: 'admins',
    targetId: result.meta.last_row_id,
    after: admin as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  const { passwordHash: _, ...safe } = admin!
  return c.json({ data: safe }, 201)
})

app.put('/admins/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid admin id' }, 400)

  const currentAdminId = c.get('adminId')!
  const currentRole = c.get('adminRole')!

  const existing = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Admin not found' }, 404)

  if (currentRole !== 'superadmin' && id !== currentAdminId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json<Record<string, unknown>>()
  const fields: string[] = []
  const values: unknown[] = []

  const canEditAll = currentRole === 'superadmin'
  const isSelf = id === currentAdminId

  if (body.name !== undefined && (isSelf || canEditAll)) {
    fields.push('name = ?')
    values.push(String(body.name).trim())
  }
  if (canEditAll) {
    if (body.role !== undefined) {
      const role = String(body.role)
      if (!validAdminRoles.includes(role as AdminRole)) {
        return c.json({ error: 'Invalid role' }, 400)
      }
      fields.push('role = ?')
      values.push(role)
    }
    if (body.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(body.isActive ? 1 : 0)
    }
  }
  if (body.password !== undefined && typeof body.password === 'string' && body.password && (isSelf || canEditAll)) {
    fields.push('password_hash = ?')
    values.push(bcryptjs.hashSync(body.password, 10))
  }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push('updated_at = unixepoch()')
  values.push(id)

  await run(c.env.DB, `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`, values)
  const updated = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [id])

  await logAudit(c.env.DB, {
    adminId: currentAdminId,
    action: 'update',
    targetTable: 'admins',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  const { passwordHash: _, ...safe } = updated!
  return c.json({ data: safe })
})

app.delete('/admins/:id', requireAdmin, requireRole('superadmin'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid admin id' }, 400)
  if (id === c.get('adminId')) {
    return c.json({ error: 'Cannot delete yourself' }, 400)
  }

  const existing = await first<Admin>(c.env.DB, 'SELECT * FROM admins WHERE id = ?', [id])
  if (!existing) return c.json({ error: 'Admin not found' }, 404)

  await run(c.env.DB, 'DELETE FROM admins WHERE id = ?', [id])
  await logAudit(c.env.DB, {
    adminId: c.get('adminId') ?? null,
    action: 'delete',
    targetTable: 'admins',
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ data: { ok: true } })
})

// ============================================================================
// Audit Logs
// ============================================================================

app.get('/audit-logs', requireAdmin, requireRole('superadmin', 'admin'), async (c) => {
  const adminId = c.req.query('admin_id')
  const action = c.req.query('action')
  const targetTable = c.req.query('target_table')
  const limit = Math.min(parseIntParam(c.req.query('limit'), 20), 100)
  const offset = Math.max(parseIntParam(c.req.query('offset'), 0), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (adminId) {
    where += ' AND admin_id = ?'
    params.push(Number(adminId))
  }
  if (action) {
    where += ' AND action = ?'
    params.push(action)
  }
  if (targetTable) {
    where += ' AND target_table = ?'
    params.push(targetTable)
  }

  const logs = await all<{
    id: number
    adminId: number | null
    action: string
    targetTable: string
    targetId: string | null
    beforeJson: string | null
    afterJson: string | null
    ipAddress: string | null
    createdAt: number
  }>(
    c.env.DB,
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM audit_logs ${where}`,
    params
  )
  return c.json({ data: logs, total: countRow?.count ?? 0 })
})

export default app
