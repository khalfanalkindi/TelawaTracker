import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { normalizeEmail } from "@/lib/server/db"

const COOKIE_NAME = "telawa-session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  return secret
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

export function createSessionToken(email: string): string {
  const payload = JSON.stringify({
    email: normalizeEmail(email),
    exp: Date.now() + SESSION_TTL_MS,
  })
  const encoded = Buffer.from(payload).toString("base64url")
  return `${encoded}.${sign(encoded)}`
}

export function verifySessionToken(token: string): string | null {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const { email, exp } = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      email: string
      exp: number
    }
    if (!email || Date.now() > exp) return null
    return normalizeEmail(email)
  } catch {
    return null
  }
}

export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  }
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }
}
