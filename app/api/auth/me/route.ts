import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { clearSessionCookieOptions, getSessionEmail } from "@/lib/server/session"
import { getEffectiveStreak } from "@/lib/streak"
import { findUserByEmail } from "@/lib/server/db"

export async function GET() {
  const email = await getSessionEmail()
  if (!email) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    email: user.email,
    entry: user.entry,
    streak: getEffectiveStreak(user.entry),
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(clearSessionCookieOptions())
  return NextResponse.json({ ok: true })
}
