"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { surahs, getSurahByNumber } from "@/lib/surahs"
import { logout, resetEntry, saveEntry } from "@/lib/api"
import { getEffectiveStreak } from "@/lib/streak"
import { getUserTimeZone } from "@/lib/timezone"
import type { TelawaEntry } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Check, BookOpen, CalendarDays, Flame, LogOut, RotateCcw } from "lucide-react"

interface TelawaTrackerProps {
  email: string
  initialEntry: TelawaEntry | null
  initialStreak: number
  onLogout: () => void
}

export function TelawaTracker({
  email,
  initialEntry,
  initialStreak,
  onLogout,
}: TelawaTrackerProps) {
  const [surah, setSurah] = useState<string>("")
  const [page, setPage] = useState<string>("")
  const [aya, setAya] = useState<string>("")
  const [saved, setSaved] = useState(false)
  const [lastEntry, setLastEntry] = useState<TelawaEntry | null>(initialEntry)
  const [streak, setStreak] = useState(initialStreak)
  const [today, setToday] = useState<string>("")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedSurah = getSurahByNumber(surah)

  useEffect(() => {
    const now = new Date()
    const timeZone = getUserTimeZone()
    const formatted = new Intl.DateTimeFormat("ar", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone,
    }).format(now)
    setToday(formatted)

    if (initialEntry) {
      setSurah(initialEntry.surah)
      setPage(initialEntry.page)
      setAya(initialEntry.aya)
    }
  }, [initialEntry])

  useEffect(() => {
    const refreshStreak = () => {
      setStreak(getEffectiveStreak(lastEntry, getUserTimeZone()))
    }

    refreshStreak()
    const interval = setInterval(refreshStreak, 30_000)
    return () => clearInterval(interval)
  }, [lastEntry])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surah || saving) return

    setSaving(true)
    try {
      const { entry } = await saveEntry({ surah, page, aya, date: today })
      setLastEntry(entry)
      setStreak(entry.streak)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // ignore for now
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!lastEntry && !surah && !page && !aya) return
    setShowResetConfirm(true)
  }

  const confirmReset = async () => {
    try {
      await resetEntry()
      setLastEntry(null)
      setStreak(0)
      setSurah("")
      setPage("")
      setAya("")
    } catch {
      // ignore
    } finally {
      setShowResetConfirm(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      onLogout()
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-5">
      <ConfirmDialog
        open={showResetConfirm}
        title="حذف البيانات"
        message="هل تريد حذف بيانات التلاوة والسلسلة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
      {/* Top toolbar: streak (left) + actions (right) */}
      <div className="mb-3 flex items-center justify-between" dir="ltr">
        <div
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-bold text-primary shadow-sm"
          aria-label={`السلسلة: ${streak} يوم`}
        >
          <Flame className="size-4 text-accent" aria-hidden="true" />
          <span>{streak}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleReset}
            aria-label="إعادة التعيين"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="تسجيل الخروج"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Header */}
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
          سجّل وردك اليومي من القرآن الكريم
        </p>
        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
          {email}
        </p>

        {/* Date */}
        <div className="mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-secondary-foreground shadow-sm">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          <span>{today}</span>
        </div>
      </header>

      {/* Decorative divider */}
      <div className="my-7 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <div className="size-1.5 rotate-45 bg-accent" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Surah select */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="surah" className="text-sm font-semibold text-secondary-foreground">
            السورة
          </Label>
          <Select value={surah} onValueChange={(value) => setSurah(value ?? "")}>
            <SelectTrigger
              id="surah"
              className="h-12 w-full rounded-2xl border-border bg-card text-base shadow-sm data-placeholder:text-muted-foreground"
            >
              {selectedSurah ? (
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                    {selectedSurah.number}
                  </span>
                  <span className="font-serif">{selectedSurah.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">اختر السورة</span>
              )}
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {surahs.map((s) => (
                <SelectItem key={s.number} value={String(s.number)} className="text-base">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                      {s.number}
                    </span>
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page + Aya */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="page" className="text-sm font-semibold text-secondary-foreground">
              الصفحة
            </Label>
            <Input
              id="page"
              type="number"
              inputMode="numeric"
              min={1}
              max={604}
              placeholder="رقم"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="h-12 rounded-2xl border-border bg-card text-center text-base shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="aya" className="text-sm font-semibold text-secondary-foreground">
              الآية
            </Label>
            <Input
              id="aya"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="رقم"
              value={aya}
              onChange={(e) => setAya(e.target.value)}
              className="h-12 rounded-2xl border-border bg-card text-center text-base shadow-sm"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={!surah || saving}
          className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="size-5" aria-hidden="true" />
              تم الحفظ
            </>
          ) : (
            <>
              <BookOpen className="size-5" aria-hidden="true" />
              حفظ التلاوة
            </>
          )}
        </button>
      </form>

      {/* Last saved entry */}
      {lastEntry && (
        <section
          aria-label="آخر تلاوة محفوظة"
          className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="flex size-7 items-center justify-center rounded-full bg-accent/20">
              <BookOpen className="size-4 text-accent-foreground" aria-hidden="true" />
            </span>
            آخر تلاوة
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-secondary/60 px-2 py-3">
              <div className="text-xs text-muted-foreground">السورة</div>
              <div className="mt-1 font-serif text-lg font-bold text-secondary-foreground">
                {getSurahByNumber(lastEntry.surah)?.name ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-2 py-3">
              <div className="text-xs text-muted-foreground">الصفحة</div>
              <div className="mt-1 text-lg font-bold text-secondary-foreground">
                {lastEntry.page || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-2 py-3">
              <div className="text-xs text-muted-foreground">الآية</div>
              <div className="mt-1 text-lg font-bold text-secondary-foreground">
                {lastEntry.aya || "—"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">{lastEntry.date}</p>
        </section>
      )}
    </main>
  )
}
