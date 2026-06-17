import nodemailer from "nodemailer"

function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendOtpEmail(email: string, code: string) {
  const transport = getTransport()
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  if (!transport || !from) {
    console.info(`[dev] OTP for ${email}: ${code}`)
    return
  }

  await transport.sendMail({
    from,
    to: email,
    subject: "رمز الدخول — متتبع التلاوة",
    text: `رمز الدخول الخاص بك: ${code}\n\nصالح لمدة 10 دقائق.`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6">
        <h2>متتبع التلاوة</h2>
        <p>رمز الدخول الخاص بك:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px">${code}</p>
        <p style="color: #666">صالح لمدة 10 دقائق.</p>
      </div>
    `,
  })
}
