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
}

export type BioSection = {
  id: string
  title: string
  content: string
  image: string | null
  order: number
}

export type GalleryItem = {
  id: string
  type: string
  url: string
  thumb: string | null
  caption: string | null
  order: number
}

export type TimelineEvent = {
  id: string
  date: string
  title: string
  description: string | null
  icon: string
  order: number
}

export type Quote = {
  id: string
  text: string
  author: string | null
  order: number
}

export type GuestMessage = {
  id: string
  name: string
  text: string
  approved: boolean
  createdAt: string
}

export type MemorialData = {
  setting: SiteSetting | null
  bioSections: BioSection[]
  gallery: GalleryItem[]
  timeline: TimelineEvent[]
  quotes: Quote[]
  messages: GuestMessage[]
}

type State = {
  data: MemorialData | null
  loading: boolean
  error: string | null
  load: () => Promise<void>
}

export const useMemorial = create<State>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  load: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/content", { cache: "no-store" })
      if (!res.ok) throw new Error("بارگذاری ناموفق")
      const data = (await res.json()) as MemorialData
      set({ data, loading: false })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },
}))

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
