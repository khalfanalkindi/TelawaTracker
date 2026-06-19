export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

export function resolveTimeZone(timeZone?: string | null): string {
  if (timeZone && isValidTimeZone(timeZone)) return timeZone
  return "UTC"
}

/** Browser/device timezone (for streak midnight boundaries). */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getRequestTimeZone(request: Request): string {
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get("tz")
  const fromHeader = request.headers.get("x-user-timezone")
  return resolveTimeZone(fromQuery ?? fromHeader)
}

export function timeZoneQuery(): string {
  return `tz=${encodeURIComponent(getUserTimeZone())}`
}
