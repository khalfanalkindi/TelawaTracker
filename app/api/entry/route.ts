import { NextResponse } from "next/server"
import { getUserEntry, resetUserEntry, saveUserEntry } from "@/lib/server/db"
import { getSessionEmail } from "@/lib/server/session"
import { getEffectiveStreak } from "@/lib/streak"

async function requireEmail() {
  const email = await getSessionEmail()
  if (!email) return null
  return email
}

export async function GET() {
  const email = await requireEmail()
  if (!email) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const entry = await getUserEntry(email)
  return NextResponse.json({
    entry,
    streak: getEffectiveStreak(entry),
  })
}

export async function POST(request: Request) {
  const email = await requireEmail()
  if (!email) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const body = (await request.json()) as {
    surah?: string
    page?: string
    aya?: string
    date?: string
  }

  if (!body.surah) {
    return NextResponse.json({ error: "السورة مطلوبة" }, { status: 400 })
  }

  const entry = await saveUserEntry(email, {
    surah: body.surah,
    page: body.page ?? "",
    aya: body.aya ?? "",
    date: body.date ?? "",
  })

  return NextResponse.json({ entry, streak: entry.streak })
}

export async function DELETE() {
  const email = await requireEmail()
  if (!email) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  await resetUserEntry(email)
  return NextResponse.json({ ok: true })
}
