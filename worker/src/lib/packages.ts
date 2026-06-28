import type { Package } from '../db/schema'

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Convert a Package DB row into an API-friendly response.
 * JSON string columns are parsed into arrays/objects.
 */
export function formatPackageResponse(pkg: Package | null): Record<string, unknown> | null {
  if (!pkg) return null
  return {
    ...pkg,
    inclusions: safeJsonParse<string[]>(pkg.inclusions, []),
    itinerary: safeJsonParse<Array<{ day: string; title: string; desc: string }>>(pkg.itinerary, []),
    pricingOptions: safeJsonParse<Array<{ type: 'shared' | 'single'; label: string; price: number; currency: string }>>(
      pkg.pricingOptions,
      []
    ),
    gallery: safeJsonParse<string[]>(pkg.gallery, []),
  }
}
