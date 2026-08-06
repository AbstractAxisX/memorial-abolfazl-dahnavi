"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Play, Pause } from "lucide-react"
import { toPersianDigits } from "./biography-view"

export type ViewerItem = {
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
  originRect,
  onClose,
}: {
  items: ViewerItem[]
  startIndex: number
  originRect: DOMRect
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const item = items[index]

  // Calculate target position (centered in viewport)
  const vw = typeof window !== "undefined" ? window.innerWidth : 390
  const vh = typeof window !== "undefined" ? window.innerHeight : 844
  const targetW = Math.min(vw * 0.85, 420)
  const targetH = Math.min(vh * 0.45, 400)
  const targetLeft = (vw - targetW) / 2
  const targetTop = Math.max(60, (vh - targetH - 140) / 2)

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

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1)
      else if (e.key === "ArrowRight" && index < items.length - 1) setIndex(index + 1)
      else if (e.key === " " && item.type === "video") { e.preventDefault(); togglePlay() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, index, items.length, item.type, togglePlay])

  // lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // video events
  useEffect(() => {
    if (item.type !== "video") return
    const v = videoRef.current
    if (!v) return
    const onTime = () => { setCurrent(v.currentTime); if (v.duration) setProgress(v.currentTime / v.duration) }
    const onMeta = () => setDuration(v.duration || 0)
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100]"
      style={{
        backgroundColor: "rgba(20, 16, 30, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      onClick={onClose}
    >
      {/* Close button */}
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

      {/* Prev/Next arrows */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex(index - 1) }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[oklch(0.39_0.085_168)] shadow-md hover:bg-[oklch(0.95_0.018_82)] transition"
          aria-label="قبلی"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
      {index < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex(index + 1) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[oklch(0.39_0.085_168)] shadow-md hover:bg-[oklch(0.95_0.018_82)] transition"
          aria-label="بعدی"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}

      {/* The media — animates from clicked position to center */}
      <motion.div
        initial={{
          position: "fixed",
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: 12,
        }}
        animate={{
          left: targetLeft,
          top: targetTop,
          width: targetW,
          height: targetH,
          borderRadius: 20,
        }}
        exit={{
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: 12,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="fixed z-10 shadow-2xl overflow-hidden bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <div className="flex h-full w-full flex-col">
            <video
              ref={videoRef}
              src={item.url}
              poster={item.thumb || undefined}
              playsInline
              onClick={togglePlay}
              className="flex-1 w-full object-contain"
            />
            {!playing && (
              <button onClick={togglePlay} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.39_0.085_168)] text-white shadow-lg">
                <Play className="h-8 w-8 mr-1" fill="currentColor" />
              </button>
            )}
            {/* Timeline */}
            <div className="flex items-center gap-2 bg-black/80 px-3 py-2">
              <button onClick={togglePlay} className="text-white shrink-0">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <span className="text-[10px] text-white tabular-nums shrink-0" dir="ltr">{fmtTime(current)}</span>
              <div onClick={seek} className="relative h-1.5 flex-1 rounded-full bg-white/20 cursor-pointer">
                <div className="absolute inset-y-0 right-0 rounded-full bg-[oklch(0.76_0.14_80)]" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="text-[10px] text-white tabular-nums shrink-0" dir="ltr">{fmtTime(duration)}</span>
            </div>
          </div>
        ) : (
          <img
            src={item.thumb || item.url}
            alt={item.caption ?? ""}
            className="h-full w-full object-contain"
          />
        )}
      </motion.div>

      {/* Caption + download — below the image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.15 }}
        className="fixed z-20"
        style={{
          left: targetLeft,
          top: targetTop + targetH + 12,
          width: targetW,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(item.caption || item.description) && (
          <div className="rounded-xl bg-white border border-[oklch(0.76_0.14_80/0.15)] p-3 shadow-sm mb-2">
            {item.caption && <p className="text-sm font-medium text-[oklch(0.39_0.085_168)] text-center mb-0.5">{item.caption}</p>}
            {item.description && <p className="text-xs text-muted-foreground text-center leading-5">{item.description}</p>}
          </div>
        )}
        <button
          onClick={download}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[oklch(0.39_0.085_168)] px-5 py-2 text-sm text-white shadow-md hover:bg-[oklch(0.33_0.08_170)] transition active:scale-95"
        >
          <Download className="h-4 w-4" />
          دانلود
        </button>
      </motion.div>
    </motion.div>
  )
}
