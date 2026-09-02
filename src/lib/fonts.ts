"use client"

import { useEffect, useMemo } from "react"
import type { FontFile } from "./types"

// 100% self-hosted font system:
// - vazirmatn + nastaliq via next/font (bundled at build)
// - everything else via the custom font registry (TTFs in /public/fonts, injected at runtime)
// → zero external CDN requests, fast & reliable for Iranian visitors.

export type FontDef = {
  key: string
  label: string
  family: string
  source: "builtin" | "custom"
  kind: "body" | "display" | "both"
}

export const BUILTIN_FONTS: FontDef[] = [
  { key: "vazirmatn", label: "وزیرمتن", family: "var(--font-vazirmatn), Vazirmatn, sans-serif", source: "builtin", kind: "both" },
  { key: "nastaliq", label: "نستعلیق (نوتو)", family: "var(--font-nastaliq), 'Noto Nastaliq Urdu', serif", source: "builtin", kind: "display" },
]

// Hook that returns the full font list (builtin + custom) for a given set of custom fonts.
export function useFonts(customFonts: FontFile[]): { fonts: FontDef[]; map: Record<string, FontDef> } {
  const fonts = useMemo(() => {
    const custom: FontDef[] = customFonts.map((f) => ({
      key: `custom:${f.name}`,
      label: f.label,
      family: `'${f.name}', sans-serif`,
      source: "custom",
      kind: "both",
    }))
    return [...custom, ...BUILTIN_FONTS]
  }, [customFonts])

  const map = useMemo(() => Object.fromEntries(fonts.map((f) => [f.key, f])), [fonts])
  return { fonts, map }
}

export function fontFamilyFor(key: string | null | undefined, fallback = "var(--font-vazirmatn), sans-serif"): string {
  if (!key) return fallback
  if (key.startsWith("custom:")) {
    const name = key.slice("custom:".length)
    return `'${name}', ${fallback}`
  }
  const builtin = BUILTIN_FONTS.find((f) => f.key === key)
  return builtin?.family ?? fallback
}

export function fontLabel(key: string | null | undefined): string {
  if (!key) return "پیش‌فرض"
  if (key.startsWith("custom:")) return key.slice("custom:".length)
  return BUILTIN_FONTS.find((f) => f.key === key)?.label ?? key
}

// Component that injects @font-face CSS for all custom fonts.
// Render once at the app root.
export function CustomFontInjector({ fonts }: { fonts: FontFile[] }) {
  useEffect(() => {
    const id = "custom-fonts-style"
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement("style")
      el.id = id
      document.head.appendChild(el)
    }
    if (fonts.length === 0) {
      el.textContent = ""
      return
    }
    el.textContent = fonts
      .map(
        (f) => `@font-face { font-family: '${f.name}'; src: url('${f.url}') format('truetype'); font-display: swap; }`
      )
      .join("\n")
  }, [fonts])
  return null
}
