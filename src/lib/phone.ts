export function normalizeHKPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('852')) {
    return digits
  }
  return `852${digits}`
}
