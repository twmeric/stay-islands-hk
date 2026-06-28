const STORAGE_KEY = 'hkm_referral_code'

export function captureRefCode(): void {
  try {
    const url = new URL(window.location.href)
    const ref = url.searchParams.get('ref')
    if (ref) {
      localStorage.setItem(STORAGE_KEY, ref)
    }
  } catch {
    // ignore
  }
}

export function getRefCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearRefCode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
