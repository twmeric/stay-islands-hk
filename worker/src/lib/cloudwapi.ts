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
  { phone, message }: { phone: string; message: string }
): Promise<unknown> {
  const to = normalizePhone(phone)
  const url = 'https://api.cloudwapi.com/v1/messages'
  const body = {
    to,
    body: message,
    sender: env.CLOUDWAPI_SENDER,
  }

  console.log(`Would send to CloudWAPI: ${url}`, body)

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.CLOUDWAPI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => 'Unknown error')
    throw new Error(`CloudWAPI request failed: ${resp.status} ${text}`)
  }

  return resp.json().catch(() => ({}))
}
