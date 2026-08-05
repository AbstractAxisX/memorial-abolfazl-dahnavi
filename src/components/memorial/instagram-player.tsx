"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, Volume2, VolumeX, Pause, Play, Loader2 } from "lucide-react"
import { toPersianDigits } from "./biography-view"

export type ReelVideo = {
  url: string
  title?: string | null
  description?: string | null
  poster?: string | null
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${toPersianDigits(m)}:${toPersianDigits(sec).padStart(2, "۰")}`
}

export function InstagramPlayer({
  videos,
  startIndex = 0,
  onClose,
}: {
  videos: ReelVideo[]
  startIndex?: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [buffering, setBuffering] = useState(true)
  const [error, setError] = useState(false)
  const [showUI, setShowUI] = useState(true)
  const [liked, setLiked] = useState(false)
  const [tapEffect, setTapEffect] = useState<"pause" | "like" | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartY = useRef<number | null>(null)

  const video = videos[index]

  const revealUI = useCallback(() => {
    setShowUI(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowUI(false), 3000)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    revealUI()
  }, [revealUI])

  const goNext = useCallback(() => {
    if (index < videos.length - 1) {
      setIndex((i) => i + 1)
      setProgress(0); setCurrent(0); setBuffering(true); setError(false); setPlaying(true)
    }
  }, [index, videos.length])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1)
      setProgress(0); setCurrent(0); setBuffering(true); setError(false); setPlaying(true)
    }
  }, [index])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowUp") goPrev()
      if (e.key === "ArrowDown") goNext()
      if (e.key === " ") { e.preventDefault(); togglePlay() }
      if (e.key === "m") toggleMute()
      revealUI()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, goNext, goPrev, togglePlay, toggleMute, revealUI])

  // video events
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => { setPlaying(true); setBuffering(false); revealUI() }
    const onPause = () => { setPlaying(false); setShowUI(true) }
    const onTime = () => {
      setCurrent(v.currentTime)
      if (v.duration) setProgress(v.currentTime / v.duration)
    }
    const onMeta = () => { setDuration(v.duration || 0); setBuffering(false) }
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    const onError = () => { setError(true); setBuffering(false) }
    const onCanPlay = () => { setBuffering(false); if (playing) v.play().catch(() => {}) }
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("loadedmetadata", onMeta)
    v.addEventListener("waiting", onWaiting)
    v.addEventListener("playing", onPlaying)
    v.addEventListener("error", onError)
    v.addEventListener("canplay", onCanPlay)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("loadedmetadata", onMeta)
      v.removeEventListener("waiting", onWaiting)
      v.removeEventListener("playing", onPlaying)
      v.removeEventListener("error", onError)
      v.removeEventListener("canplay", onCanPlay)
    }
  }, [index, playing, revealUI])

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const handleTap = () => {
    const now = Date.now()
    if (tapEffect === "pause" && now - (tapEffect as unknown as number) < 300) {
      // double tap — like
      setLiked(true)
      setTapEffect("like")
      setTimeout(() => setTapEffect(null), 800)
    } else {
      // single tap — pause/play after short delay
      setTapEffect("pause" as unknown as number)
      setTimeout(() => {
        if (tapEffect === "pause") {
          togglePlay()
          setTapEffect(null)
        }
      }, 300)
    }
    revealUI()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta < -50) goNext()
    else if (delta > 50) goPrev()
    touchStartY.current = null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={video.url}
        poster={video.poster || undefined}
        playsInline
        autoPlay
        loop
        className="h-full w-full object-contain"
        onClick={handleTap}
      />

      {/* Buffering spinner */}
      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="rounded-2xl bg-white/10 backdrop-blur p-6">
            <p className="text-white/90 text-sm mb-1">این ویدیو پخش نمی‌شود</p>
            <p className="text-white/50 text-xs mb-4">فرمت فایل پشتیبانی نمی‌شود یا فایل خراب است. لطفاً فایل MP4 معتبر آپلود کنید.</p>
            {index < videos.length - 1 && (
              <button onClick={goNext} className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">ویدیوی بعدی</button>
            )}
          </div>
        </div>
      )}

      {/* Double-tap heart effect */}
      <AnimatePresence>
        {tapEffect === "like" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="h-24 w-24 text-white" fill="oklch(0.52 0.18 25)" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play/pause indicator */}
      <AnimatePresence>
        {!playing && !buffering && !error && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={togglePlay}
            className="absolute inset-0 m-auto h-20 w-20 flex items-center justify-center rounded-full bg-black/40 backdrop-blur pointer-events-auto"
          >
            <Play className="h-10 w-10 text-white mr-1" fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top progress bars (Instagram-style segmented) */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 pt-[env(safe-area-inset-top)]" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        {/* segmented progress */}
        <div className="flex gap-1 mb-2">
          {videos.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              {i === index && (
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
              {i < index && <div className="h-full w-full bg-white rounded-full" />}
            </div>
          ))}
        </div>
        {/* top bar: close + time */}
        <AnimatePresence>
          {showUI && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between"
            >
              <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur text-white">
                <X className="h-6 w-6" />
              </button>
              <span className="text-white/80 text-xs tabular-nums" dir="ltr">
                {fmtTime(current)} / {fmtTime(duration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom overlay: title + description + actions */}
      <AnimatePresence>
        {showUI && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 inset-x-0 z-10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/70 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {video.title && (
              <h3 className="text-white font-display text-lg mb-1 text-balance">{video.title}</h3>
            )}
            {video.description && (
              <p className="text-white/70 text-sm leading-6 mb-3 text-balance">{video.description}</p>
            )}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={toggleMute} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white">
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button onClick={() => setLiked((l) => !l)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white">
                <Heart className={`h-5 w-5 ${liked ? "text-[oklch(0.52_0.18_25)]" : ""}`} fill={liked ? "oklch(0.52 0.18 25)" : "none"} />
              </button>
              <span className="text-white/50 text-xs mr-auto">
                {toPersianDigits(index + 1)} از {toPersianDigits(videos.length)}
              </span>
              {index > 0 && (
                <button onClick={goPrev} className="text-white/60 text-xs hover:text-white">قبلی</button>
              )}
              {index < videos.length - 1 && (
                <button onClick={goNext} className="text-white/60 text-xs hover:text-white">بعدی</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe hints (edge arrows) */}
      {index < videos.length - 1 && showUI && (
        <div className="absolute bottom-1/2 left-1/2 translate-x-1/2 translate-y-16 text-white/30 text-[10px] pointer-events-none">
          ↑ برای ویدیوی بعدی ↑
        </div>
      )}
    </motion.div>
  )
}
