import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { all, first, run } from '../lib/db'
import { requireAdmin } from '../middleware/auth'
import type { ReferralOrder, ReferralSettings, Referrer } from '../db/schema'
import {
  buildDashboardLink,
  buildQrCodeUrl,
  buildReferralLink,
  buildWhatsAppDeeplink,
  buildWelcomeMessage,
  calculateCommission,
  generateDashboardToken,
  generateReferralCode,
  getReferralSettings,
} from '../lib/referral'
import { sendCloudwapiMessage, normalizePhone } from '../lib/cloudwapi'

const REFERRAL_CODE_REGEX = /R-[A-Z0-9]{6}/i

function generateCode(): string {
  return generateReferralCode()
}

async function ensureUniqueCode(db: D1Database, maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateCode()
    const existing = await first<Referrer>(db, 'SELECT id FROM referrers WHERE referral_code = ?', [code])
    if (!existing) return code
  }
  throw new Error('Unable to generate unique referral code')
}

async function ensureUniqueToken(db: D1Database, maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const token = generateDashboardToken()
    const existing = await first<Referrer>(db, 'SELECT id FROM referrers WHERE token = ?', [token])
    if (!existing) return token
  }
  throw new Error('Unable to generate unique dashboard token')
}

function formatReferrerResponse(env: Bindings, referrer: Referrer) {
  const code = referrer.referralCode
  const deeplink = buildWhatsAppDeeplink(env, code)
  return {
    id: referrer.id,
    name: referrer.name,
    phone: referrer.phone,
    referralCode: code,
    token: referrer.token,
    status: referrer.status,
    totalReferrals: referrer.totalReferrals,
    totalCommission: referrer.totalCommission,
    paidCommission: referrer.paidCommission,
    referralLink: buildReferralLink(env, code),
    dashboardLink: buildDashboardLink(env, referrer.token),
    whatsappDeeplink: deeplink,
    qrCodeUrl: buildQrCodeUrl(deeplink),
    createdAt: referrer.createdAt,
    updatedAt: referrer.updatedAt,
  }
}

// ============================================================================
// Public API
// ============================================================================

export const publicApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()

publicApp.get('/dashboard/:token', async (c) => {
  const token = c.req.param('token')
  if (!token) return c.json({ error: 'Missing token' }, 400)

  const referrer = await first<Referrer>(
    c.env.DB,
    'SELECT * FROM referrers WHERE token = ? AND status = ?',
    [token, 'active']
  )
  if (!referrer) return c.json({ error: 'Not found' }, 404)

  const pending = await first<{ total: number }>(
    c.env.DB,
    "SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_orders WHERE referrer_id = ? AND status = ?",
    [referrer.id, 'pending']
  )
  const approved = await first<{ total: number }>(
    c.env.DB,
    "SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_orders WHERE referrer_id = ? AND status = ?",
    [referrer.id, 'approved']
  )
  const paid = await first<{ total: number }>(
    c.env.DB,
    "SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_orders WHERE referrer_id = ? AND status = ?",
    [referrer.id, 'paid']
  )
  const count = await first<{ count: number }>(
    c.env.DB,
    "SELECT COUNT(*) as count FROM referral_orders WHERE referrer_id = ?",
    [referrer.id]
  )
  const recentOrders = await all<ReferralOrder & { booking_token: string | null }>(
    c.env.DB,
    `SELECT ro.*, b.token as booking_token
     FROM referral_orders ro
     LEFT JOIN bookings b ON b.id = ro.booking_id
     WHERE ro.referrer_id = ?
     ORDER BY ro.created_at DESC
     LIMIT 20`,
    [referrer.id]
  )

  return c.json({
    data: {
      name: referrer.name,
      referralCode: referrer.referralCode,
      referralLink: buildReferralLink(c.env, referrer.referralCode),
      totalReferrals: count?.count ?? 0,
      pendingCommission: pending?.total ?? 0,
      approvedCommission: approved?.total ?? 0,
      paidCommission: paid?.total ?? 0,
      recentOrders: recentOrders.map((o) => ({
        bookingId: o.bookingId,
        bookingToken: o.booking_token,
        orderAmount: o.orderAmount,
        commissionAmount: o.commissionAmount,
        status: o.status,
        createdAt: o.createdAt,
      })),
    },
  })
})

// ============================================================================
// Admin API
// ============================================================================

export const adminApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()

adminApp.get('/referrals', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  const referrers = await all<Referrer>(
    c.env.DB,
    `SELECT * FROM referrers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM referrers ${where}`,
    params
  )

  return c.json({
    data: referrers.map((r) => formatReferrerResponse(c.env, r)),
    total: countRow?.count ?? 0,
  })
})

