"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMemorial } from "@/lib/store"
import { MemorialHeader, MobileTabBar, type ViewKey } from "./nav"
import { MemorialFooter } from "./footer"
import { HeroView } from "./hero-view"
import { BiographyView } from "./biography-view"
import { GalleryView } from "./gallery-view"
import { TimelineView } from "./timeline-view"
import { MemoriesView } from "./memories-view"
import { AdminPanel } from "./admin/admin-panel"

export function MemorialApp() {
  const { data, loading, error, load } = useMemorial()
  const [view, setView] = useState<ViewKey>("home")
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  // Check URL hash for admin access on mount
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#admin" || window.location.search.includes("admin=1")) {
        setAdminOpen(true)
      }
    }
    check()
    window.addEventListener("hashchange", check)
    return () => window.removeEventListener("hashchange", check)
  }, [])

  const navigate = (v: ViewKey) => {
    setView(v)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.74_0.135_82/0.2)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[oklch(0.74_0.135_82)] animate-spin" />
          </div>
          <p className="font-display text-lg gold-text">در حال بارگذاری یادبود...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-xl text-muted-foreground mb-3">
            مشکلی پیش آمد
          </p>
          <button
            onClick={() => load()}
            className="rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm text-ivory"
          >
            تلاش دوباره
          </button>
        </div>
      </div>
    )
  }

  const setting = data.setting

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <MemorialHeader
        name={setting?.fullName || "ابوالفضل دهنوی"}
        current={view}
        onNavigate={navigate}
      />

      <main className="flex-1 pb-24 sm:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === "home" && (
              <HeroView setting={setting!} onNavigate={(v) => navigate(v as ViewKey)} />
            )}
            {view === "bio" && <BiographyView sections={data.bioSections} />}
            {view === "gallery" && <GalleryView items={data.gallery} />}
            {view === "timeline" && <TimelineView events={data.timeline} />}
            {view === "memories" && (
              <MemoriesView
                quotes={data.quotes}
                messages={data.messages}
                onMessageAdded={load}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <MemorialFooter onAdminClick={() => setAdminOpen(true)} setting={setting} />
      <MobileTabBar current={view} onNavigate={navigate} />

      <AnimatePresence>
        {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} onChanged={load} />}
      </AnimatePresence>
    </div>
  )
}
