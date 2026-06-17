"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { sendOtp, verifyOtp } from "@/lib/api"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react"
import type { TelawaEntry } from "@/lib/types"

interface LoginPageProps {
  onAuthenticated: (data: {
    email: string
    entry: TelawaEntry | null
    streak: number
  }) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await sendOtp(email)
      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الرمز")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await verifyOtp(email, code)
      onAuthenticated(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "رمز غير صحيح")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-5">
      <div className="mb-3 flex justify-end" dir="ltr">
        <ThemeToggle />
      </div>

      <header className="flex flex-col items-center text-center">
        <div className="relative size-28 overflow-hidden rounded-3xl border border-border bg-card shadow-sm ring-1 ring-accent/30">
          <Image
            src="/quran-icon.svg"
            alt="Telawa Tracker"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-primary text-balance">
          متتبع التلاوة
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {step === "email"
            ? "أدخل بريدك الإلكتروني لتسجيل الدخول"
            : "أدخل الرمز المرسل إلى بريدك"}
        </p>
      </header>

      <div className="my-7 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <div className="size-1.5 rotate-45 bg-accent" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-semibold text-secondary-foreground">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@mail.com"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-2xl border-border bg-card pr-11 pl-4 text-base shadow-sm"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                إرسال الرمز
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground" dir="ltr">
            {email}
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="otp" className="text-sm font-semibold text-secondary-foreground">
              رمز التحقق
            </Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                dir="ltr"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                className="h-12 rounded-2xl border-border bg-card pr-11 pl-4 text-center text-lg tracking-[0.3em] shadow-sm"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : "تأكيد الدخول"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email")
              setCode("")
              setError("")
            }}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            تغيير البريد الإلكتروني
          </button>
        </form>
      )}
    </main>
  )
}