adminApp.post('/referrals', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return c.json({ error: 'Missing required field: name' }, 400)
  }

  const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null

  const code = await ensureUniqueCode(c.env.DB)
  const token = await ensureUniqueToken(c.env.DB)

  const result = await run(
    c.env.DB,
    `INSERT INTO referrers (name, phone, referral_code, token, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [name, phone, code, token, 'active']
  )

  const referrer = await first<Referrer>(c.env.DB, 'SELECT * FROM referrers WHERE id = ?', [
    result.meta.last_row_id,
  ])
  if (!referrer) {
    return c.json({ error: 'Failed to create referrer' }, 500)
  }

  return c.json({ data: formatReferrerResponse(c.env, referrer) }, 201)
})

adminApp.patch('/referrals/:id/status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<Record<string, unknown>>()
  const status = typeof body.status === 'string' ? body.status.trim() : ''
  if (!['active', 'inactive'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  await run(c.env.DB, 'UPDATE referrers SET status = ?, updated_at = unixepoch() WHERE id = ?', [
    status,
    id,
  ])
  const referrer = await first<Referrer>(c.env.DB, 'SELECT * FROM referrers WHERE id = ?', [id])
  if (!referrer) return c.json({ error: 'Not found' }, 404)

  return c.json({ data: formatReferrerResponse(c.env, referrer) })
})

adminApp.post('/referrals/:id/resend', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)

  const referrer = await first<Referrer>(c.env.DB, 'SELECT * FROM referrers WHERE id = ?', [id])
  if (!referrer) return c.json({ error: 'Not found' }, 404)
  if (!referrer.phone) {
    return c.json({ error: 'Referrer has no phone number' }, 400)
  }

  try {
    await sendCloudwapiMessage(c.env, {
      phone: referrer.phone,
      message: buildWelcomeMessage(c.env, referrer),
    })
  } catch (err) {
    console.error('[referral] resend welcome failed:', err)
    return c.json({ error: 'Failed to send WhatsApp message' }, 502)
  }

  return c.json({ ok: true })
})

adminApp.get('/referral-orders', requireAdmin, async (c) => {
  const referrerId = c.req.query('referrer_id')
  const status = c.req.query('status')
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)

  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (referrerId) {
    where += ' AND ro.referrer_id = ?'
    params.push(Number(referrerId))
  }
  if (status) {
    where += ' AND ro.status = ?'
    params.push(status)
  }

  const orders = await all<ReferralOrder & { referrer_name: string; booking_token: string | null }>(
    c.env.DB,
    `SELECT ro.*, r.name as referrer_name, b.token as booking_token
     FROM referral_orders ro
     LEFT JOIN referrers r ON r.id = ro.referrer_id
     LEFT JOIN bookings b ON b.id = ro.booking_id
     ${where}
     ORDER BY ro.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const countRow = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM referral_orders ro ${where}`,
    params
  )

  return c.json({ data: orders, total: countRow?.count ?? 0 })
})

adminApp.patch('/referral-orders/:id/status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<Record<string, unknown>>()
  const status = typeof body.status === 'string' ? body.status.trim() : ''
  if (!['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  const existing = await first<ReferralOrder>(c.env.DB, 'SELECT * FROM referral_orders WHERE id = ?', [
    id,
  ])
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const paidAt = status === 'paid' ? Math.floor(Date.now() / 1000) : existing.paidAt
  const diff =
    status === 'paid' && existing.status !== 'paid'
      ? existing.commissionAmount
      : status !== 'paid' && existing.status === 'paid'
      ? -existing.commissionAmount
      : 0

  await run(
    c.env.DB,
    'UPDATE referral_orders SET status = ?, paid_at = ?, updated_at = unixepoch() WHERE id = ?',
    [status, paidAt, id]
  )

  if (diff !== 0) {
    await run(
      c.env.DB,
      'UPDATE referrers SET paid_commission = paid_commission + ?, updated_at = unixepoch() WHERE id = ?',
      [diff, existing.referrerId]
    )
  }

  return c.json({ ok: true })
})

adminApp.get('/referral-settings', requireAdmin, async (c) => {
  const rules = await getReferralSettings(c.env.DB)
  return c.json({ data: rules })
})

adminApp.put('/referral-settings', requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const mode = typeof body.mode === 'string' && body.mode === 'fixed' ? 'fixed' : 'percentage'
  const percentage = Number(body.percentage) || 0
  const fixedAmount = Number(body.fixed_amount) || 0
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : 'HKD'

  const rules = JSON.stringify({
    mode,
    percentage,
    fixed_amount: fixedAmount,
    currency,
  })

  await run(
    c.env.DB,
    'INSERT INTO referral_settings (id, rules, updated_at) VALUES (1, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET rules = excluded.rules, updated_at = excluded.updated_at',
    [rules]
  )

  return c.json({ data: JSON.parse(rules) })
})

// ============================================================================
// Webhook helper used by cloudwapi incoming
// ============================================================================

export async function handleReferralWhatsAppMessage(
  env: Bindings,
  phone: string,
  message: string,
  name?: string
): Promise<{ handled: boolean; message?: string }> {
  if (!message.includes('HKMaldivers')) {
    return { handled: false }
  }

  const normalizedPhone = normalizePhone(phone)
  const now = Math.floor(Date.now() / 1000)

  // 1. If the message includes an existing referral code, look it up first.
  const codeMatch = message.match(REFERRAL_CODE_REGEX)
  let referrer: Referrer | null = null

  if (codeMatch) {
    referrer = await first<Referrer>(
      env.DB,
      'SELECT * FROM referrers WHERE referral_code = ? AND status = ?',
      [codeMatch[0].toUpperCase(), 'active']
    )
  }

  // 2. Otherwise, look up by phone number.
  if (!referrer) {
    referrer = await first<Referrer>(
      env.DB,
      'SELECT * FROM referrers WHERE phone = ? AND status = ?',
      [normalizedPhone, 'active']
    )
  }

  // 3. If still not found, auto-create a new referrer for this phone.
  //    This replaces the manual "add new partner" step.
  if (!referrer) {
    const code = await ensureUniqueCode(env.DB)
    const token = await ensureUniqueToken(env.DB)

    const result = await run(
      env.DB,
      `INSERT INTO referrers
        (name, phone, referral_code, token, status, total_referrals, total_commission, paid_commission, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name || '', normalizedPhone, code, token, 'active', 0, 0, 0, now, now]
    )

    referrer = await first<Referrer>(env.DB, 'SELECT * FROM referrers WHERE id = ?', [
      result.meta.last_row_id ?? 0,
    ])
  }

  if (!referrer) {
    return {
      handled: true,
      message: '系統暫時無法建立分享夥伴資料，請稍後再試。',
    }
  }

  return {
    handled: true,
    message: buildWelcomeMessage(env, referrer),
  }
}
