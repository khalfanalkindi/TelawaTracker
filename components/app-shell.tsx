"use client"

import { useEffect, useState } from "react"
import { LoginPage } from "@/components/login-page"
import { TelawaTracker } from "@/components/telawa-tracker"
import { fetchSession } from "@/lib/api"
import type { TelawaEntry } from "@/lib/types"
import { Loader2 } from "lucide-react"

export function AppShell() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [initialEntry, setInitialEntry] = useState<TelawaEntry | null>(null)
  const [initialStreak, setInitialStreak] = useState(0)

  useEffect(() => {
    fetchSession()
      .then((session) => {
        if (session?.authenticated) {
          setEmail(session.email)
          setInitialEntry(session.entry)
          setInitialStreak(session.streak)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="جاري التحميل" />
      </div>
    )
  }

  if (!email) {
    return (
      <LoginPage
        onAuthenticated={({ email: userEmail, entry, streak }) => {
          setEmail(userEmail)
          setInitialEntry(entry)
          setInitialStreak(streak)
        }}
      />
    )
  }

  return (
    <TelawaTracker
      email={email}
      initialEntry={initialEntry}
      initialStreak={initialStreak}
      onLogout={() => {
        setEmail(null)
        setInitialEntry(null)
        setInitialStreak(0)
      }}
    />
  )
}
