import type { TelawaEntry } from "@/lib/types"

export function toDayKey(date = new Date()): string {
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

export function computeStreak(
  lastDay: string | null,
  currentStreak: number,
  today: string,
): number {
  if (!lastDay) return 1
  const diff = dayDiff(lastDay, today)
  if (diff === 0) return currentStreak || 1
  if (diff === 1) return (currentStreak || 0) + 1
  return 1
}
