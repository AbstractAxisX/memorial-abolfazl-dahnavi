"use client"

import { motion } from "framer-motion"
import { Lock, Heart } from "lucide-react"

export function MemorialFooter({
  onAdminClick,
  setting,
}: {
  onAdminClick: () => void
  setting: { martyrdomDate: string } | null
}) {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[oklch(0.74_0.135_82/0.18)] bg-gradient-to-b from-transparent to-[oklch(0.95_0.018_82/0.5)]">
      <div className="pointer-events-none absolute inset-0 pattern-overlay opacity-50" />
      <div className="relative mx-auto max-w-3xl px-5 py-10 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center"
        >
          {/* candle ornament */}
          <img
            src="/decor/candle.png"
            alt=""
            className="mb-4 h-16 w-16 rounded-full object-cover opacity-90 shadow-lg shadow-[oklch(0.74_0.135_82/0.2)]"
          />
          <p className="font-display text-xl sm:text-2xl gold-text mb-1">
            روحش شاد و راهش پر رهرو باد
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            یادبود دیجیتال شهید ابوالفضل دهنوی — امدادگر یکم جمعیت هلال احمر
          </p>
          {setting?.martyrdomDate && (
            <p className="mt-1 text-xs text-muted-foreground/70">
              شهادت: {setting.martyrdomDate}
            </p>
          )}

          <div className="mt-6 h-px w-40 gold-divider" />

          <div className="mt-5 flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <Heart className="h-3 w-3" /> ساخته شده با عشق برای جاودانگی نام
            </span>
            <button
              onClick={onAdminClick}
              className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.74_0.135_82/0.2)] px-2.5 py-1 text-[11px] text-muted-foreground/70 transition-all hover:border-[oklch(0.74_0.135_82/0.5)] hover:text-[oklch(0.36_0.07_168)]"
              aria-label="ورود به پنل مدیریت"
              title="پنل مدیریت"
            >
              <Lock className="h-3 w-3" />
              مدیریت
            </button>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
