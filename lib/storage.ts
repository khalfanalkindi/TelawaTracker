// Client-side storage in the browser (localStorage), not a server database.
// Keys: telawa-db (table rows), telawa-user-id (device user id)
const USER_ID_KEY = "telawa-user-id"
const DB_KEY = "telawa-db"
const LEGACY_KEY = "telawa-progress"

export interface TelawaEntry {
  id: string
  userId: string
  surah: string
  page: string
  aya: string
  date: string
  savedAt: number
  streak: number
  lastRecitationDay: string
}

interface TelawaDatabase {
  entries: TelawaEntry[]
}

function readDb(): TelawaDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as TelawaDatabase
  } catch {
    // ignore
  }
  return { entries: [] }
}

function writeDb(db: TelawaDatabase) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // ignore
  }
}

export function getDeviceUserId(): string {
  try {
    const existing = localStorage.getItem(USER_ID_KEY)
    if (existing) return existing

    const id = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, id)
    return id
  } catch {
    return "anonymous"
  }
}

function toDayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function dayDiff(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`)
  const b = new Date(`${to}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function getEffectiveStreak(entry: TelawaEntry | null): number {
  if (!entry || entry.streak === 0) return 0
  const today = toDayKey()
  const diff = dayDiff(entry.lastRecitationDay, today)
  if (diff <= 1) return entry.streak
  return 0
}

function computeStreak(lastDay: string | null, currentStreak: number, today: string): number {
  if (!lastDay) return 1
  const diff = dayDiff(lastDay, today)
  if (diff === 0) return currentStreak || 1
  if (diff === 1) return (currentStreak || 0) + 1
  return 1
}

function migrateLegacy(userId: string): TelawaEntry | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null

    const legacy = JSON.parse(raw) as {
      date: string
      surah: string
      page: string
      aya: string
      savedAt: number
    }

    const entry: TelawaEntry = {
      id: crypto.randomUUID(),
      userId,
      surah: legacy.surah,
      page: legacy.page,
      aya: legacy.aya,
      date: legacy.date,
      savedAt: legacy.savedAt,
      streak: 1,
      lastRecitationDay: toDayKey(new Date(legacy.savedAt)),
    }

    const db = readDb()
    db.entries = db.entries.filter((e) => e.userId !== userId)
    db.entries.push(entry)
    writeDb(db)
    localStorage.removeItem(LEGACY_KEY)
    return entry
  } catch {
    return null
  }
}

export function getUserEntry(): TelawaEntry | null {
  const userId = getDeviceUserId()
  const db = readDb()
  const found = db.entries.find((e) => e.userId === userId) ?? null
  if (found) return found
  return migrateLegacy(userId)
}

export function saveUserEntry(data: {
  surah: string
  page: string
  aya: string
  date: string
}): TelawaEntry {
  const userId = getDeviceUserId()
  const today = toDayKey()
  const db = readDb()
  const existing = db.entries.find((e) => e.userId === userId) ?? null

  const streak = computeStreak(
    existing?.lastRecitationDay ?? null,
    existing ? getEffectiveStreak(existing) : 0,
    today,
  )

  const entry: TelawaEntry = {
    id: existing?.id ?? crypto.randomUUID(),
    userId,
    surah: data.surah,
    page: data.page,
    aya: data.aya,
    date: data.date,
    savedAt: Date.now(),
    streak,
    lastRecitationDay: today,
  }

  db.entries = db.entries.filter((e) => e.userId !== userId)
  db.entries.push(entry)
  writeDb(db)
  return entry
}

export function resetUserEntry(): boolean {
  const userId = getDeviceUserId()
  const db = readDb()
  const hadRow = db.entries.some((e) => e.userId === userId)
  if (!hadRow) return false

  db.entries = db.entries.filter((e) => e.userId !== userId)
  if (db.entries.length === 0) {
    localStorage.removeItem(DB_KEY)
  } else {
    writeDb(db)
  }
  return true
}

export function hasUserRow(): boolean {
  const userId = getDeviceUserId()
  return readDb().entries.some((e) => e.userId === userId)
}
