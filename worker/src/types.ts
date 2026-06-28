import type { AdminRole } from './db/schema'

export type Bindings = {
  DB: D1Database
  ASSETS: R2Bucket
  CACHE: KVNamespace
  JWT_SECRET: string
  CLOUDWAPI_API_KEY: string
  CLOUDWAPI_SENDER: string
  BUSINESS_WHATSAPP_NUMBER: string
  FRONTEND_URL: string
  STRIPE_SECRET_KEY?: string
}

export type Variables = {
  adminId?: number
  adminEmail?: string
  adminRole?: AdminRole
}
