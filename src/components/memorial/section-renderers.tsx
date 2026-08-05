"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart, CalendarDays, MapPin, ChevronLeft, ChevronRight, Quote as QuoteIcon,
  Play, Send, MessageSquareHeart, type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Section, SiteSetting, BlogPost, GuestMessage } from "@/lib/store"
import { parseConfig } from "@/lib/store"
import { getIcon, IconEl } from "@/lib/icon-registry"
import { fontFamilyFor } from "@/lib/fonts"
import { OrnamentDivider, SectionTitle } from "./ornaments"
import { DecorativeBg } from "./decorative-bg"
import { VideoPlayer } from "./video-player"
import { toPersianDigits } from "./biography-view"
import { Lightbox } from "./lightbox"

export function sectionBackgroundClass(bg: string): string {
  switch (bg) {
    case "parchment": return "parchment"
    case "emerald": return "bg-[oklch(0.36_0.07_168/0.04)]"
    case "gold": return "bg-[oklch(0.92_0.035_82/0.3)]"
    default: return ""
  }
}

function Icon({ name }: { name: string }) {
  return <IconEl name={name} className="h-5 w-5" />
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "هم‌اکنون"
  if (m < 60) return `${toPersianDigits(m)} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${toPersianDigits(h)} ساعت پیش`
  const d = Math.floor(h / 24)
  if (d < 30) return `${toPersianDigits(d)} روز پیش`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${toPersianDigits(mo)} ماه پیش`
  return `${toPersianDigits(Math.floor(mo / 12))} سال پیش`
}

function Paragraphs({ text }: { text: string }) {
  const paras = text.split("\n").map((p) => p.trim()).filter(Boolean)
  return (
    <div className="space-y-4">
      {paras.map((p, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="leading-9 text-[15px] sm:text-base text-foreground/85 text-justify"
        >
          {p}
        </motion.p>
      ))}
    </div>
  )
}

// ============ HERO ============
function HeroSection({ section, setting, onNavigate }: { section: Section; setting: SiteSetting; onNavigate: (slug: string) => void }) {
  const cfg = parseConfig<{ ctaButtons?: { label: string; pageSlug: string }[] }>(section, {})
  const hasImage = !!setting.heroImage
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-x-hidden px-5 py-16">
      <DecorativeBg variant="hero" />

      {/* Portrait — larger, with layered glow rings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative z-10 mb-6"
      >
        {/* outer rotating gradient ring */}
        <div className="absolute inset-0 -m-4 rounded-full animate-ray-rotate opacity-80">
          <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,oklch(0.74_0.135_82),oklch(0.55_0.13_70),oklch(0.82_0.1_90),oklch(0.36_0.07_168),oklch(0.74_0.135_82))]" />
        </div>
        {/* dashed orbit */}
        <div className="absolute inset-0 -m-6 rounded-full animate-ray-rotate opacity-40" style={{ animationDirection: "reverse", animationDuration: "40s" }}>
          <div className="w-full h-full rounded-full border border-dashed border-[oklch(0.74_0.135_82/0.6)]" />
        </div>
        {/* soft glow */}
        <div className="absolute inset-0 -m-2 rounded-full bg-[oklch(0.74_0.135_82/0.3)] blur-2xl animate-glow-pulse" />
        {/* portrait */}
        <div className="relative h-60 w-60 sm:h-72 sm:w-72 rounded-full overflow-hidden border-4 border-white shadow-[0_20px_60px_-12px_oklch(0.36_0.07_168/0.6)] bg-ivory">
          {hasImage ? (
            <img src={setting.heroImage!} alt={setting.displayTitle} className="h-full w-full object-cover animate-ken-burns" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[oklch(0.95_0.02_85)] to-[oklch(0.85_0.04_85)]">
              <img src="/decor/crescent.png" alt="نماد هلال احمر" className="h-28 w-28 object-contain opacity-90" />
              <span className="mt-3 text-[10px] text-muted-foreground">عکس را از پنل اضافه کنید</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Role badge — refined pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-10 mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[oklch(0.92_0.035_82/0.9)] to-[oklch(0.36_0.07_168/0.08)] border border-[oklch(0.74_0.135_82/0.4)] px-4 py-1.5 backdrop-blur"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.52_0.18_25)] opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.52_0.18_25)]" />
        </span>
        <span className="text-xs sm:text-sm font-medium text-[oklch(0.36_0.07_168)]">{setting.role || setting.subtitle}</span>
      </motion.div>

      {/* Name — the centerpiece */}
      <motion.h1
        initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.8, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 font-display text-5xl sm:text-6xl md:text-7xl gold-text text-center leading-[2.2] pb-2 text-balance px-2"
      >
        {setting.displayTitle}
      </motion.h1>

      {/* Dates — with decorative dividers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.995_0.004_85/0.7)] border border-[oklch(0.74_0.135_82/0.2)] px-3 py-1 backdrop-blur">
          <CalendarDays className="h-3.5 w-3.5 text-[oklch(0.36_0.07_168)]" />
          <span className="text-foreground/80">{setting.martyrdomDate}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.995_0.004_85/0.7)] border border-[oklch(0.74_0.135_82/0.2)] px-3 py-1 backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-[oklch(0.36_0.07_168)]" />
          <span className="text-foreground/80">{setting.martyrdomPlace}</span>
        </span>
      </motion.div>

      {setting.heroIntro && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="relative z-10 mt-6 max-w-md sm:max-w-xl text-center text-foreground/75 leading-8 text-balance text-[14px] sm:text-[15px]"
        >
          {setting.heroIntro}
        </motion.p>
      )}

      {cfg.ctaButtons && cfg.ctaButtons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.7 }}
          className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          {cfg.ctaButtons.map((b, i) => (
            <button
              key={i}
              onClick={() => onNavigate(b.pageSlug)}
              className={i === 0
                ? "group inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[oklch(0.3_0.07_170)] to-[oklch(0.36_0.07_168)] px-7 py-3 text-sm font-medium text-ivory shadow-[0_10px_30px_-6px_oklch(0.36_0.07_168/0.5)] transition-all hover:shadow-[0_14px_40px_-6px_oklch(0.36_0.07_168/0.6)] hover:-translate-y-0.5 active:scale-95"
                : "inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.45)] bg-[oklch(0.995_0.004_85/0.7)] px-6 py-3 text-sm font-medium text-[oklch(0.36_0.07_168)] backdrop-blur transition-all hover:bg-[oklch(0.92_0.035_82)] hover:-translate-y-0.5 active:scale-95"}
            >
              {b.label}
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          ))}
        </motion.div>
      )}
    </section>
  )
}

// ============ TEXT ============
function TextSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ content: string; image: string | null; layout: string }>(section, { content: "", image: null, layout: "full" })
  const flip = cfg.layout === "half-left"
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        {cfg.image ? (
          <div className={`mt-10 flex flex-col ${flip ? "sm:flex-row-reverse" : "sm:flex-row"} gap-6 sm:gap-8 items-start`}>
            <div className="w-full sm:w-2/5">
              <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-lg shadow-[oklch(0.36_0.07_168/0.12)]">
                <img src={cfg.image} alt={section.title ?? ""} className="w-full h-56 sm:h-72 object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.36_0.07_168/0.15)] to-transparent" />
              </div>
            </div>
            <div className="flex-1">{section.title ? null : <h3 className="font-display text-2xl sm:text-3xl emerald-text mb-4">{section.title}</h3>}<Paragraphs text={cfg.content} /></div>
          </div>
        ) : (
          <div className="mt-8 parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] p-6 sm:p-8 shadow-sm">
            {!section.title && <QuoteIcon className="h-6 w-6 text-[oklch(0.74_0.135_82/0.5)] mb-3" />}
            <Paragraphs text={cfg.content} />
          </div>
        )}
      </div>
    </section>
  )
}

// ============ IMAGE ============
function ImageSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ url: string | null; caption: string; alt: string; size: string; align: string; description?: string }>(section, { url: null, caption: "", alt: "", size: "md", align: "center" })
  if (!cfg.url) {
    return (
      <section className="px-5 py-14">
        <div className="mx-auto max-w-3xl text-center text-muted-foreground">تصویری ثبت نشده است.</div>
      </section>
    )
  }
  const sizeW = { sm: "max-w-xs", md: "max-w-md", lg: "max-w-2xl", full: "max-w-4xl" }[cfg.size] || "max-w-md"
  const align = { center: "mx-auto", left: "mr-auto", right: "ml-auto" }[cfg.align] || "mx-auto"
  return (
    <section className="px-5 py-14 sm:py-20">
      <motion.figure
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className={`${sizeW} ${align}`}
      >
        <div className="overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-lg shadow-[oklch(0.36_0.07_168/0.12)]">
          <img src={cfg.url} alt={cfg.alt || cfg.caption || section.title || ""} className="w-full object-cover transition-transform duration-700 hover:scale-105" />
        </div>
        {(cfg.caption || cfg.description) && (
          <figcaption className="mt-3 text-center">
            {cfg.caption && <p className="text-sm font-medium text-[oklch(0.36_0.07_168)]">{cfg.caption}</p>}
            {cfg.description && <p className="mt-1 text-xs text-muted-foreground leading-6">{cfg.description}</p>}
          </figcaption>
        )}
      </motion.figure>
    </section>
  )
}

// ============ GALLERY ============
type GalleryItemT = { type: string; url: string; thumb?: string | null; caption?: string | null; description?: string | null }
function GallerySection({ section }: { section: Section }) {
  const cfg = parseConfig<{ items: GalleryItemT[]; filterable: boolean; columns: number }>(section, { items: [], filterable: true, columns: 3 })
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all")
  const [lbIndex, setLbIndex] = useState<number | null>(null)
  const filtered = useMemo(() => (filter === "all" ? cfg.items : cfg.items.filter((i) => i.type === filter)), [cfg.items, filter])
  const cols = `grid-cols-${cfg.columns}`

  if (cfg.items.length === 0) {
    return (
      <section className="px-5 py-14">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-4 text-center">
          {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
          <img src="/decor/dove.png" alt="" className="h-28 w-28 opacity-70" />
          <p className="text-muted-foreground">هنوز موردی ثبت نشده است. از پنل مدیریت تصاویر/ویدیوها را اضافه کنید.</p>
        </div>
      </section>
    )
  }
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        {cfg.filterable && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {(["all", "photo", "video"] as const).map((f) => {
              const n = f === "all" ? cfg.items.length : cfg.items.filter((i) => i.type === f).length
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition active:scale-95 ${filter === f ? "bg-[oklch(0.36_0.07_168)] text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.3)]" : "border border-[oklch(0.74_0.135_82/0.3)] bg-ivory text-[oklch(0.36_0.07_168)] hover:bg-[oklch(0.95_0.018_82)]"}`}>
                  {f === "all" ? "همه" : f === "photo" ? "عکس‌ها" : "ویدیوها"} ({toPersianDigits(n)})
                </button>
              )
            })}
          </div>
        )}
        <motion.div layout className={`mt-10 grid ${cols} gap-3 sm:gap-4`}>
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.button
                key={item.url + i}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                onClick={() => setLbIndex(i)}
                className="group relative overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory shadow-sm hover:shadow-xl transition-shadow aspect-square"
              >
                {item.type === "video" ? (
                  <>
                    <video src={item.url} muted playsInline className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.12_0.02_165/0.35)] group-hover:bg-[oklch(0.12_0.02_165/0.2)] transition">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-[oklch(0.36_0.07_168)] shadow-lg"><Play className="h-5 w-5 mr-0.5" fill="currentColor" /></span>
                    </div>
                  </>
                ) : (
                  <img src={item.thumb || item.url} alt={item.caption ?? ""} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.36_0.07_168/0.6)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                {item.caption && (
                  <div className="pointer-events-none absolute bottom-0 inset-x-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <p className="text-xs text-white/90 line-clamp-2 text-balance">{item.caption}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      <Lightbox items={filtered.map((i) => ({ id: i.url, type: i.type, url: i.url, thumb: i.thumb ?? null, caption: i.caption ?? null, order: 0, createdAt: "", updatedAt: "" }))} index={lbIndex} onClose={() => setLbIndex(null)} onNavigate={setLbIndex} />
    </section>
  )
}

