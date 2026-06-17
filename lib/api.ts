import type { TelawaEntry } from "@/lib/types"

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed")
  }
  return data
}

export async function fetchSession() {
  const res = await fetch("/api/auth/me", { credentials: "include" })
  if (res.status === 401) return null
  return parseJson<{
    authenticated: boolean
    email: string
    entry: TelawaEntry | null
    streak: number
  }>(res)
}

export async function sendOtp(email: string) {
  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return parseJson<{ ok: boolean }>(res)
}

export async function verifyOtp(email: string, code: string) {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, code }),
  })
  return parseJson<{
    email: string
    entry: TelawaEntry | null
    streak: number
  }>(res)
}

export async function logout() {
  const res = await fetch("/api/auth/me", {
    method: "DELETE",
    credentials: "include",
  })
  return parseJson<{ ok: boolean }>(res)
}

export async function fetchEntry() {
  const res = await fetch("/api/entry", { credentials: "include" })
  return parseJson<{ entry: TelawaEntry | null; streak: number }>(res)
}

export async function saveEntry(data: {
  surah: string
  page: string
  aya: string
  date: string
}) {
  const res = await fetch("/api/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  })
  return parseJson<{ entry: TelawaEntry; streak: number }>(res)
}

export async function resetEntry() {
  const res = await fetch("/api/entry", {
    method: "DELETE",
    credentials: "include",
  })
  return parseJson<{ ok: boolean }>(res)
}
