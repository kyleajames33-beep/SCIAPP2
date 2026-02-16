/**
 * Referral Code Generator and Utilities
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars (0, O, I, 1)

/**
 * Generate a unique 6-character referral code
 */
export function generateReferralCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return code
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  if (!code || code.length !== 6) return false
  return /^[A-Z2-9]{6}$/.test(code.toUpperCase())
}

/**
 * Format referral code for display (adds dash in middle)
 */
export function formatReferralCode(code: string): string {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)}-${code.slice(3)}`
}
