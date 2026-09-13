export const DISPLAY_NAME_MAX_LENGTH = 80
export const PASSWORD_MIN_LENGTH = 8

export function normalizeDisplayName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function validateDisplayName(value) {
  const normalized = normalizeDisplayName(value)
  if (!normalized) return { valid: false, value: '', message: 'Enter a display name.' }
  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) return { valid: false, value: normalized, message: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.` }
  return { valid: true, value: normalized, message: '' }
}

export function validateEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email) return { valid: false, value: '', message: 'Enter an email address.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, value: email, message: 'Enter a valid email address.' }
  return { valid: true, value: email, message: '' }
}

export function validatePassword(value) {
  const password = String(value ?? '')
  if (!password) return { valid: false, message: 'Enter a password.' }
  if (password.length < PASSWORD_MIN_LENGTH) return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` }
  return { valid: true, message: '' }
}

export function validateNewPassword(newPassword, confirmation) {
  const passwordResult = validatePassword(newPassword)
  if (!passwordResult.valid) return passwordResult
  if (newPassword !== confirmation) return { valid: false, message: 'New passwords do not match.' }
  return { valid: true, message: '' }
}

export function supportsPasswordAuthentication(providerIds = []) {
  return providerIds.includes('password')
}
