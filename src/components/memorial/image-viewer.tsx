"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { Download, Play, Pause } from "lucide-react"
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

const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      if (Math.abs(e) < 1e-6) break
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    return sy(Math.min(1, Math.max(0, t)))
  }
}
const EASE_IOS = cubicBezier(0.32, 0.72, 0, 1)

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
  const [mounted, setMounted] = useState(false)
  const mediaRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const item = items[index]

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  // GSAP open animation — runs after portal mounts
  useEffect(() => {
    if (!mounted) return
    const media = mediaRef.current
    const backdrop = backdropRef.current
    const caption = captionRef.current
    const closeBtn = closeRef.current
    if (!media || !backdrop) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const S = Math.min(vw * 0.82, vh * 0.55, 400)
    const fx = (vw - S) / 2
    const fy = Math.max(70, (vh - S - 130) / 2)

    gsap.set(media, { top: originRect.top, left: originRect.left, width: originRect.width, height: originRect.height, borderRadius: 14, scale: 1, opacity: 1 })
    gsap.set(backdrop, { opacity: 0 })
    gsap.set(caption, { opacity: 0, y: 10, top: fy + S + 18 })
    gsap.set(closeBtn, { opacity: 0, scale: 0.8 })

    document.body.style.overflow = "hidden"

    const tl = gsap.timeline()
    tl.to(backdrop, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0)
      .to(media, { top: fy, left: fx, width: S, height: S, borderRadius: 24, duration: 0.5, ease: EASE_IOS }, 0)
      .to(caption, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.2)
      .to(closeBtn, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, 0.22)

    return () => { gsap.killTweensOf([media, backdrop, caption, closeBtn]) }
  }, [mounted, originRect])

  const handleClose = () => {
    const media = mediaRef.current
    const backdrop = backdropRef.current
    const caption = captionRef.current
    const closeBtn = closeRef.current
    if (!media || !backdrop) { onClose(); document.body.style.overflow = ""; return }

    gsap.timeline({ onComplete: () => { onClose(); document.body.style.overflow = "" } })
      .to(backdrop, { opacity: 0, duration: 0.25 }, 0)
      .to(media, { scale: 0.85, opacity: 0, borderRadius: 14, duration: 0.3, ease: "power2.in" }, 0)
      .to(caption, { opacity: 0, y: 8, duration: 0.2 }, 0)
      .to(closeBtn, { opacity: 0, scale: 0.8, duration: 0.2 }, 0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      else if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1)
      else if (e.key === "ArrowRight" && index < items.length - 1) setIndex(index + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, items.length])

  useEffect(() => {
    if (!mounted || item.type !== "video") return
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
  }, [mounted, index, item.type])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    // RTL: right = 0%, left = 100%. So we measure from right.
    const frac = (rect.right - e.clientX) / rect.width
    v.currentTime = Math.max(0, Math.min(1, frac)) * duration
  }

  const download = async () => {
    try {
      const res = await fetch(item.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = item.url.split("/").pop() || "download"
      a.click()
      URL.revokeObjectURL(url)
    } catch { window.open(item.url, "_blank") }
  }

  if (!mounted) return null

  // Portal to document.body — escapes ALL ancestor transforms/filters
  // This ensures position:fixed is truly relative to viewport,
  // and the blur backdrop covers EVERYTHING (navbar, header, sections)
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }} onClick={handleClose}>
      <div ref={backdropRef} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }} />

      <div ref={mediaRef} style={{ position: "fixed", zIndex: 10, overflow: "hidden", backgroundColor: "#000", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }} onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <div className="flex h-full w-full flex-col">
            <video ref={videoRef} src={item.url} poster={item.thumb || undefined} playsInline onClick={togglePlay} className="flex-1 w-full object-contain" />
            {!playing && (
              <button onClick={togglePlay} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.39_0.085_168)] text-white shadow-lg">
                <Play className="h-8 w-8 mr-1" fill="currentColor" />
              </button>
            )}
            <div className="flex items-center gap-2 bg-black/80 px-3 py-2">
              <button onClick={togglePlay} className="text-white shrink-0">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <span className="text-[10px] text-white tabular-nums shrink-0" dir="ltr">{fmtTime(current)}</span>
              <div onClick={seek} className="relative h-1.5 flex-1 rounded-full bg-white/20 cursor-pointer">
                <div className="absolute inset-y-0 right-0 rounded-full bg-[oklch(0.76_0.14_80)]" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="text-[10px] text-white tabular-nums shrink-0" dir="ltr">{fmtTime(duration)}</span>
            </div>
          </div>
        ) : (
          <img src={item.thumb || item.url} alt={item.caption ?? ""} className="h-full w-full object-contain" draggable={false} />
        )}
      </div>

      <div ref={captionRef} style={{ position: "fixed", zIndex: 20, left: 0, right: 0, margin: "0 auto", maxWidth: "28rem", padding: "0 1rem" }} onClick={(e) => e.stopPropagation()}>
        {(item.caption || item.description) && (
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-3 shadow-lg mb-2">
            {item.caption && <p className="text-sm font-medium text-white text-center mb-0.5">{item.caption}</p>}
            {item.description && <p className="text-xs text-white/60 text-center leading-5">{item.description}</p>}
          </div>
        )}
        <button onClick={download} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[oklch(0.39_0.085_168)] px-5 py-2 text-sm text-white shadow-md hover:bg-[oklch(0.33_0.08_170)] transition active:scale-95">
          <Download className="h-4 w-4" /> دانلود
        </button>
      </div>

      <button ref={closeRef} onClick={(e) => { e.stopPropagation(); handleClose() }} style={{ position: "fixed", top: "max(1.25rem, env(safe-area-inset-top))", left: "1.25rem", zIndex: 20 }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition" aria-label="بستن">
        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l10 10M12 2 2 12" /></svg>
      </button>

      <div style={{ position: "fixed", top: "max(1.25rem, env(safe-area-inset-top))", right: "1.25rem", zIndex: 20 }} className="rounded-full bg-white/15 backdrop-blur px-3 py-1 text-white text-xs tabular-nums">
        {toPersianDigits(index + 1)} / {toPersianDigits(items.length)}
      </div>
    </div>,
    document.body
  )
}