// ============ SLIDER ============
function SliderSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ items: GalleryItemT[]; autoplay: boolean; interval: number; transition: string; arrows: boolean; dots: boolean; height: string }>(section, { items: [], autoplay: false, interval: 4000, transition: "fade", arrows: true, dots: true, height: "lg" })
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)
  const items = cfg.items

  useEffectInterval(() => {
    if (!cfg.autoplay || items.length <= 1) return
    const t = setInterval(() => { setDir(1); setIdx((i) => (i + 1) % items.length) }, cfg.interval)
    return () => clearInterval(t)
  }, [cfg.autoplay, cfg.interval, items.length])

  const go = (delta: number) => {
    setDir(delta)
    setIdx((i) => (i + delta + items.length) % items.length)
  }

  const heights = { sm: "h-60 sm:h-72", md: "h-80 sm:h-96", lg: "h-96 sm:h-[32rem]" }
  const h = heights[cfg.height as keyof typeof heights] || heights.lg

  if (items.length === 0) {
    return (
      <section className="px-5 py-14 text-center text-muted-foreground">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <p className="mt-8">هنوز اسلایدی ثبت نشده است.</p>
      </section>
    )
  }

  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <div className={`relative mt-8 overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-xl ${h}`}>
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={idx}
              custom={dir}
              initial={cfg.transition === "slide" ? { opacity: 0, x: dir * 80 } : { opacity: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={cfg.transition === "slide" ? { opacity: 0, x: dir * -80 } : { opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {items[idx].type === "video" ? (
                <video src={items[idx].url} className="h-full w-full object-cover" controls muted autoPlay />
              ) : (
                <img src={items[idx].url} alt={items[idx].caption ?? ""} className="h-full w-full object-cover" />
              )}
              {items[idx].caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <p className="text-white/95 text-sm sm:text-base text-balance">{items[idx].caption}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {cfg.arrows && items.length > 1 && (
            <>
              <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[oklch(0.36_0.07_168)] shadow-lg backdrop-blur hover:bg-white transition" aria-label="قبلی">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[oklch(0.36_0.07_168)] shadow-lg backdrop-blur hover:bg-white transition" aria-label="بعدی">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
          {cfg.dots && items.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
              {items.map((_, i) => (
                <button key={i} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i) }} className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-[oklch(0.74_0.135_82)]" : "w-2 bg-white/60"}`} aria-label={`اسلاید ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// helper to avoid importing useEffect at top in a confusing way
import { useEffect } from "react"
function useEffectInterval(fn: () => void | (() => void), deps: unknown[]) {
  useEffect(fn, deps)
}

// ============ VIDEO ============
function VideoSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ url: string | null; poster: string | null; title: string; description: string }>(section, { url: null, poster: null, title: "", description: "" })
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <div className="mt-8">
          {cfg.url ? (
            <VideoPlayer src={cfg.url} poster={cfg.poster ?? null} title={cfg.title || section.title} description={cfg.description} />
          ) : (
            <p className="text-center text-muted-foreground">ویدیویی ثبت نشده است.</p>
          )}
        </div>
      </div>
    </section>
  )
}

// ============ TIMELINE ============
function TimelineSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ events: { date: string; title: string; description: string; icon: string }[] }>(section, { events: [] })
  const events = cfg.events
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <div className="relative mt-14">
          <div className="absolute right-4 sm:right-1/2 sm:translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[oklch(0.74_0.135_82/0.5)] to-transparent" />
          <div className="space-y-10 sm:space-y-2">
            {events.map((e, idx) => {
              const flip = idx % 2 === 1
              return (
                <div key={idx} className="relative sm:grid sm:grid-cols-2 sm:gap-8">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
                    className="absolute right-4 sm:right-1/2 top-1 -translate-x-1/2 sm:translate-x-1/2 z-10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.36_0.07_168)] text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.4)] ring-4 ring-ivory">
                      <Icon name={e.icon} />
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: flip ? 30 : -30, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`pr-14 sm:pr-0 ${flip ? "sm:col-start-1 sm:text-left" : "sm:col-start-2"}`}
                  >
                    <div className="parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-5 shadow-sm hover:shadow-md transition-shadow">
                      <span className="inline-flex items-center rounded-full bg-[oklch(0.92_0.035_82)] px-2.5 py-0.5 text-[11px] font-medium text-[oklch(0.36_0.07_168)]">{e.date}</span>
                      <h3 className="font-display text-xl emerald-text mt-1.5 mb-1.5">{e.title}</h3>
                      {e.description && <p className="text-sm text-foreground/75 leading-7 text-justify">{e.description}</p>}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ QUOTES ============
function QuotesSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ quotes: { text: string; author: string }[] }>(section, { quotes: [] })
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        {cfg.quotes.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {cfg.quotes.map((q, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`relative parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-6 shadow-sm ${i % 3 === 0 ? "sm:col-span-2" : ""}`}
              >
                <QuoteIcon className="h-7 w-7 text-[oklch(0.74_0.135_82/0.6)] mb-3" />
                <blockquote className="font-display text-lg sm:text-xl leading-9 emerald-text text-balance">{q.text}</blockquote>
                {q.author && <figcaption className="mt-3 text-sm text-muted-foreground">— {q.author}</figcaption>}
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ============ GUESTBOOK ============
function GuestbookSection({ messages, onMessageAdded }: { messages: GuestMessage[]; onMessageAdded: () => Promise<void> }) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) { toast.error("نام و متن پیام را وارد کنید"); return }
    setSending(true)
    try {
      const res = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), text: text.trim() }) })
      if (!res.ok) throw new Error("ارسال ناموفق بود")
      toast.success("پیام شما ثبت شد")
      setName(""); setText("")
      await onMessageAdded()
    } catch (err) { toast.error((err as Error).message) }
    finally { setSending(false) }
  }
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="کتاب یادبود" subtitle="اگر خاطره‌ای یا پیامی از قلب دارید، بنویسید" />
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mt-10 parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-5 sm:p-6 shadow-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" maxLength={60} className="w-full rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="پیام یادبود شما..." maxLength={800} rows={4} className="mt-3 w-full resize-none rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-4 py-3 text-sm leading-7 outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{toPersianDigits(text.length)}/۸۰۰</span>
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2.5 text-sm font-medium text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.3)] transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95 disabled:opacity-60">
              <Send className="h-4 w-4" />{sending ? "در حال ارسال..." : "ثبت پیام"}
            </button>
          </div>
        </motion.form>
        <div className="mt-8 space-y-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.04 }} className="relative rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-[oklch(0.995_0.004_85/0.7)] p-4 sm:p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]"><MessageSquareHeart className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-[oklch(0.36_0.07_168)] text-sm">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-7 text-foreground/80 whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                </div>
                <Heart className="absolute -bottom-1 -left-1 h-4 w-4 text-[oklch(0.52_0.18_25/0.4)]" fill="oklch(0.52 0.18 25 / 0.3)" />
              </motion.div>
            ))}
          </AnimatePresence>
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">هنوز پیامی ثبت نشده است.</p>}
        </div>
      </div>
    </section>
  )
}

