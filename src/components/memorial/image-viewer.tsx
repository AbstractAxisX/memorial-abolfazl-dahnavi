"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Download, Play, Pause } from "lucide-react"
import { toPersianDigits } from "./biography-view"

export type GalleryItem = {
  url: string
  type: "photo" | "video"
  caption?: string | null
  description?: string | null
  thumb?: string | null
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${toPersianDigits(m)}:${toPersianDigits(sec).padStart(2, "۰")}`
}

export function ImageViewer({
  items,
  startIndex,
  onClose,
}: {
  items: GalleryItem[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [direction, setDirection] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const item = items[index]

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      setDirection(1)
      setIndex((i) => i + 1)
      setLoaded(false)
      setPlaying(false)
    }
  }, [index, items.length])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setDirection(-1)
      setIndex((i) => i - 1)
      setLoaded(false)
      setPlaying(false)
    }
  }, [index])

  // Lock body scroll while viewer is open — site won't move
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = original }
  }, [])

  // keyboard — only affects modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
      else if (e.key === " " && item.type === "video") {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, goNext, goPrev, index, item.type])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    v.currentTime = frac * duration
  }

  const download = useCallback(async () => {
    try {
      const res = await fetch(item.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = item.url.split("/").pop() || "download"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(item.url, "_blank")
    }
  }, [item])

  // Video events
  useEffect(() => {
    if (item.type !== "video") return
    const v = videoRef.current
    if (!v) return
    const onTime = () => { setCurrent(v.currentTime); if (v.duration) setProgress(v.currentTime / v.duration) }
    const onMeta = () => { setDuration(v.duration || 0) }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("loadedmetadata", onMeta)
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    return () => {
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("loadedmetadata", onMeta)
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
    }
  }, [index, item.type])

  // Drag/swipe — only on the media element, NOT the whole page
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x > 80) goPrev()
    else if (info.offset.x < -80) goNext()
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "rgba(245, 242, 235, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      onClick={onClose}
    >
      {/* Close button — solid, not glass */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.39_0.085_168)] text-white shadow-md hover:bg-[oklch(0.33_0.08_170)] transition"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        aria-label="بستن"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-50 rounded-full bg-[oklch(0.39_0.085_168)] px-3 py-1 text-white text-xs tabular-nums shadow-md" style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}>
        {toPersianDigits(index + 1)} / {toPersianDigits(items.length)}
      </div>

      {/* Prev arrow */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[oklch(0.39_0.085_168)] shadow-md hover:bg-[oklch(0.95_0.018_82)] transition"
          aria-label="قبلی"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Next arrow */}
      {index < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[oklch(0.39_0.085_168)] shadow-md hover:bg-[oklch(0.95_0.018_82)] transition"
          aria-label="بعدی"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Media — draggable area, stops page from scrolling */}
      <div
        className="relative flex flex-col items-center max-w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={onDragEnd}
            className="flex flex-col items-center cursor-grab active:cursor-grabbing"
          >
            {/* The media */}
            <div className="relative flex items-center justify-center">
              {item.type === "video" ? (
                <div className="flex flex-col items-center">
                  <video
                    ref={videoRef}
                    src={item.url}
                    poster={item.thumb || undefined}
                    playsInline
                    onClick={togglePlay}
                    className="max-h-[65vh] max-w-[90vw] rounded-xl bg-black shadow-xl"
                  />
                  {!playing && (
                    <button onClick={togglePlay} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.39_0.085_168)] text-white shadow-lg">
                      <Play className="h-8 w-8 mr-1" fill="currentColor" />
                    </button>
                  )}
                  {/* Timeline */}
                  <div className="mt-3 flex items-center gap-2 w-full max-w-md">
                    <button onClick={togglePlay} className="text-[oklch(0.39_0.085_168)] shrink-0">
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="text-[10px] text-[oklch(0.39_0.085_168)] tabular-nums shrink-0" dir="ltr">{fmtTime(current)}</span>
                    <div onClick={seek} className="relative h-1.5 flex-1 rounded-full bg-[oklch(0.9_0.01_85)] cursor-pointer">
                      <div className="absolute inset-y-0 right-0 rounded-full bg-[oklch(0.39_0.085_168)]" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-[oklch(0.39_0.085_168)] tabular-nums shrink-0" dir="ltr">{fmtTime(duration)}</span>
                  </div>
                </div>
              ) : (
                <img
                  src={item.thumb || item.url}
                  alt={item.caption ?? ""}
                  onLoad={() => setLoaded(true)}
                  className="max-h-[65vh] max-w-[90vw] rounded-xl shadow-xl object-contain"
                />
              )}
            </div>

            {/* Caption box */}
            {(item.caption || item.description) && (
              <div className="mt-4 w-full max-w-md rounded-xl bg-white border border-[oklch(0.76_0.14_80/0.15)] p-4 shadow-sm">
                {item.caption && <p className="text-sm font-medium text-[oklch(0.39_0.085_168)] text-center mb-1">{item.caption}</p>}
                {item.description && <p className="text-xs text-muted-foreground text-center leading-5">{item.description}</p>}
              </div>
            )}

            {/* Download button — solid */}
            <button
              onClick={download}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[oklch(0.39_0.085_168)] px-5 py-2 text-sm text-white shadow-md hover:bg-[oklch(0.33_0.08_170)] transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              دانلود
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
