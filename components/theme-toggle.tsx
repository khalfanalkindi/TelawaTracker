"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

const THEME_KEY = "telawa-theme"

type Theme = "light" | "dark"

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    const resolved =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    setTheme(resolved)
    applyTheme(resolved)
  }, [])

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light"
    setTheme(next)
    applyTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
      className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
    >
      {theme === "light" ? (
        <Moon className="size-4" aria-hidden="true" />
      ) : (
        <Sun className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
