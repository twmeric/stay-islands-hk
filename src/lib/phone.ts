export function normalizeHKPhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+')) {
    return cleaned.slice(1).replace(/\D/g, '')
  }
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('852')) {
    return digits
  }
  // If the user entered a longer international number, keep it as-is.
  if (digits.length > 9) {
    return digits
  }
  return `852${digits}`
}
