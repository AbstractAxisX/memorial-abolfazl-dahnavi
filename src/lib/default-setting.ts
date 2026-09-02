import type { SiteSetting } from "./types"

/**
 * Canonical defaults for the site — single source of truth.
 *
 * Why this exists: a clone of this repo can end up with a database that has
 * the tables but no `siteSetting` row (e.g. `prisma db push` on a fresh or
 * wrongly-resolved DATABASE_URL). The public site used to crash with
 * `Cannot read properties of null (reading 'globalFontKey')` in that case.
 * Every layer now falls back to these defaults, so the site ALWAYS renders
 * and the admin panel ALWAYS lets you log in.
 */

/** The documented default admin password for a fresh install. */
export const DEFAULT_ADMIN_PASSWORD = "abolfazl1405"

/** Data for `db.siteSetting.create/upsert` — mirrors prisma/schema.prisma defaults. */
export const DEFAULT_SETTING_CREATE = {
  id: "main",
  fullName: "ابوالفضل دهنوی",
  displayTitle: "شهید ابوالفضل دهنوی",
  subtitle: "امدادگر یکم جمعیت هلال احمر",
  birthDate: null,
  martyrdomDate: "۱۵ فروردین ۱۴۰۵",
  martyrdomPlace: "شهرستان مبارکه، اصفهان",
  role: "امدادگر یکم جمعیت هلال احمر",
  heroImage: null,
  heroIntro: null,
  publicUrl: null,
  adminPassword: "",
  globalFontKey: "vazirmatn",
  headingFontKey: "nastaliq",
  accent: "emerald",
}

/** Client-safe default (same values, typed for the public UI). */
export const DEFAULT_CLIENT_SETTING: SiteSetting = {
  id: "main",
  fullName: "ابوالفضل دهنوی",
  displayTitle: "شهید ابوالفضل دهنوی",
  subtitle: "امدادگر یکم جمعیت هلال احمر",
  birthDate: null,
  martyrdomDate: "۱۵ فروردین ۱۴۰۵",
  martyrdomPlace: "شهرستان مبارکه، اصفهان",
  role: "امدادگر یکم جمعیت هلال احمر",
  heroImage: null,
  heroIntro: null,
  publicUrl: null,
  globalFontKey: "vazirmatn",
  headingFontKey: "nastaliq",
  accent: "emerald",
}
