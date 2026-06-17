export interface TelawaEntry {
  surah: string
  page: string
  aya: string
  date: string
  savedAt: number
  streak: number
  lastRecitationDay: string
}

export interface UserRecord {
  id: string
  email: string
  createdAt: number
  entry: TelawaEntry | null
}

export interface Database {
  users: UserRecord[]
}
