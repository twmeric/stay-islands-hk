import { first, run } from './db'
import type { Bindings } from '../types'
import type { ReferralSettings, Referrer } from '../db/schema'

const DEFAULT_BUSINESS_WHATSAPP = '85262322466'

export type ReferralRules = {
  mode: 'percentage' | 'fixed'
  percentage: number
  fixed_amount: number
  currency: string
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `R-${code}`
}

export function generateDashboardToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function getBusinessWhatsAppNumber(env: Bindings): string {
  return env.BUSINESS_WHATSAPP_NUMBER || DEFAULT_BUSINESS_WHATSAPP
}

export function buildReferralLink(env: Bindings, code: string): string {
  const base = env.FRONTEND_URL || 'https://stay-islands-hk.pages.dev'
  return `${base}/?ref=${encodeURIComponent(code)}`
}

export function buildDashboardLink(env: Bindings, token: string): string {
  const base = env.FRONTEND_URL || 'https://stay-islands-hk.pages.dev'
  return `${base}/ref/d/${token}`
}

export function buildWhatsAppDeeplink(env: Bindings, code: string): string {
  const phone = getBusinessWhatsAppNumber(env)
  const text = encodeURIComponent(`HKMaldivers ${code}`)
  return `https://wa.me/${phone}?text=${text}`
}

export function buildQrCodeUrl(deeplink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deeplink)}`
}

export function buildWelcomeMessage(env: Bindings, referrer: Referrer): string {
  const dashboard = buildDashboardLink(env, referrer.token)
  return `歡迎成為 HK Maldivers 分享夥伴！\n\n隨時查看轉介結果：\n${dashboard}\n\n只需朋友透過你的專屬連結預約並付款後，你即可獲得回饋。`
}

export function buildReferralPromoMessage(env: Bindings, referrer: Referrer): string {
  const link = buildReferralLink(env, referrer.referralCode)
  return `🏝️ 厭倦咗香港嘅煩囂？一個按鍵就可以計劃你嘅馬爾代夫夢幻假期！\n\n👉 用我嘅專屬連結預約，不但有專人跟進，仲有額外驚喜安排：\n${link}\n\n📲 快啲入去睇吓靚靚海島住宿同度假套餐，靚檔期先到先得！`
}

export function buildCommissionNotificationMessage(
  env: Bindings,
  referrer: Referrer,
  bookingToken: string | null,
  orderAmount: number,
  commission: number
): string {
  const dashboard = buildDashboardLink(env, referrer.token)
  return `🎉 喜報！你推薦的客人已完成付款。\n\n訂單編號：#${bookingToken || '未知'}\n訂單金額：HK$${orderAmount.toLocaleString()}\n預計回饋：HK$${commission.toLocaleString()}\n\n查看業績：\n${dashboard}`
}

export async function getReferralSettings(db: D1Database): Promise<ReferralRules> {
  const row = await first<ReferralSettings>(db, 'SELECT * FROM referral_settings WHERE id = 1')
  if (!row) {
    return { mode: 'percentage', percentage: 5, fixed_amount: 0, currency: 'HKD' }
  }
  try {
    const parsed = JSON.parse(row.rules) as ReferralRules
    return {
      mode: parsed.mode === 'fixed' ? 'fixed' : 'percentage',
      percentage: Number(parsed.percentage) || 0,
      fixed_amount: Number(parsed.fixed_amount) || 0,
      currency: parsed.currency || 'HKD',
    }
  } catch {
    return { mode: 'percentage', percentage: 5, fixed_amount: 0, currency: 'HKD' }
  }
}

export function calculateCommission(amount: number, rules: ReferralRules): number {
  if (rules.mode === 'fixed') {
    return Math.max(0, Math.round(rules.fixed_amount))
  }
  return Math.max(0, Math.round((amount * rules.percentage) / 100))
}

export async function createReferralOrderAndNotify(
  env: Bindings,
  booking: {
    id: number
    token: string | null
    totalAmount: number
    referralCode: string | null
  }
): Promise<void> {
  if (!booking.referralCode) return

  const referrer = await first<Referrer>(
    env.DB,
    'SELECT * FROM referrers WHERE referral_code = ? AND status = ?',
    [booking.referralCode, 'active']
  )
  if (!referrer) return

  const existing = await first<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM referral_orders WHERE booking_id = ?',
    [booking.id]
  )
  if (existing && existing.count > 0) return

  const rules = await getReferralSettings(env.DB)
  const commission = calculateCommission(booking.totalAmount, rules)

  await run(
    env.DB,
    `INSERT INTO referral_orders
      (booking_id, referrer_id, order_amount, commission_amount, currency, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [booking.id, referrer.id, booking.totalAmount, commission, rules.currency, 'pending']
  )

  await run(
    env.DB,
    `UPDATE referrers SET
      total_referrals = total_referrals + 1,
      total_commission = total_commission + ?,
      updated_at = unixepoch()
      WHERE id = ?`,
    [commission, referrer.id]
  )

  const { sendCloudwapiMessage } = await import('./cloudwapi')
  try {
    await sendCloudwapiMessage(env, {
      phone: referrer.phone || '',
      message: buildCommissionNotificationMessage(env, referrer, booking.token, booking.totalAmount, commission),
    })
  } catch (err) {
    console.error('[referral] commission notification failed:', err)
  }
}

export async function createReferralOrderForPackageBookingAndNotify(
  env: Bindings,
  packageBooking: {
    id: number
    token: string | null
    totalAmount: number
    referralCode: string | null
  }
): Promise<void> {
  if (!packageBooking.referralCode) return

  const referrer = await first<Referrer>(
    env.DB,
    'SELECT * FROM referrers WHERE referral_code = ? AND status = ?',
    [packageBooking.referralCode, 'active']
  )
  if (!referrer) return

  const existing = await first<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM referral_orders WHERE package_booking_id = ?',
    [packageBooking.id]
  )
  if (existing && existing.count > 0) return

  const rules = await getReferralSettings(env.DB)
  const commission = calculateCommission(packageBooking.totalAmount, rules)

  await run(
    env.DB,
    `INSERT INTO referral_orders
      (package_booking_id, referrer_id, order_amount, commission_amount, currency, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    [packageBooking.id, referrer.id, packageBooking.totalAmount, commission, rules.currency, 'pending']
  )

  await run(
    env.DB,
    `UPDATE referrers SET
      total_referrals = total_referrals + 1,
      total_commission = total_commission + ?,
      updated_at = unixepoch()
      WHERE id = ?`,
    [commission, referrer.id]
  )

  const { sendCloudwapiMessage } = await import('./cloudwapi')
  try {
    await sendCloudwapiMessage(env, {
      phone: referrer.phone || '',
      message: buildCommissionNotificationMessage(env, referrer, packageBooking.token, packageBooking.totalAmount, commission),
    })
  } catch (err) {
    console.error('[referral] package booking commission notification failed:', err)
  }
}
