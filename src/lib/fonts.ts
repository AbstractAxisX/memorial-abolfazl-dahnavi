// Font registry — all Persian fonts available in the site.
// Google Fonts are loaded via next/font in layout.tsx (variables below).
// fontcdn.ir fonts are loaded via <link> in layout.tsx.

export type FontDef = {
  key: string
  label: string
  family: string
  source: "google" | "cdn"
  /** CSS variable name set by next/font (google only) */
  variable?: string
  /** For headings? */
  kind: "body" | "display" | "both"
}

export const FONTS: FontDef[] = [
  { key: "vazirmatn", label: "وزیرمتن", family: "var(--font-vazirmatn), Vazirmatn, sans-serif", source: "google", variable: "--font-vazirmatn", kind: "both" },
  { key: "nastaliq", label: "نستعلیق (نوتو)", family: "var(--font-nastaliq), 'Noto Nastaliq Urdu', serif", source: "google", variable: "--font-nastaliq", kind: "display" },
  { key: "gulzar", label: "گلزار (نستعلیق)", family: "Gulzar, 'Noto Nastaliq Urdu', serif", source: "cdn", kind: "display" },
  { key: "lalezar", label: "لاله‌زار", family: "Lalezar, sans-serif", source: "cdn", kind: "display" },
  { key: "markazi", label: "مرکزی", family: "'Markazi Text', serif", source: "cdn", kind: "both" },
  { key: "shabnam", label: "شبنم", family: "Shabnam, sans-serif", source: "cdn", kind: "both" },
  { key: "sahel", label: "ساحل", family: "Sahel, sans-serif", source: "cdn", kind: "both" },
  { key: "samim", label: "صمیم", family: "Samim, sans-serif", source: "cdn", kind: "both" },
  { key: "gandom", label: "گندم", family: "Gandom, sans-serif", source: "cdn", kind: "display" },
]

export const FONT_MAP: Record<string, FontDef> = Object.fromEntries(
  FONTS.map((f) => [f.key, f])
)

export function fontFamilyFor(key: string | null | undefined, fallback = "var(--font-vazirmatn), sans-serif"): string {
  if (key && FONT_MAP[key]) return FONT_MAP[key].family
  return fallback
}

export function fontLabel(key: string | null | undefined): string {
  if (key && FONT_MAP[key]) return FONT_MAP[key].label
  return "پیش‌فرض"
}
