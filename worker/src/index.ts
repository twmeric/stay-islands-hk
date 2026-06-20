import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { Bindings, Variables } from './types'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/error'
import publicRoute from './routes/public'
import adminRoute from './routes/admin'
import crmRoute from './routes/crm'
import webhooksRoute from './routes/webhooks'
import { seedDatabase } from './lib/seed'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware
app.use(logger())
app.use('*', corsMiddleware)
app.onError(errorHandler)

// Auto-seed demo data if properties table is empty
app.use('*', async (c, next) => {
  try {
    const row = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM properties')
      .first<{ count: number }>()
    if (row && row.count === 0) {
      await seedDatabase(c.env.DB)
    }
  } catch (err) {
    console.error('Seed check failed:', err)
  }
  await next()
})

// Health check
app.get('/', (c) => {
  return c.json({
    ok: true,
    service: 'stay-islands-hk-worker',
    timestamp: new Date().toISOString(),
  })
})

// Routes
app.route('/api/public', publicRoute)
app.route('/api/admin', adminRoute)
app.route('/api/crm', crmRoute)
app.route('/api/webhooks', webhooksRoute)

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
