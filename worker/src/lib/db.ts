import { mapRow, mapRows } from '../db/schema'

export async function first<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const row = await db.prepare(sql).bind(...params).first<Record<string, unknown>>()
  return row ? mapRow<T>(row) : null
}

export async function all<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { results } = await db.prepare(sql).bind(...params).all<Record<string, unknown>>()
  return mapRows<T>(results)
}

export async function run(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run()
}
