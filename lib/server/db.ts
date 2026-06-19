import { promises as fs } from "fs"
import path from "path"
import type { Database, TelawaEntry, UserRecord } from "@/lib/types"
import { computeStreak, toDayKey } from "@/lib/streak"

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "db.json")

const emptyDb = (): Database => ({ users: [] })

async function ensureDbFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DB_PATH)
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb(), null, 2), "utf8")
  }
}

async function readDb(): Promise<Database> {
  await ensureDbFile()
  try {
    const raw = await fs.readFile(DB_PATH, "utf8")
    const parsed = JSON.parse(raw) as Database
    if (!Array.isArray(parsed.users)) return emptyDb()
    return parsed
  } catch {
    return emptyDb()
  }
}

async function writeDb(db: Database) {
  await ensureDbFile()
  const tmp = `${DB_PATH}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")
  await fs.rename(tmp, DB_PATH)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await readDb()
  return db.users.find((u) => u.email === normalizeEmail(email)) ?? null
}

export async function getOrCreateUser(email: string): Promise<UserRecord> {
  const normalized = normalizeEmail(email)
  const db = await readDb()
  const existing = db.users.find((u) => u.email === normalized)
  if (existing) return existing

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email: normalized,
    createdAt: Date.now(),
    entry: null,
  }
  db.users.push(user)
  await writeDb(db)
  return user
}

export async function getUserEntry(email: string): Promise<TelawaEntry | null> {
  const user = await findUserByEmail(email)
  return user?.entry ?? null
}

export async function saveUserEntry(
  email: string,
  data: { surah: string; page: string; aya: string; date: string },
): Promise<TelawaEntry> {
  const normalized = normalizeEmail(email)
  const db = await readDb()
  const user = db.users.find((u) => u.email === normalized)
  if (!user) throw new Error("User not found")

  const today = toDayKey()
  const existing = user.entry

  const streak = computeStreak(
    existing?.lastRecitationDay ?? null,
    existing?.streak ?? 0,
    today,
  )

  const entry: TelawaEntry = {
    surah: data.surah,
    page: data.page,
    aya: data.aya,
    date: data.date,
    savedAt: Date.now(),
    streak,
    lastRecitationDay: today,
  }

  user.entry = entry
  await writeDb(db)
  return entry
}

export async function resetUserEntry(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)
  const db = await readDb()
  const user = db.users.find((u) => u.email === normalized)
  if (!user?.entry) return false

  user.entry = null
  await writeDb(db)
  return true
}
