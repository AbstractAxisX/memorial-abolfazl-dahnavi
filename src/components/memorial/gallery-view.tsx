"use client"

import { useState, useMemo } from "react"
import { Images, Film, Play } from "lucide-react"
import type { GalleryItem } from "@/lib/store"
import { SectionTitle } from "./ornaments"
import { Lightbox } from "./lightbox"
import { toPersianDigits } from "./biography-view"

export function GalleryView({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = useMemo(
    () =>
      filter === "all" ? items : items.filter((i) => i.type === filter),
    [items, filter]
  )

  const photos = items.filter((i) => i.type === "photo")
  const videos = items.filter((i) => i.type === "video")

  return (
    <section className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionTitle title="گالری یادبود" subtitle="تصاویر و لحظات ماندگار" />

        {/* filters */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <FilterBtn
            active={filter === "all"}
            onClick={() => setFilter("all")}
            icon={<Images className="h-4 w-4" />}
            label={`همه (${toPersianDigits(items.length)})`}
          />
          <FilterBtn
            active={filter === "photo"}
            onClick={() => setFilter("photo")}
            icon={<Images className="h-4 w-4" />}
            label={`عکس‌ها (${toPersianDigits(photos.length)})`}
          />
          <FilterBtn
            active={filter === "video"}
            onClick={() => setFilter("video")}
            icon={<Film className="h-4 w-4" />}
            label={`ویدیوها (${toPersianDigits(videos.length)})`}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <img src="/decor/dove.png" alt="" className="h-28 w-28 opacity-70" />
            <p className="text-muted-foreground">
              هنوز موردی در این بخش ثبت نشده است.
            </p>
            <p className="text-xs text-muted-foreground/70">
              می‌توانید از پنل مدیریت تصاویر و ویدیوها را اضافه کنید.
            </p>
          </div>
        ) : (
          <div
            className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
          >
            {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxIndex(i)}
                  className={`group relative overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory shadow-sm hover:shadow-xl transition-shadow ${
                    i % 5 === 0 ? "col-span-2 row-span-1" : ""
                  }`}
                >
                  <div className="aspect-square overflow-hidden">
                    {item.type === "video" ? (
                      <>
                        <video
                          src={item.url}
                          poster={item.thumb || undefined}
                          muted
                          playsInline
                          preload="none"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.12_0.02_165/0.35)] group-hover:bg-[oklch(0.12_0.02_165/0.2)] transition">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-[oklch(0.36_0.07_168)] shadow-lg">
                            <Play className="h-5 w-5 mr-0.5" fill="currentColor" />
                          </span>
                        </div>
                      </>
                    ) : (
                      <img
                        src={item.thumb || item.url}
                        alt={item.caption ?? ""}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.36_0.07_168/0.6)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.caption && (
                    <div className="pointer-events-none absolute bottom-0 inset-x-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <p className="text-xs text-white/90 line-clamp-2 text-balance">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>

      <Lightbox
        items={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  )
}

function FilterBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
        active
          ? "bg-[oklch(0.36_0.07_168)] text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.3)]"
          : "border border-[oklch(0.74_0.135_82/0.3)] bg-ivory text-[oklch(0.36_0.07_168)] hover:bg-[oklch(0.95_0.018_82)]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
