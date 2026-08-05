"use client"

import { motion } from "framer-motion"
import { ChevronLeft, MapPin, CalendarDays, Heart } from "lucide-react"
import type { SiteSetting } from "@/lib/store"
import { DecorativeBg } from "./decorative-bg"

export function HeroView({
  setting,
  onNavigate,
}: {
  setting: SiteSetting
  onNavigate: (view: string) => void
}) {
  const hasImage = !!setting.heroImage

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-5 py-24">
      <DecorativeBg variant="hero" />

      {/* Portrait */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative z-10 mb-8"
      >
        {/* rotating gold ring */}
        <div className="absolute inset-0 -m-3 rounded-full animate-ray-rotate opacity-60">
          <div className="w-full h-full rounded-full border-2 border-dashed border-[oklch(0.74_0.135_82/0.5)]" />
        </div>
        <div className="absolute inset-0 -m-1 rounded-full bg-[conic-gradient(from_0deg,oklch(0.74_0.135_82),oklch(0.55_0.13_70),oklch(0.82_0.1_90),oklch(0.74_0.135_82))] opacity-70 blur-[2px]" />

        <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 border-white/70 shadow-[0_10px_40px_-8px_oklch(0.36_0.07_168/0.4)] bg-ivory">
          {hasImage ? (
            <img
              src={setting.heroImage!}
              alt={setting.displayTitle}
              className="h-full w-full object-cover animate-ken-burns"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[oklch(0.95_0.02_85)] to-[oklch(0.88_0.03_85)]">
              <img
                src="/decor/crescent.png"
                alt="نماد هلال احمر"
                className="h-20 w-20 object-contain opacity-90"
              />
            </div>
          )}
        </div>

        {/* small candle glow below */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-12 rounded-full bg-[radial-gradient(circle,oklch(0.74_0.135_82/0.45),transparent_70%)] blur-md animate-glow-pulse"
        />
      </motion.div>

      {/* Role badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.35)] bg-[oklch(0.995_0.004_85/0.8)] px-4 py-1.5 backdrop-blur"
      >
        <Heart className="h-3.5 w-3.5 text-[oklch(0.52_0.18_25)]" fill="oklch(0.52 0.18 25)" />
        <span className="text-xs sm:text-sm font-medium text-[oklch(0.36_0.07_168)]">
          {setting.role || setting.subtitle}
        </span>
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 font-display text-5xl sm:text-6xl md:text-7xl gold-text text-center leading-[1.5] text-balance px-2"
      >
        {setting.displayTitle}
      </motion.h1>

      {/* Dates */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.7 }}
        className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:text-base text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-[oklch(0.74_0.135_82)]" />
          {setting.martyrdomDate}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[oklch(0.74_0.135_82)]" />
          {setting.martyrdomPlace}
        </span>
      </motion.div>

      {/* Intro */}
      {setting.heroIntro && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.8 }}
          className="relative z-10 mt-7 max-w-md sm:max-w-xl text-center text-foreground/80 leading-8 text-balance text-[15px] sm:text-base"
        >
          {setting.heroIntro}
        </motion.p>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.7 }}
        className="relative z-10 mt-9 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={() => onNavigate("bio")}
          className="group inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-6 py-3 text-sm font-medium text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.3)] transition-all hover:bg-[oklch(0.3_0.07_170)] hover:shadow-xl active:scale-95"
        >
          زندگی‌نامه
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </button>
        <button
          onClick={() => onNavigate("gallery")}
          className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.4)] bg-[oklch(0.995_0.004_85/0.6)] px-6 py-3 text-sm font-medium text-[oklch(0.36_0.07_168)] backdrop-blur transition-all hover:bg-[oklch(0.92_0.035_82)] active:scale-95"
        >
          گالری یادبود
        </button>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1 text-[oklch(0.36_0.07_168/0.5)]"
        >
          <span className="text-[10px] tracking-widest">برای ادامه</span>
          <div className="h-8 w-5 rounded-full border-2 border-current flex justify-center pt-1">
            <motion.span
              animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-current"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
