"use client"

import { create } from "zustand"
import type {
  SiteData,
  SiteSetting,
  Section,
  Page,
  MediaFile,
  BlogPost,
  GuestMessage,
  FontFile,
} from "./types"

export type { SiteData, SiteSetting, Section, Page, MediaFile, BlogPost, GuestMessage, FontFile }

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

// Hydrate the store with server-rendered data (no loading flash, full SEO HTML).
// - Server: always overwrite (per-request freshness)
// - Client: only when empty (preserves refreshes from load())
export function hydrateStore(initialData: SiteData) {
  if (typeof window === "undefined") {
    useMemorial.setState({ data: initialData, loading: false, error: null })
  } else if (!useMemorial.getState().data) {
    useMemorial.setState({ data: initialData, loading: false, error: null })
  }
}

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
