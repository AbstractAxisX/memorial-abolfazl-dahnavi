"use client"

import { create } from "zustand"

export type SiteSetting = {
  id: string
  fullName: string
  displayTitle: string
  subtitle: string
  birthDate: string | null
  martyrdomDate: string
  martyrdomPlace: string
  role: string
  heroImage: string | null
  heroIntro: string | null
  publicUrl: string | null
  adminPassword: string
  globalFontKey: string
  headingFontKey: string
  accent: string
}

export type Section = {
  id: string
  pageId: string
  type: string
  title: string | null
  subtitle: string | null
  config: string // JSON
  fontKey: string | null
  background: string
  order: number
  visible: boolean
}

export type Page = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  showInNav: boolean
  navIcon: string
  isHome: boolean
  order: number
  sections: Section[]
}

export type MediaFile = {
  id: string
  url: string
  type: string
  thumb: string | null
  title: string | null
  description: string | null
  alt: string | null
  category: string
  width: number | null
  height: number | null
  size: number | null
  createdAt: string
}

export type BlogPost = {
  id: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  videoUrl: string | null
  publishedAt: string | null
  featured: boolean
  tags: string | null
  order: number
  createdAt: string
}

export type GuestMessage = {
  id: string
  name: string
  text: string
  approved: boolean
  createdAt: string
}

export type FontFile = {
  id: string
  name: string
  label: string
  url: string
  createdAt: string
}

export type SiteData = {
  setting: SiteSetting | null
  pages: Page[]
  blogPosts: BlogPost[]
  messages: GuestMessage[]
  fonts: FontFile[]
  media: MediaFile[]
}

type State = {
  data: SiteData | null
  loading: boolean
  error: string | null
  load: () => Promise<void>
}

export const useMemorial = create<State>((set) => ({
  data: null,
  loading: true,
  error: null,
  load: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/content", { cache: "no-store" })
      if (!res.ok) throw new Error("بارگذاری ناموفق")
      const data = (await res.json()) as SiteData
      set({ data, loading: false })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },
}))

// Helper to parse section config JSON safely
export function parseConfig<T = Record<string, unknown>>(section: Section, fallback: T): T {
  try {
    return JSON.parse(section.config) as T
  } catch {
    return fallback
  }
}

// Admin auth store
type AuthState = {
  isAdmin: boolean
  checking: boolean
  loginAttemping: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
  check: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  isAdmin: false,
  checking: true,
  loginAttemping: false,
  login: async (password) => {
    set({ loginAttemping: true })
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        set({ isAdmin: true, loginAttemping: false })
        return true
      }
      set({ loginAttemping: false })
      return false
    } catch {
      set({ loginAttemping: false })
      return false
    }
  },
  logout: async () => {
    await fetch("/api/auth", { method: "DELETE" })
    set({ isAdmin: false })
  },
  check: async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" })
      const data = await res.json()
      set({ isAdmin: !!data?.isAdmin })
    } catch {
      set({ isAdmin: false })
    } finally {
      set({ checking: false })
    }
  },
}))
