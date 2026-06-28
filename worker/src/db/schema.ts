/**
 * HK Maldivers — D1 Schema TypeScript Types
 *
 * Mirrors `worker/schema.sql`. All interfaces use camelCase property names.
 * Use `mapRow<T>()` or `mapRows<T>()` to convert D1 result rows from
 * snake_case to camelCase.
 */

// =============================================================================
// Shared Status / Enum Types
// =============================================================================

export type PropertyStatus = 'active' | 'inactive' | 'draft'
export type RoomTypeStatus = 'available' | 'unavailable' | 'hidden'
export type ArticleStatus = 'draft' | 'published' | 'archived'
export type LeadType = 'experience_inquiry' | 'island_owner_talk' | 'inspiration_guide'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
export type PaymentGateway =
  | 'stripe'
  | 'paypal'
  | 'payme'
  | 'fps'
  | 'alipayhk'
  | 'wechatpay'
  | 'manual'
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type AdminRole = 'superadmin' | 'admin' | 'editor' | 'support'
export type TemplateStatus = 'active' | 'inactive' | 'draft'
export type BroadcastStatus = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled'
export type BroadcastLogStatus = 'pending' | 'sent' | 'delivered' | 'failed'
export type ConversationStatus = 'active' | 'archived' | 'spam'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type CouponStatus = 'active' | 'inactive' | 'expired'
export type CouponDiscountType = 'fixed' | 'percentage'
export type CustomerActivityType =
  | 'inquiry'
  | 'booking'
  | 'payment'
  | 'whatsapp'
  | 'email_open'
  | 'login'

// =============================================================================
// 1. Properties & Room Types
// =============================================================================

export interface Property {
  id: number
  name: string
  nameZh: string
  description: string | null
  descriptionZh: string | null
  location: string | null
  pricePerNight: number
  maxGuests: number | null
  imageUrl: string | null
  amenities: string | null // JSON array stored as TEXT
  gallery: string | null // JSON array of image URLs
  facilities: string | null // JSON array of {icon, label}
  locationDetails: string | null // JSON object {description, mapImage, nearby}
  story: string | null // JSON object {title, content}
  cancellationPolicy: string | null // JSON object {rules: [{days_before, refund_percent}]}
  status: PropertyStatus
  createdAt: number
  updatedAt: number
}

export interface RoomType {
  id: number
  propertyId: number
  name: string
  nameZh: string
  description: string | null
  descriptionZh: string | null
  pricePerNight: number
  maxGuests: number | null
  inventory: number
  imageUrl: string | null
  amenities: string | null // JSON array stored as TEXT
  bedType: string | null
  view: string | null
  sizeSqm: number | null
  occupancy: string | null
  gallery: string | null // JSON array of image URLs
  features: string | null // JSON array of strings
  cancellationPolicy: string | null // JSON object {rules: [{days_before, refund_percent}]}
  status: RoomTypeStatus
  createdAt: number
  updatedAt: number
}

export interface Experience {
  id: number
  name: string
  nameZh: string
  slug: string
  description: string | null
  descriptionZh: string | null
  duration: string | null
  groupSize: string | null
  includes: string | null // JSON array of strings
  priceNote: string | null
  imageUrl: string | null
  iconName: string | null
  sortOrder: number
  status: 'active' | 'inactive'
  createdAt: number
  updatedAt: number
}

export interface Retreat {
  id: number
  name: string
  nameZh: string
  slug: string
  description: string | null
  descriptionZh: string | null
  duration: string | null
  location: string | null
  audience: string | null
  itinerary: string | null // JSON array of {day, title, desc}
  priceNote: string | null
  imageUrl: string | null
  iconName: string | null
  sortOrder: number
  status: 'active' | 'inactive'
  createdAt: number
  updatedAt: number
}

// =============================================================================
// 2. CMS
// =============================================================================

export interface CmsArticle {
  id: number
  slug: string
  titleZh: string
  contentZh: string
  coverImage: string | null
  category: string | null
  tags: string | null // JSON array stored as TEXT
  status: ArticleStatus
  publishedAt: number | null
  createdAt: number
  updatedAt: number
}

// =============================================================================
// 3. Leads
// =============================================================================

export interface Lead {
  id: number
  name: string | null
  email: string
  phone: string | null
  leadType: LeadType
  source: string | null
  status: LeadStatus
  assignedAdminId: number | null
  notes: string | null
  metadata: string | null // JSON object stored as TEXT
  createdAt: number
  updatedAt: number
}

// =============================================================================
// 4. Bookings & Payments
// =============================================================================

