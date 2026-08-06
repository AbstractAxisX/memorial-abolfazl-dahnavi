"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Film, ImageIcon } from "lucide-react"
import type { Section, MediaFile } from "@/lib/store"
import { parseConfig } from "@/lib/store"
import { SectionTitle } from "./ornaments"
import { ImageViewer, type GalleryItem } from "./image-viewer"
import { toPersianDigits } from "./biography-view"

type ItemT = { type: string; url: string; thumb?: string | null; caption?: string | null; description?: string | null; category?: string }

export function GallerySection({ section, media }: { section: Section; media: MediaFile[] }) {
  const cfg = parseConfig<{ items: ItemT[]; source: string; category: string }>(section, { items: [], source: "manual", category: "" })

  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Build items from media library or manual
  const allItems: ItemT[] = useMemo(() => {
    if (cfg.source === "media") {
      let m = media
      if (cfg.category) m = m.filter((x) => (x.category || "عمومی") === cfg.category)
      return m.map((x) => ({
        type: x.type === "video" ? "video" : "photo",
        url: x.url,
        thumb: x.thumb,
        caption: x.title || x.alt,
        description: x.description,
        category: x.category || "عمومی",
      }))
    }
    return (cfg.items || []).map((i) => ({ ...i, category: "همه" }))
  }, [cfg.source, cfg.category, cfg.items, media])

  // Group by category
  const categories = useMemo(() => {
    const groups: Record<string, ItemT[]> = {}
    allItems.forEach((item) => {
      const cat = item.category || "عمومی"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return groups
  }, [allItems])

  // Empty state
  if (allItems.length === 0) {
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

        {/* === CATEGORY GRID — only on gallery page === */}
        <AnimatePresence mode="wait">
          {!openCategory && (
            <motion.div
              key="cat-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
            >
              {catNames.map((catName) => {
                const catMedia = categories[catName]
                const cover = catMedia[0]
                const photoCount = catMedia.filter((i) => i.type === "photo").length
                const videoCount = catMedia.filter((i) => i.type === "video").length
                return (
                  <button
                    key={catName}
                    onClick={() => setOpenCategory(catName)}
                    className="group relative overflow-hidden rounded-2xl border border-[oklch(0.76_0.14_80/0.2)] bg-ivory shadow-sm hover:shadow-lg transition-shadow aspect-square"
                  >
                    {cover && (
                      <img
                        src={cover.thumb || cover.url}
                        alt={catName}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* === EXPANDED CATEGORY — normal page, scrolls naturally === */}
          {openCategory && (
            <CategoryView
              key={openCategory}
              categoryName={openCategory}
              items={catItems}
              onBack={() => setOpenCategory(null)}
              onOpenItem={(i) => setViewerIndex(i)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* === IMAGE VIEWER === */}
      <AnimatePresence>
        {viewerIndex !== null && viewerItems.length > 0 && (
          <ImageViewer
            items={viewerItems}
            startIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

// ===== Category expanded view — normal page that scrolls =====
function CategoryView({
  categoryName,
  items,
  onBack,
  onOpenItem,
}: {
  categoryName: string
  items: ItemT[]
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-10"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-[oklch(0.39_0.085_168)] text-sm font-medium hover:opacity-70 transition">
          <ChevronLeft className="h-5 w-5 rotate-180" />
          بازگشت
        </button>
        <h2 className="font-display text-xl sm:text-2xl emerald-text flex-1 text-center">{categoryName}</h2>
        {/* Filter */}
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
      </div>

      {/* Grid — normal flow, page scrolls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
        {filtered.map((item, i) => {
          const realIndex = items.indexOf(item)
          return <LazyItem key={item.url + i} item={item} onClick={() => onOpenItem(realIndex)} />
        })}
      </div>
    </motion.div>
  )
}

// ===== Lazy item with IntersectionObserver =====
function LazyItem({ item, onClick }: { item: ItemT; onClick: () => void }) {
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
    <button
      ref={ref}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-[oklch(0.76_0.14_80/0.15)] bg-ivory shadow-sm hover:shadow-md transition-shadow aspect-square"
    >
      {!inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.95_0.018_82)]">
          <div className="h-5 w-5 rounded-full border-2 border-[oklch(0.76_0.14_80/0.2)] border-t-[oklch(0.76_0.14_80)] animate-spin" />
        </div>
      )}
      {inView && (
        <>
          {item.type === "video" ? (
            <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <img
              src={item.thumb || item.url}
              alt={item.caption ?? ""}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"} group-hover:scale-105`}
            />
          )}
          {item.type === "video" && (
            <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
              <Film className="h-3 w-3 text-white" />
            </div>
          )}
          {item.caption && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-[10px] leading-tight line-clamp-2">{item.caption}</p>
            </div>
          )}
        </>
      )}
    </button>
  )
}
