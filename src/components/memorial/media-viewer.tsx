"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, ChevronLeft, ChevronRight, Download, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut, Loader,
} from "lucide-react"
import { toPersianDigits } from "./biography-view"

// ─────────────────────────────────────────────────────────────────────────────
// MediaViewer — the site-wide photo/video viewer engine.
//
// • Photos open in their ORIGINAL aspect ratio, sized to the viewport
//   (never a fixed square), with a blurred low-res thumb placeholder for
//   instant perceived loading, zoom/pan/pinch, double-click zoom + download.
// • Videos get a full custom player: play/pause, seek, ±10s, volume, speed,
//   fullscreen, buffering state, poster overlay, keyboard + touch.
// • Swipe / arrows / counter / caption. Neighbor photos are preloaded.
// • Optional GSAP "morph" open/close animation from the clicked rect.
// ─────────────────────────────────────────────────────────────────────────────

export type MediaItem = {
  url: string
  type: "photo" | "video"
  caption?: string | null
  description?: string | null
  thumb?: string | null
  width?: number | null
  height?: number | null
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${toPersianDigits(m)}:${toPersianDigits(sec).padStart(2, "۰")}`
}

const SPEEDS = [0.5, 1, 1.5, 2]
const MIN_SCALE = 1
const MAX_SCALE = 6

/** Viewport-fitting box for an aspect ratio (original size, capped by screen). */
function fitBox(aspect: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxW = Math.min(vw * 0.94, 1600)
  const maxH = vh * 0.86
  let w = maxW
  let h = w / aspect
  if (h > maxH) {
    h = maxH
    w = h * aspect
  }
  return { left: (vw - w) / 2, top: (vh - h) / 2 - 14, width: w, height: h }
}

export function MediaViewer({
  items,
  index,
  onIndex,
  onClose,
  originRect,
}: {
  items: MediaItem[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  /** DOMRect of the clicked tile — enables the iOS-style morph (optional). */
  originRect?: DOMRect | null
}) {
  const [mounted, setMounted] = useState(false)
  const item = items[Math.min(index, items.length - 1)]

  // photo layout state — fall back to sensible defaults so the stage ALWAYS
  // has a box immediately (corrected once real dimensions load)
  const [aspect, setAspect] = useState<number>(
    item?.width && item?.height ? item.width / item.height : item?.type === "video" ? 16 / 9 : 4 / 3
  )
  const [fullLoaded, setFullLoaded] = useState(false)

  // zoom state
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  // video state
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex])

  // ── zoom helpers (photos) ──────────────────────────────────────────────
  // transform = translate(tx,ty) scale(s), transform-origin center.
  // Keeping viewport point (px,py) fixed while s→s' (k = s'/s):
  //   t' = t·k + (1−k)·(p − center)
  const zoomAround = useCallback((factor: number, px: number, py: number) => {
    const s0 = scale
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * factor))
    const k = s / s0
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    setScale(s)
    if (s <= MIN_SCALE + 0.001) { setTx(0); setTy(0) } else {
      setTx(tx * k + (1 - k) * (px - cx))
      setTy(ty * k + (1 - k) * (py - cy))
    }
  }, [scale, tx, ty])

  const scheduleHide = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 3000)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setStarted(true) } else v.pause()
  }, [])

  const skip = (d: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d))
  }

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current?.parentElement
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }, [])

  // reset per-item state + preload neighbors
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScale(1); setTx(0); setTy(0); setFullLoaded(false)
    setPlaying(false); setStarted(false); setCurrent(0); setDuration(0); setBuffering(false); setShowControls(true)
    const it = items[index]
    setAspect(it?.width && it?.height ? it.width / it.height : it?.type === "video" ? 16 / 9 : 4 / 3)
    // preload neighbor PHOTOS so next/prev is instant
    for (const n of [index - 1, index + 1]) {
      const it = items[(n + items.length) % items.length]
      if (it && it.type === "photo") {
        const img = new window.Image()
        img.decoding = "async"
        img.src = it.url
      }
    }
  }, [index, items])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  // lock page scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // compute the viewport-fitting box whenever the aspect changes or window resizes
  useEffect(() => {
    const apply = () => setBox(fitBox(aspect))
    apply()
    window.addEventListener("resize", apply)
    return () => window.removeEventListener("resize", apply)
  }, [aspect])

  // morph animation from the clicked tile — runs ONCE per item (on open);
  // later box corrections (aspect discovered after load / resize) snap without
  // re-animating.
  const morphedFor = useRef<number | null>(null)
  useEffect(() => {
    if (!mounted || !box || !stageRef.current) return
    const stage = stageRef.current
    if (morphedFor.current !== index) {
      // first layout for this item → animated morph from origin
      morphedFor.current = index
      gsap.set(stage, { left: box.left, top: box.top, width: box.width, height: box.height })
      if (originRect) {
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        gsap.from(stage, {
          x: originRect.left + originRect.width / 2 - cx,
          y: originRect.top + originRect.height / 2 - cy,
          scaleX: originRect.width / box.width,
          scaleY: originRect.height / box.height,
          opacity: 0.4,
          duration: 0.42,
          ease: "power2.inOut",
          overwrite: "auto",
        })
      } else {
        gsap.from(stage, { opacity: 0, scale: 0.94, duration: 0.28, ease: "power2.out", overwrite: "auto" })
      }
    } else {
      // box correction → reposition smoothly (150ms) without the full morph
      gsap.to(stage, { left: box.left, top: box.top, width: box.width, height: box.height, duration: 0.15, ease: "power1.out", overwrite: "auto" })
    }
  }, [mounted, box, originRect, index])

  function close() {
    const stage = stageRef.current
    document.body.style.overflow = ""
    if (stage && originRect && box) {
      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      gsap.to(stage, {
        x: originRect.left + originRect.width / 2 - cx,
        y: originRect.top + originRect.height / 2 - cy,
        scaleX: originRect.width / box.width,
        scaleY: originRect.height / box.height,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onClose,
      })
    } else {
      onClose()
    }
  }

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return }
      if (items.length < 2) return
      if (e.key === "ArrowLeft") next()
      if (e.key === "ArrowRight") prev()
      if (item?.type === "photo") {
        if (e.key === "+" || e.key === "=") zoomAround(1.4, window.innerWidth / 2, window.innerHeight / 2)
        if (e.key === "-" || e.key === "_") zoomAround(1 / 1.4, window.innerWidth / 2, window.innerHeight / 2)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, items.length, item?.type, next, prev, scale, tx, ty])

  // video element listeners
  useEffect(() => {
    if (item?.type !== "video") return
    const v = videoRef.current
    if (!v) return
    const onPlay = () => { setPlaying(true); setBuffering(false); scheduleHide() }
    const onPause = () => { setPlaying(false); setShowControls(true) }
    const onTime = () => setCurrent(v.currentTime)
    const onMeta = () => {
      setDuration(v.duration || 0)
      if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight)
    }
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("loadedmetadata", onMeta)
    v.addEventListener("waiting", onWaiting)
    v.addEventListener("playing", onPlaying)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("loadedmetadata", onMeta)
      v.removeEventListener("waiting", onWaiting)
      v.removeEventListener("playing", onPlaying)
    }
  }, [index, item?.type, mounted])

  // fullscreen tracking
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])


  // pointer drag: pan when zoomed (accumulates from drag start), swipe when not
  const drag = useRef<{ x: number; y: number; id: number; moved: boolean; tx0: number; ty0: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; scale: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && item?.type === "photo") {
      const [a, b] = Array.from(pointers.current.values())
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale }
    } else {
      drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, tx0: tx, ty0: ty }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    // pinch zoom around the midpoint
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinch.current.scale * (d / pinch.current.dist)))
      const k = target / (pinch.current.scale || 1)
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2
      setScale(target)
      if (target <= MIN_SCALE + 0.001) { setTx(0); setTy(0) } else {
        setTx(tx * k + (1 - k) * (mx - cx))
        setTy(ty * k + (1 - k) * (my - cy))
      }
      pinch.current.scale = target
      return
    }
    if (!drag.current || e.pointerId !== drag.current.id) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.current.moved = true
    if (scale > 1.001) {
      setTx(drag.current.tx0 + dx)
      setTy(drag.current.ty0 + dy)
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (!drag.current || e.pointerId !== drag.current.id) return
    const dx = e.clientX - drag.current.x
    if (drag.current.moved && scale <= 1.001 && items.length > 1 && Math.abs(dx) > 60) {
      // swipe navigation (photo & video) — horizontal only, not zoomed
      if (dx > 0) { prev() } else { next() }
    }
    drag.current = null
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    if (item?.type !== "photo") return
    if (scale > 1.001) { setScale(1); setTx(0); setTy(0) } else zoomAround(2.5, e.clientX, e.clientY)
  }

  const onWheel = (e: React.WheelEvent) => {
    if (item?.type !== "photo") return
    zoomAround(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY)
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


  if (!mounted || !item) return null

  const progress = duration ? current / duration : 0

  return createPortal(
    <div
      dir="ltr"
      style={{ position: "fixed", inset: 0, zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      {/* backdrop */}
      <div
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(6,20,17,0.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
        onClick={close}
        aria-hidden
      />

      {/* stage — the aspect-correct box (original size, viewport-capped) */}
      <div
        ref={stageRef}
        style={{
          position: "fixed",
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        {item.type === "photo" ? (
          <div className="relative h-full w-full select-none">
            {/* low-res blurred placeholder → instant perceived load */}
            {item.thumb && !fullLoaded && (
              <img src={item.thumb} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl" draggable={false} />
            )}
            {!fullLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-white/70" />
              </div>
            )}
            <img
              src={item.url}
              alt={item.caption ?? ""}
              draggable={false}
              decoding="async"
              onLoad={(e) => {
                setFullLoaded(true)
                const el = e.currentTarget
                if (el.naturalWidth && el.naturalHeight) setAspect(el.naturalWidth / el.naturalHeight)
              }}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
              style={{
                opacity: fullLoaded ? 1 : 0,
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                transformOrigin: "center center",
                willChange: "transform",
                cursor: scale > 1.001 ? "grab" : "zoom-in",
              }}
            />
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col bg-black">
            <video
              ref={videoRef}
              src={item.url}
              poster={item.thumb || undefined}
              playsInline
              preload="auto"
              className="h-full w-full object-contain"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />
            {/* buffering */}
            {buffering && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.74_0.135_82)]" />
              </div>
            )}
            {/* big play when paused */}
            <AnimatePresence>
              {!playing && !buffering && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={togglePlay}
                  className="absolute inset-0 z-[5] m-auto flex h-20 w-20 items-center justify-center rounded-full bg-[oklch(0.36_0.07_168/0.9)] text-white shadow-2xl ring-4 ring-white/20 backdrop-blur"
                  aria-label="پخش"
                >
                  <Play className="h-9 w-9 mr-1" fill="currentColor" />
                </motion.button>
              )}
            </AnimatePresence>
            {/* poster title overlay before start */}
            {!started && (item.caption || item.description) && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] flex flex-col gap-0.5 bg-gradient-to-t from-black/70 to-transparent p-4">
                {item.caption && <span className="text-sm font-medium text-white">{item.caption}</span>}
                {item.description && <span className="text-xs text-white/70 line-clamp-2">{item.description}</span>}
              </div>
            )}
            {/* control bar */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 14 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseMove={scheduleHide}
                >
                  {/* seek */}
                  <div
                    className="group/bar relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
                    onClick={(e) => {
                      const v = videoRef.current
                      if (!v || !duration) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration
                    }}
                  >
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.6_0.1_168)] to-[oklch(0.82_0.12_85)]" style={{ width: `${progress * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white opacity-0 shadow transition group-hover/bar:opacity-100" style={{ left: `calc(${progress * 100}% - 6px)` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-white">
                    <button onClick={togglePlay} className="rounded-full p-1.5 hover:bg-white/10" aria-label="پخش/توقف">
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    <button onClick={() => skip(-10)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="۱۰ ثانیه عقب"><RotateCcw className="h-4 w-4" /></button>
                    <button onClick={() => skip(10)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="۱۰ ثانیه جلو"><RotateCw className="h-4 w-4" /></button>
                    <button onClick={toggleMute} className="rounded-full p-1.5 hover:bg-white/10" aria-label="صدا">
                      {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        const v = videoRef.current
                        if (!v) return
                        const val = Number(e.target.value)
                        v.volume = val
                        v.muted = val === 0
                        setVolume(val); setMuted(val === 0)
                      }}
                      className="h-1 w-14 accent-[oklch(0.74_0.135_82)] sm:w-20"
                      aria-label="میزان صدا"
                    />
                    <span className="text-xs tabular-nums text-white/85">
                      {fmtTime(current)} / {fmtTime(duration)}
                    </span>
                    <div className="flex-1" />
                    <div className="relative">
                      <button onClick={() => setShowSettings((s) => !s)} className={`rounded-full p-1.5 hover:bg-white/10 ${showSettings ? "bg-white/15" : ""}`} aria-label="تنظیمات">
                        <Settings className="h-5 w-5" />
                      </button>
                      {showSettings && (
                        <div className="absolute bottom-9 right-0 w-32 rounded-lg bg-black/90 p-1.5 text-xs backdrop-blur">
                          <p className="px-2 py-1 text-white/60">سرعت پخش</p>
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                const v = videoRef.current
                                if (v) v.playbackRate = s
                                setSpeed(s); setShowSettings(false)
                              }}
                              className={`block w-full rounded px-2 py-1 text-right text-white/90 hover:bg-white/10 ${speed === s ? "text-[oklch(0.74_0.135_82)]" : ""}`}
                            >
                              {toPersianDigits(s)}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={toggleFullscreen} className="rounded-full p-1.5 hover:bg-white/10" aria-label="تمام صفحه">
                      {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* top bar: close, counter, zoom controls, download */}
      <div style={{ position: "fixed", top: "max(1rem, env(safe-area-inset-top))", left: 0, right: 0, zIndex: 30 }} className="flex items-center justify-between px-4">
        <button onClick={(e) => { e.stopPropagation(); close() }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label="بستن">
          <X className="h-5 w-5" />
        </button>
        {items.length > 1 && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs tabular-nums text-white backdrop-blur">
            {toPersianDigits(index + 1)} / {toPersianDigits(items.length)}
          </span>
        )}
        <div className="flex items-center gap-2">
          {item.type === "photo" && (
            <div className="flex items-center gap-1 rounded-full bg-white/15 p-0.5 backdrop-blur">
              <button onClick={(e) => { e.stopPropagation(); zoomAround(1 / 1.35, window.innerWidth / 2, window.innerHeight / 2) }} disabled={scale <= 1.001} className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 disabled:opacity-40" aria-label="کوچک‌نمایی">
                <ZoomOut className="h-4.5 w-4.5" />
              </button>
              <span className="min-w-10 text-center text-[11px] tabular-nums text-white/85">{toPersianDigits(Math.round(scale * 100))}٪</span>
              <button onClick={(e) => { e.stopPropagation(); zoomAround(1.35, window.innerWidth / 2, window.innerHeight / 2) }} className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20" aria-label="بزرگ‌نمایی">
                <ZoomIn className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); download() }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label="دانلود">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* prev / next */}
      {items.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); next() }} className="fixed left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/25 sm:left-4" aria-label="بعدی">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prev() }} className="fixed right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/25 sm:right-4" aria-label="قبلی">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* caption pill */}
      {(item.caption || item.description) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", bottom: "max(1rem, env(safe-area-inset-bottom))", left: 0, right: 0, zIndex: 30 }}
          className="mx-auto w-fit max-w-[92vw] rounded-2xl border border-white/15 bg-black/45 px-4 py-2 backdrop-blur-md"
        >
          {item.caption && <p className="text-center text-sm font-medium text-white">{item.caption}</p>}
          {item.description && <p className="mt-0.5 max-w-lg text-center text-xs leading-5 text-white/70">{item.description}</p>}
        </div>
      )}
    </div>,
    document.body
  )
}
