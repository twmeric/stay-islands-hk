import type { MiddlewareHandler } from 'hono'
import jwt from '@tsndr/cloudflare-worker-jwt'
import type { Bindings, Variables } from '../types'
import type { AdminRole } from '../db/schema'

type AuthPayload = {
  adminId: number
  email: string
  role: AdminRole
}

export const requireAdmin: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = auth.slice(7).trim()

  if (c.env.CACHE) {
    try {
      const revoked = await c.env.CACHE.get(`logout:${token}`)
      if (revoked) {
        return c.json({ error: 'Token revoked' }, 401)
      }
    } catch {
      // Ignore KV read errors
    }
  }

  try {
    const data = await jwt.verify(token, c.env.JWT_SECRET)
    if (!data || !data.payload) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    const payload = data.payload as AuthPayload
    if (typeof payload.adminId !== 'number' || !payload.email || !payload.role) {
      return c.json({ error: 'Invalid token payload' }, 401)
    }

    c.set('adminId', payload.adminId)
    c.set('adminRole', payload.role)

    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export function requireRole(
  ...allowedRoles: AdminRole[]
): MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> {
  return async (c, next) => {
    const role = c.get('adminRole')
    if (!role || !allowedRoles.includes(role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}

export async function signAccessToken(env: Bindings, payload: AuthPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  return jwt.sign({ ...payload, exp }, env.JWT_SECRET)
}

export async function signRefreshToken(env: Bindings, payload: AuthPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  return jwt.sign({ ...payload, exp }, env.JWT_SECRET)
}

export async function verifyRefreshToken(env: Bindings, token: string): Promise<AuthPayload | null> {
  try {
    const data = await jwt.verify(token, env.JWT_SECRET)
    if (!data || !data.payload) {
      return null
    }
    const payload = data.payload as AuthPayload
    if (typeof payload.adminId !== 'number' || !payload.email || !payload.role) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
