import type { TelawaEntry } from "@/lib/types"
import { resolveTimeZone } from "@/lib/timezone"

export function toDayKey(date = new Date(), timeZone?: string): string {
  const tz = resolveTimeZone(timeZone)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function dayDiff(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`)
  const b = new Date(`${to}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Shown streak: only counts if the user already read today (in their timezone). */
export function getEffectiveStreak(
  entry: TelawaEntry | null,
  timeZone?: string,
): number {
  if (!entry || entry.streak === 0) return 0
  if (entry.lastRecitationDay !== toDayKey(new Date(), timeZone)) return 0
  return entry.streak
}

export function computeStreak(
  lastDay: string | null,
  storedStreak: number,
  today: string,
): number {
  if (!lastDay) return 1
  const diff = dayDiff(lastDay, today)
  if (diff === 0) return storedStreak || 1
  if (diff === 1) return storedStreak + 1
  return 1
}
