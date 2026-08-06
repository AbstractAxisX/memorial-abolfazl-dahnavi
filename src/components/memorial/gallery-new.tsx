"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Film, ImageIcon, Loader2 } from "lucide-react"
import type { Section, MediaFile } from "@/lib/store"
import { parseConfig } from "@/lib/store"
import { SectionTitle } from "./ornaments"
import { IosViewer, type GalleryItem } from "./ios-viewer"
import { toPersianDigits } from "./biography-view"

type GalleryItemT = { type: string; url: string; thumb?: string | null; caption?: string | null; description?: string | null }

export function GallerySection({ section, media }: { section: Section; media: MediaFile[] }) {
  const cfg = parseConfig<{ items: GalleryItemT[]; source: string; category: string }>(section, { items: [], source: "manual", category: "" })

  // Build items from media library or manual config
  const items: GalleryItemT[] = useMemo(() => {
    if (cfg.source === "media") {
      let m = media
      if (cfg.category) m = m.filter((x) => (x.category || "عمومی") === cfg.category)
      return m.map((x) => ({
        type: x.type === "video" ? "video" : "photo",
        url: x.url,
        thumb: x.thumb,
        caption: x.title || x.alt,
        description: x.description,
      }))
    }
    return cfg.items || []
  }, [cfg.source, cfg.category, cfg.items, media])

  // Group items by category
  const categories = useMemo(() => {
    const groups: Record<string, GalleryItemT[]> = {}
    items.forEach((item) => {
      // For media source, we need the original category — but items here are already filtered
      // So let's re-derive from media
    })
    // Re-derive categories from media
    if (cfg.source === "media") {
      let m = media
      if (cfg.category) m = m.filter((x) => (x.category || "عمومی") === cfg.category)
      const cats: Record<string, GalleryItemT[]> = {}
      m.forEach((x) => {
        const cat = x.category || "عمومی"
        if (!cats[cat]) cats[cat] = []
        cats[cat].push({
          type: x.type === "video" ? "video" : "photo",
          url: x.url,
          thumb: x.thumb,
          caption: x.title || x.alt,
          description: x.description,
        })
      })
      return cats
    }
    // For manual items, put them all in "عمومی"
    return items.length > 0 ? { "همه": items } : {}
  }, [items, media, cfg.source, cfg.category])

  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // If no categories at all
  if (items.length === 0) {
    return (
      <section className="px-5 py-14">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-4 text-center">
          {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}
          <img src="/decor/dove.png" alt="" className="h-28 w-28 opacity-70" />
          <p className="text-muted-foreground">هنوز فایلی در کتابخانه رسانه نیست. از تب «رسانه» فایل آپلود کنید.</p>
        </div>
      </section>
    )
  }

  const catNames = Object.keys(categories)
  const catItems = openCategory ? categories[openCategory] || [] : []

  // Viewer items
  const viewerItems: GalleryItem[] = catItems.map((it) => ({
    url: it.url,
    type: it.type === "video" ? "video" : "photo",
    caption: it.caption,
    description: it.description,
    thumb: it.thumb,
  }))

  return (
    <section className="px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {section.title && <SectionTitle title={section.title} subtitle={section.subtitle ?? undefined} />}

        {/* Category grid — square cards with cover + name */}
        {!openCategory && (
          <motion.div layout className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {catNames.map((catName) => {
              const catMedia = categories[catName]
              const cover = catMedia[0]
              const photoCount = catMedia.filter((i) => i.type === "photo").length
              const videoCount = catMedia.filter((i) => i.type === "video").length
              return (
                <motion.button
                  key={catName}
                  layoutId={`cat-${catName}`}
                  onClick={() => setOpenCategory(catName)}
                  whileTap={{ scale: 0.96 }}
                  className="group relative overflow-hidden rounded-2xl border border-[oklch(0.76_0.14_80/0.2)] bg-ivory shadow-sm hover:shadow-xl transition-shadow aspect-square"
                >
                  {/* Cover image */}
                  {cover && (
                    <img
                      src={cover.thumb || cover.url}
                      alt={catName}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Category name + count */}
                  <div className="absolute bottom-0 inset-x-0 p-3 text-right">
                    <h3 className="text-white font-display text-base sm:text-lg text-balance">{catName}</h3>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      {photoCount > 0 && (
                        <span className="flex items-center gap-1 text-white/80 text-[10px]">
                          <ImageIcon className="h-3 w-3" /> {toPersianDigits(photoCount)}
                        </span>
                      )}
                      {videoCount > 0 && (
                        <span className="flex items-center gap-1 text-white/80 text-[10px]">
                          <Film className="h-3 w-3" /> {toPersianDigits(videoCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {/* Expanded category view — iOS Hero animation */}
        <AnimatePresence mode="wait">
          {openCategory && (
            <CategoryExpanded
              key={openCategory}
              categoryName={openCategory}
              items={catItems}
              onBack={() => setOpenCategory(null)}
              onOpenItem={(i) => setViewerIndex(i)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Item viewer — blurred bg, natural size */}
      <AnimatePresence>
        {viewerIndex !== null && viewerItems.length > 0 && (
          <IosViewer
            items={viewerItems}
            startIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

// ===== Expanded category — fullscreen grid with iOS animation =====
function CategoryExpanded({
  categoryName,
  items,
  onBack,
  onOpenItem,
}: {
  categoryName: string
  items: GalleryItemT[]
  onBack: () => void
  onOpenItem: (i: number) => void
}) {
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all")

  const filtered = useMemo(() => {
    if (filter === "all") return items
    return items.filter((i) => i.type === filter)
  }, [items, filter])

  return (
    <motion.div
      layoutId={`cat-${categoryName}`}
      initial={{ borderRadius: 16 }}
      animate={{ borderRadius: 0 }}
      exit={{ borderRadius: 16 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 backdrop-blur-lg border-b border-[oklch(0.76_0.14_80/0.12)] px-4 py-3"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[oklch(0.39_0.085_168)] text-sm font-medium hover:opacity-70 transition"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
          بازگشت
        </button>
        <h2 className="font-display text-lg emerald-text flex-1 text-center">{categoryName}</h2>
        <div className="flex gap-1">
          {(["all", "photo", "video"] as const).map((f) => {
            const n = f === "all" ? items.length : items.filter((i) => i.type === f).length
            if (n === 0 && f !== "all") return null
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${filter === f ? "bg-[oklch(0.39_0.085_168)] text-ivory" : "border border-[oklch(0.76_0.14_80/0.3)] text-[oklch(0.39_0.085_168)]"}`}
              >
                {f === "all" ? "همه" : f === "photo" ? "عکس" : "ویدیو"}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Grid of items */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 p-4"
      >
        {filtered.map((item, i) => {
          const realIndex = items.indexOf(item)
          return (
            <LazyItem
              key={item.url + i}
              item={item}
              onClick={() => onOpenItem(realIndex)}
            />
          )
        })}
      </motion.div>
    </motion.div>
  )
}

// ===== Lazy-loaded item with IntersectionObserver =====
function LazyItem({ item, onClick }: { item: GalleryItemT; onClick: () => void }) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="group relative overflow-hidden rounded-xl border border-[oklch(0.76_0.14_80/0.15)] bg-ivory shadow-sm hover:shadow-md transition-shadow aspect-square"
    >
      {/* Placeholder while not in view */}
      {!inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.95_0.018_82)]">
          <Loader2 className="h-5 w-5 animate-spin text-[oklch(0.76_0.14_80/0.4)]" />
        </div>
      )}
      {inView && (
        <>
          {item.type === "video" ? (
            <video
              src={item.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <img
              src={item.thumb || item.url}
              alt={item.caption ?? ""}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"} group-hover:scale-105`}
            />
          )}
          {/* Video badge */}
          {item.type === "video" && (
            <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur">
              <Film className="h-3 w-3 text-white" />
            </div>
          )}
          {/* Caption — 3 dots if too long */}
          {item.caption && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-[10px] leading-tight line-clamp-2">{item.caption}</p>
            </div>
          )}
        </>
      )}
    </motion.button>
  )
}
