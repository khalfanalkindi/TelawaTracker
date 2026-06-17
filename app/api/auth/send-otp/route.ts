import { NextResponse } from "next/server"
import { normalizeEmail } from "@/lib/server/db"
import { sendOtpEmail } from "@/lib/server/email"
import { createOtp } from "@/lib/server/otp"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 })
    }

    const normalized = normalizeEmail(email)
    const { code, isResendTooSoon } = createOtp(normalized)

    if (isResendTooSoon) {
      return NextResponse.json(
        { error: "انتظر دقيقة قبل إعادة إرسال الرمز" },
        { status: 429 },
      )
    }

    await sendOtpEmail(normalized, code)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "تعذر إرسال الرمز" }, { status: 500 })
  }
}
