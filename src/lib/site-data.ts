import { db } from "./db"
import type { SiteData, SiteSetting } from "./types"
import { hashPassword } from "./auth"
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_SETTING_CREATE } from "./default-setting"

/**
 * Guarantees the `siteSetting` row exists. A fresh/wiped database (e.g. after
 * `prisma db push`) has tables but no row — previously the whole site crashed
 * with `Cannot read properties of null (reading 'globalFontKey')`. This runs
 * on every fetchSiteData() call: upsert with an empty update is a no-op when
 * the row exists, and creates the default row (with a working admin password)
 * when it doesn't.
 */
export async function ensureSettingRow() {
  return db.siteSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      ...DEFAULT_SETTING_CREATE,
      adminPasswordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    },
  })
}

// Strips every sensitive field — safe to send to the browser.
export function sanitizeSetting(s: {
  adminPassword?: string | null
  adminPasswordHash?: string | null
  [k: string]: unknown
}): Omit<SiteSetting, never> {
  const { adminPassword: _p, adminPasswordHash: _h, ...rest } = s as Record<string, unknown>
  return rest as unknown as SiteSetting
}

// Full site tree used by the public API AND by server components (SSR/SEO).
// JSON round-trip normalizes Prisma Date objects into ISO strings.
export async function fetchSiteData(): Promise<SiteData> {
  const [setting, pages, blogPosts, messages, fonts, media] = await Promise.all([
    ensureSettingRow(),
    db.page.findMany({
      orderBy: { order: "asc" },
      include: { sections: { orderBy: { order: "asc" } } },
    }),
    db.blogPost.findMany({ orderBy: { order: "asc" } }),
    db.guestMessage.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.fontFile.findMany(),
    db.mediaFile.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  return JSON.parse(
    JSON.stringify({
      setting: setting ? sanitizeSetting(setting) : null,
      pages,
      blogPosts,
      messages,
      fonts,
      media,
    })
  )
}

// Base URL for canonical/OG links — admin-configurable, env fallback.
export function siteBaseUrl(setting: { publicUrl?: string | null } | null | undefined): string {
  const fromSetting = setting?.publicUrl?.trim()
  if (fromSetting) return fromSetting.replace(/\/+$/, "")
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, "")
  return "http://localhost:3000"
}

// ---------- helpers for metadata ----------

export function pageDescription(page: { subtitle?: string | null; sections: { type: string; config: string }[] }): string {
  if (page.subtitle?.trim()) return page.subtitle.trim()
  for (const s of page.sections) {
    if (s.type === "text" || s.type === "hero") {
      try {
        const cfg = JSON.parse(s.config) as { content?: string; heroIntro?: string }
        const text = (cfg.content || cfg.heroIntro || "").replace(/\s+/g, " ").trim()
        if (text) return text.slice(0, 155) + (text.length > 155 ? "…" : "")
      } catch { /* ignore */ }
    }
  }
  return "یادبود دیجیتال شهید ابوالفضل دهنوی — امدادگر یکم جمعیت هلال احمر"
}

export { hashPassword }
