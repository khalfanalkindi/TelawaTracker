import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/server/db"
import { verifyOtp } from "@/lib/server/otp"
import { createSessionToken, sessionCookieOptions } from "@/lib/server/session"
import { getEffectiveStreak } from "@/lib/streak"
import { resolveTimeZone } from "@/lib/timezone"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      code?: string
      timeZone?: string
    }
    const email = body.email?.trim().toLowerCase()
    const code = body.code?.trim()

    if (!email || !code) {
      return NextResponse.json({ error: "البريد والرمز مطلوبان" }, { status: 400 })
    }

    if (!verifyOtp(email, code)) {
      return NextResponse.json({ error: "رمز غير صحيح أو منتهي" }, { status: 401 })
    }

    const user = await getOrCreateUser(email)
    const token = createSessionToken(user.email)
    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    const entry = user.entry
    const timeZone = resolveTimeZone(body.timeZone)
    return NextResponse.json({
      email: user.email,
      entry,
      streak: getEffectiveStreak(entry, timeZone),
    })
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الدخول" }, { status: 500 })
  }
}
