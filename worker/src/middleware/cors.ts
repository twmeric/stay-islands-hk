import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from '../types'

export const corsMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const corsHandler = cors({
    origin: c.env.FRONTEND_URL,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return corsHandler(c, next)
}