export interface Booking {
  id: number
  customerId: number | null
  propertyId: number
  roomTypeId: number
  checkIn: number
  checkOut: number
  guests: number
  totalAmount: number
  currency: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  voucherCode: string | null
  addons: string | null
  paymentMethod: string | null
  paymentReference: string | null
  paymentDeadline: number | null
  paidAt: number | null
  supplierStatus: string | null
  token: string | null
  referralCode: string | null
  adminNotes: string | null
  cancellationReason: string | null
  refundAmount: number
  cancelledAt: number | null
  confirmedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface Payment {
  id: number
  bookingId: number
  gateway: PaymentGateway
  gatewayTransactionId: string | null
  amount: number
  currency: string
  status: TransactionStatus
  payload: string | null // JSON response from payment gateway
  createdAt: number
}

// =============================================================================
// 4.5 Referral Module
// =============================================================================

export interface Referrer {
  id: number
  name: string
  phone: string | null
  referralCode: string
  token: string
  status: 'active' | 'inactive'
  totalReferrals: number
  totalCommission: number
  paidCommission: number
  createdAt: number
  updatedAt: number
}

export interface ReferralOrder {
  id: number
  bookingId: number
  referrerId: number
  orderAmount: number
  commissionAmount: number
  currency: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  paidAt: number | null
  createdAt: number
  updatedAt: number
}

export interface ReferralSettings {
  id: number
  rules: string // JSON object
  updatedAt: number
}

// =============================================================================
// 5. Customers & Membership
// =============================================================================

export interface MembershipTier {
  id: number
  name: string
  nameZh: string | null
  minAnnualSpend: number
  benefits: string | null // JSON array/object stored as TEXT
  createdAt: number
  updatedAt: number
}

export interface Customer {
  id: number
  name: string | null
  email: string
  phone: string | null
  whatsappConsent: number
  membershipTierId: number | null
  tags: string | null // JSON array stored as TEXT
  notes: string | null
  assignedAdminId: number | null
  createdAt: number
  updatedAt: number
}

export interface CustomerActivity {
  id: number
  customerId: number
  activityType: CustomerActivityType
  metadata: string | null // JSON object stored as TEXT
  createdAt: number
}

// =============================================================================
// 6. Admins & RBAC
// =============================================================================

export interface Admin {
  id: number
  email: string
  name: string
  role: AdminRole
  passwordHash: string
  isActive: number
  lastLogin: number | null
  createdAt: number
  updatedAt: number
}

export interface AuditLog {
  id: number
  adminId: number | null
  action: string
  targetTable: string
  targetId: string | null
  beforeJson: string | null
  afterJson: string | null
  ipAddress: string | null
  createdAt: number
}

// =============================================================================
// 7. WhatsApp
// =============================================================================

export interface WhatsappTemplate {
  id: number
  name: string
  content: string
  variables: string | null // JSON array of variable names
  status: TemplateStatus
  createdAt: number
  updatedAt: number
}

export interface BroadcastBatch {
  id: number
  templateId: number
  name: string
  targetCount: number
  sentCount: number
  failedCount: number
  rateMinSeconds: number
  rateMaxSeconds: number
  status: BroadcastStatus
  createdBy: number | null
  createdAt: number
  updatedAt: number
}

export interface BroadcastLog {
  id: number
  batchId: number
  customerId: number | null
  phone: string
  status: BroadcastLogStatus
  errorMessage: string | null
  sentAt: number | null
  createdAt: number
}

export interface WhatsappConversation {
  id: number
  customerId: number | null
  phone: string
  lastMessageAt: number | null
  status: ConversationStatus
  createdAt: number
  updatedAt: number
}

export interface WhatsappMessage {
  id: number
  conversationId: number
  customerId: number | null
  direction: MessageDirection
  message: string
  status: MessageStatus
  externalMessageId: string | null
  createdAt: number
}

// =============================================================================
// 8. Coupons
// =============================================================================

export interface Coupon {
  id: number
  code: string
  discountType: CouponDiscountType
  discountValue: number
  minAmount: number
  usageLimit: number | null
  usedCount: number
  validFrom: number | null
  validTo: number | null
  status: CouponStatus
  createdAt: number
  updatedAt: number
}

// =============================================================================
// Utility: snake_case → camelCase mapping helpers
// =============================================================================

/**
 * Convert a single snake_case string to camelCase.
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
}

/**
 * Map a single D1 result row (snake_case keys) to a camelCase typed object.
 *
 * Example:
 *   const row = await c.env.DB.prepare('SELECT * FROM properties WHERE id = ?')
 *     .bind(1).first()
 *   const property = mapRow<Property>(row)
 *   if (property) { ... }
 */
export function mapRow<T>(row: Record<string, unknown>): T
export function mapRow<T>(row: Record<string, unknown> | null | undefined): T | null
export function mapRow<T>(
  row: Record<string, unknown> | null | undefined
): T | null {
  if (row == null) {
    return null
  }

  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    mapped[snakeToCamel(key)] = value
  }
  return mapped as T
}

/**
 * Map an array of D1 result rows (snake_case keys) to camelCase typed objects.
 *
 * Example:
 *   const { results } = await c.env.DB.prepare('SELECT * FROM properties').all()
 *   const properties = mapRows<Property>(results)
 */
export function mapRows<T>(rows: Record<string, unknown>[] | null | undefined): T[] {
  if (!rows) {
    return []
  }
  return rows.map((row) => mapRow<T>(row))
}

/**
 * Convert a camelCase object into a snake_case record, useful for INSERT/UPDATE
 * bindings. Only includes keys explicitly present on the input object.
 */
export function camelToSnake<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snake = key
      .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
      .replace(/^_/, '')
    mapped[snake] = value
  }
  return mapped
}
