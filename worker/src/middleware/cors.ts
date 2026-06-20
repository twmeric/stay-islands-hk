import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from '../types'

function isAllowedOrigin(origin: string, env: Bindings): boolean {
  if (origin === env.FRONTEND_URL) return true
  if (origin === 'http://localhost:5173') return true
  if (origin === 'http://localhost:3000') return true
  try {
    const url = new URL(origin)
    if (url.hostname.endsWith('.stay-islands-hk.pages.dev')) return true
    if (url.hostname === 'stay-islands-hk.pages.dev') return true
  } catch {
    return false
  }
  return false
}

export const corsMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const env = c.env
  const corsHandler = cors({
    origin: (origin) => {
      if (!origin) return env.FRONTEND_URL
      return isAllowedOrigin(origin, env) ? origin : env.FRONTEND_URL
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return corsHandler(c, next)
}
