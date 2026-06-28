import type { Bindings } from '../types'

export function normalizePhone(phone: string): string {
  let normalized = phone.trim().replace(/[\s\-\(\)\.]/g, '')

  if (normalized.startsWith('+')) {
    return '+' + normalized.slice(1).replace(/\D/g, '')
  }

  normalized = normalized.replace(/\D/g, '')
  if (!normalized.startsWith('852')) {
    normalized = '852' + normalized
  }

  return normalized
}

export async function sendCloudwapiMessage(
  env: Bindings,
  { phone, message, mediaUrl }: { phone: string; message: string; mediaUrl?: string }
): Promise<unknown> {
  const apiKey = env.CLOUDWAPI_API_KEY
  if (!apiKey) {
    throw new Error('CLOUDWAPI_API_KEY not configured')
  }

  const to = normalizePhone(phone).replace(/\D/g, '')
  const sender = (env.CLOUDWAPI_SENDER || '85262322466').replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)

  let url: string
  if (mediaUrl) {
    url = `https://unofficial.cloudwapi.in/send-media?api_key=${apiKey}&sender=${sender}&number=${to}&media_type=image&caption=${encodedMessage}&url=${encodeURIComponent(mediaUrl)}`
  } else {
    url = `https://unofficial.cloudwapi.in/send-message?api_key=${apiKey}&sender=${sender}&number=${to}&message=${encodedMessage}`
  }
  console.log(`Sending to CloudWAPI: ${url.replace(`api_key=${apiKey}`, 'api_key=***')}`)

  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const result = (await resp.json().catch(() => ({}))) as Record<string, unknown>

  if (result.status !== true && result.status !== 'success') {
    throw new Error(`CloudWAPI request failed: ${resp.status} ${JSON.stringify(result)}`)
  }

  return result
}
