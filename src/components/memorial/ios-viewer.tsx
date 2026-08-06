"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Download, Loader2, Play, Pause } from "lucide-react"
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

export function IosViewer({
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
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [dragging, setDragging] = useState(false)

  // video state
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
      setPlaying(false)
    }
  }, [index, items.length])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setDirection(-1)
      setIndex((i) => i - 1)
      setPlaying(false)
    }
  }, [index])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  // keyboard
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
  }, [onClose, goNext, goPrev, item, togglePlay])

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // video events
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

  // drag/swipe handlers
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    setDragging(false)
    if (info.offset.x > 80 && index > 0) goPrev()
    else if (info.offset.x < -80 && index < items.length - 1) goNext()
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0, scale: 0.95 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", backgroundColor: "rgba(15, 20, 18, 0.55)" }}
    >
      {/* Close button — top right, small, iOS style */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClose}
        whileTap={{ scale: 0.85 }}
        className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-lg"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        aria-label="بستن"
      >
        <X className="h-5 w-5" />
      </motion.button>

      {/* Prev arrow — small, left */}
      {index > 0 && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={goPrev}
          whileTap={{ scale: 0.85 }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white shadow-lg"
          aria-label="قبلی"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}

      {/* Next arrow — small, right */}
      {index < items.length - 1 && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={goNext}
          whileTap={{ scale: 0.85 }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white shadow-lg"
          aria-label="بعدی"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      )}

      {/* Slider content — draggable */}
      <div className="relative w-full max-w-3xl h-full flex items-center justify-center px-2">
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragStart={() => setDragging(true)}
            onDragEnd={onDragEnd}
            className="relative flex flex-col items-center max-h-[90vh] w-full"
          >
            {/* Media container — natural size, not fullscreen */}
            <div className="relative flex items-center justify-center max-h-[70vh]">
              {!loaded[index] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/70" />
                </div>
              )}
              {item.type === "video" ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={item.url}
                    poster={item.thumb || undefined}
                    playsInline
                    onClick={togglePlay}
                    className="max-h-[70vh] max-w-full rounded-xl shadow-2xl"
                    style={{ maxHeight: "70vh" }}
                  />
                  {/* Play/pause overlay */}
                  {!playing && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-xl">
                        <Play className="h-8 w-8 text-white mr-1" fill="currentColor" />
                      </span>
                    </button>
                  )}
                  {/* Timeline bar — simple, below video */}
                  <div className="mt-2 flex items-center gap-2 px-1">
                    <button onClick={togglePlay} className="text-white/90 shrink-0">
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="text-[10px] text-white/70 tabular-nums shrink-0" dir="ltr">{fmtTime(current)}</span>
                    <div
                      onClick={seek}
                      className="relative h-1.5 flex-1 rounded-full bg-white/20 cursor-pointer"
                    >
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[oklch(0.76_0.14_80)] to-[oklch(0.6_0.12_70)]"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/70 tabular-nums shrink-0" dir="ltr">{fmtTime(duration)}</span>
                  </div>
                </div>
              ) : (
                <img
                  src={item.thumb || item.url}
                  alt={item.caption ?? ""}
                  loading="lazy"
                  onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
                  className="max-h-[70vh] max-w-full rounded-xl shadow-2xl object-contain"
                />
              )}
            </div>

            {/* Caption box — beautiful, below image */}
            {(item.caption || item.description) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 w-full max-w-2xl rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 shadow-lg"
              >
                {item.caption && (
                  <p className="text-white text-sm font-medium leading-6 text-center mb-1">{item.caption}</p>
                )}
                {item.description && (
                  <p className="text-white/60 text-xs leading-5 text-center">{item.description}</p>
                )}
              </motion.div>
            )}

            {/* Download button — glass, below caption */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={download}
              whileTap={{ scale: 0.95 }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-5 py-2 text-sm text-white shadow-lg hover:bg-white/25 transition"
            >
              <Download className="h-4 w-4" />
              دانلود
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Counter */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-[11px] tabular-nums" style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {toPersianDigits(index + 1)} / {toPersianDigits(items.length)}
      </div>
    </motion.div>
  )
}
