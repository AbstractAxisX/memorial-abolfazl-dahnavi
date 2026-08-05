"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, BookOpen, Images, Clock, Heart } from "lucide-react"

export type ViewKey = "home" | "bio" | "gallery" | "timeline" | "memories"

export const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "home", label: "خانه", icon: Home },
  { key: "bio", label: "زندگی‌نامه", icon: BookOpen },
  { key: "gallery", label: "گالری", icon: Images },
  { key: "timeline", label: "خط زمانی", icon: Clock },
  { key: "memories", label: "یادبودها", icon: Heart },
]

export function MemorialHeader({
  name,
  current,
  onNavigate,
}: {
  name: string
  current: ViewKey
  onNavigate: (v: ViewKey) => void
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(0.985_0.006_85/0.85)] backdrop-blur-lg border-b border-[oklch(0.74_0.135_82/0.15)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={() => onNavigate("home")}
          className="font-display text-lg sm:text-xl emerald-text hover:opacity-80 transition"
        >
          {name}
        </button>
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                current === item.key
                  ? "text-[oklch(0.36_0.07_168)]"
                  : "text-muted-foreground hover:text-[oklch(0.36_0.07_168)]"
              }`}
            >
              {current === item.key && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-[oklch(0.92_0.035_82)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </motion.header>
  )
}

export function MobileTabBar({
  current,
  onNavigate,
}: {
  current: ViewKey
  onNavigate: (v: ViewKey) => void
}) {
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-2 mb-2 rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] bg-[oklch(0.985_0.006_85/0.92)] backdrop-blur-lg shadow-[0_-4px_24px_-6px_oklch(0.36_0.07_168/0.2)]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = current === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition"
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="tab-active"
                      className="absolute inset-0 -z-10 rounded-xl bg-[oklch(0.92_0.035_82)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    active ? "font-medium text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
