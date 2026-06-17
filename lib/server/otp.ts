import { normalizeEmail } from "@/lib/server/db"

const OTP_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000

interface OtpRecord {
  code: string
  expiresAt: number
  lastSentAt: number
}

const otpStore = new Map<string, OtpRecord>()

function generateCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}

export function createOtp(email: string): { code: string; isResendTooSoon: boolean } {
  const key = normalizeEmail(email)
  const now = Date.now()
  const existing = otpStore.get(key)

  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    return { code: existing.code, isResendTooSoon: true }
  }

  const code = generateCode()
  otpStore.set(key, {
    code,
    expiresAt: now + OTP_TTL_MS,
    lastSentAt: now,
  })

  return { code, isResendTooSoon: false }
}

export function verifyOtp(email: string, code: string): boolean {
  const key = normalizeEmail(email)
  const record = otpStore.get(key)
  if (!record) return false

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key)
    return false
  }

  const ok = record.code === code.trim()
  if (ok) otpStore.delete(key)
  return ok
}
