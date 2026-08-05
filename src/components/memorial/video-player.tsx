"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Loader2, RotateCcw, RotateCw } from "lucide-react"
import { toPersianDigits } from "./biography-view"

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${toPersianDigits(m)}:${toPersianDigits(sec).padStart(2, "۰")}`
}

const SPEEDS = [0.5, 1, 1.5, 2]

export function VideoPlayer({
  src,
  poster,
  title,
  description,
}: {
  src: string
  poster?: string | null
  title?: string | null
  description?: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffering, setBuffering] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [started, setStarted] = useState(false)

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      setStarted(true)
    } else {
      v.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const seek = (frac: number) => {
    const v = videoRef.current
    if (!v || !duration) return
    v.currentTime = frac * duration
  }

  const skip = (delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta))
  }

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 3000)
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => { setPlaying(true); setBuffering(false); revealControls() }
    const onPause = () => { setPlaying(false); setShowControls(true) }
    const onTime = () => setCurrent(v.currentTime)
    const onMeta = () => setDuration(v.duration || 0)
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
  }, [revealControls])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault(); togglePlay(); break
        case "ArrowLeft": skip(-5); break
        case "ArrowRight": skip(5); break
        case "f": toggleFullscreen(); break
        case "m": toggleMute(); break
      }
      revealControls()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [togglePlay, toggleFullscreen, toggleMute, revealControls])

  const progress = duration ? current / duration : 0

  return (
    <div className="space-y-3">
      {title && <h4 className="font-display text-lg emerald-text text-balance">{title}</h4>}
      <div
        ref={containerRef}
        dir="ltr"
        className="group relative overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] bg-black shadow-xl"
        onMouseMove={revealControls}
        onMouseLeave={() => { if (playing) setShowControls(false) }}
        onClick={revealControls}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          playsInline
          className="h-full w-full max-h-[80vh] bg-black"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        />

        {/* buffering spinner */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.74_0.135_82)]" />
          </div>
        )}

        {/* big center play when paused/not started */}
        <AnimatePresence>
          {!playing && !buffering && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={togglePlay}
              className="absolute inset-0 m-auto h-20 w-20 flex items-center justify-center rounded-full bg-[oklch(0.36_0.07_168/0.85)] text-ivory backdrop-blur shadow-2xl ring-4 ring-white/20 hover:scale-105 transition"
              aria-label="پخش"
            >
              <Play className="h-9 w-9 mr-1" fill="currentColor" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* poster title overlay (before start) */}
        {!started && poster && (
          <div className="absolute inset-0 flex items-end justify-start p-4 pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
            {title && <span className="text-white/90 text-sm font-medium">{title}</span>}
          </div>
        )}

        {/* control bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* progress bar */}
              <div
                className="group/bar relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  seek((e.clientX - rect.left) / rect.width)
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.6_0.1_168)] to-[oklch(0.82_0.12_85)]"
                  style={{ width: `${progress * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow opacity-0 group-hover/bar:opacity-100 transition"
                  style={{ left: `calc(${progress * 100}% - 6px)` }}
                />
              </div>

              <div className="mt-2 flex items-center gap-2 text-white">
                <button onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded-full" aria-label="پخش/توقف">
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button onClick={() => skip(-10)} className="p-1.5 hover:bg-white/10 rounded-full" aria-label="۱۰ ثانیه عقب">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => skip(10)} className="p-1.5 hover:bg-white/10 rounded-full" aria-label="۱۰ ثانیه جلو">
                  <RotateCw className="h-4 w-4" />
                </button>
                <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-full" aria-label="صدا">
                  {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = videoRef.current
                    if (!v) return
                    const val = Number(e.target.value)
                    v.volume = val
                    v.muted = val === 0
                    setVolume(val)
                    setMuted(val === 0)
                  }}
                  className="h-1 w-16 accent-[oklch(0.74_0.135_82)]"
                  aria-label="صدا"
                />
                <span className="text-xs tabular-nums text-white/80" dir="ltr">
                  {fmtTime(current)} / {fmtTime(duration)}
                </span>
                <div className="flex-1" />
                <div className="relative">
                  <button
                    onClick={() => setShowSettings((s) => !s)}
                    className={`p-1.5 rounded-full hover:bg-white/10 ${showSettings ? "bg-white/15" : ""}`}
                    aria-label="تنظیمات"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-9 right-0 w-32 rounded-lg bg-black/90 backdrop-blur p-1.5 text-xs"
                      >
                        <p className="px-2 py-1 text-white/60">سرعت پخش</p>
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              const v = videoRef.current
                              if (v) v.playbackRate = s
                              setSpeed(s)
                              setShowSettings(false)
                            }}
                            className={`block w-full rounded px-2 py-1 text-right hover:bg-white/10 ${speed === s ? "text-[oklch(0.74_0.135_82)]" : "text-white/90"}`}
                          >
                            {toPersianDigits(s)}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-full" aria-label="تمام صفحه">
                  {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {description && <p className="text-sm leading-7 text-foreground/75 text-justify">{description}</p>}
    </div>
  )
}

export default VideoPlayer