// ============ BLOG LIST ============
function BlogListSection({ section, blogPosts, onNavigatePost }: { section: Section; blogPosts: BlogPost[]; onNavigatePost: (id: string) => void }) {
  const cfg = parseConfig<{ count: number; showExcerpt: boolean }>(section, { count: 12, showExcerpt: true })
  const posts = blogPosts.slice(0, cfg.count)
  if (posts.length === 0) {
    return (
      <section className="px-5 py-14 text-center">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <p className="mt-8 text-muted-foreground">هنوز نوشته‌ای منتشر نشده است.</p>
      </section>
    )
  }
  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {posts.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              onClick={() => onNavigatePost(p.id)}
              className={`group cursor-pointer overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory shadow-sm hover:shadow-xl transition-shadow ${p.featured ? "sm:col-span-2" : ""}`}
            >
              {p.coverImage && (
                <div className={`overflow-hidden ${p.featured ? "h-56 sm:h-72" : "h-44"}`}>
                  <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {p.featured && <span className="rounded-full bg-[oklch(0.92_0.035_82)] px-2 py-0.5 text-[10px] text-[oklch(0.36_0.07_168)]">ویژه</span>}
                  {p.publishedAt && <span className="text-[11px] text-muted-foreground">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(p.publishedAt))}</span>}
                </div>
                <h3 className="font-display text-lg sm:text-xl emerald-text mb-1.5 group-hover:text-[oklch(0.3_0.07_170)] transition">{p.title}</h3>
                {cfg.showExcerpt && p.excerpt && <p className="text-sm text-foreground/75 leading-7 line-clamp-2">{p.excerpt}</p>}
                {p.tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span key={t} className="rounded-full bg-[oklch(0.95_0.018_82)] px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ CTA ============
function CtaSection({ section, onNavigate }: { section: Section; onNavigate: (slug: string) => void }) {
  const cfg = parseConfig<{ title: string; buttons: { label: string; pageSlug: string; variant: string }[] }>(section, { title: "", buttons: [] })
  return (
    <section className="px-5 py-14 sm:py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mx-auto max-w-2xl parchment rounded-3xl border border-[oklch(0.74_0.135_82/0.25)] p-8 sm:p-10 text-center shadow-lg">
        <h3 className="font-display text-2xl sm:text-3xl emerald-text mb-5 text-balance">{cfg.title || section.title}</h3>
        <OrnamentDivider className="mb-6" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cfg.buttons.map((b, i) => (
            <button key={i} onClick={() => onNavigate(b.pageSlug)} className={b.variant === "primary"
              ? "inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-6 py-3 text-sm font-medium text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.3)] transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95"
              : "inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.4)] px-6 py-3 text-sm font-medium text-[oklch(0.36_0.07_168)] transition hover:bg-[oklch(0.92_0.035_82)] active:scale-95"}>
              {b.label}<ChevronLeft className="h-4 w-4" />
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// ============ DIVIDER ============
function DividerSection({ section }: { section: Section }) {
  const cfg = parseConfig<{ variant: string }>(section, { variant: "ornament" })
  return (
    <section className="py-8">
      {cfg.variant === "ornament" ? <OrnamentDivider /> : <div className="h-px gold-divider" />}
    </section>
  )
}

// ============ MAIN DISPATCHER ============
export function SectionRenderer({
  section,
  setting,
  blogPosts,
  messages,
  onNavigate,
  onNavigatePost,
  onMessageAdded,
}: {
  section: Section
  setting: SiteSetting
  blogPosts: BlogPost[]
  messages: GuestMessage[]
  onNavigate: (slug: string) => void
  onNavigatePost: (id: string) => void
  onMessageAdded: () => Promise<void>
}) {
  const content = (() => {
    switch (section.type) {
      case "hero": return <HeroSection section={section} setting={setting} onNavigate={onNavigate} />
      case "text": return <TextSection section={section} />
      case "image": return <ImageSection section={section} />
      case "gallery": return <GallerySection section={section} />
      case "slider": return <SliderSection section={section} />
      case "video": return <VideoSection section={section} />
      case "timeline": return <TimelineSection section={section} />
      case "quotes": return <QuotesSection section={section} />
      case "guestbook": return <GuestbookSection messages={messages} onMessageAdded={onMessageAdded} />
      case "blogList": return <BlogListSection section={section} blogPosts={blogPosts} onNavigatePost={onNavigatePost} />
      case "cta": return <CtaSection section={section} onNavigate={onNavigate} />
      case "divider": return <DividerSection section={section} />
      default: return <div className="p-8 text-center text-muted-foreground">نوع بخش نامشخص: {section.type}</div>
    }
  })()
  return <div className={sectionBackgroundClass(section.background)}>{content}</div>
}
