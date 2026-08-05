"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Music2, Play } from "lucide-react"
import { toPersianDigits } from "./biography-view"

export type ReelVideo = {
  url: string
  title?: string | null
  description?: string | null
  poster?: string | null
  author?: string | null
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
  const [buffering, setBuffering] = useState(true)
  const [error, setError] = useState(false)
  const [liked, setLiked] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number; id: number } | null>(null)
  const [showHeart, setShowHeart] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [showPauseIcon, setShowPauseIcon] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number>(0)

  const video = videos[index]

  const revealPauseIcon = useCallback(() => {
    setShowPauseIcon(true)
    setTimeout(() => setShowPauseIcon(false), 800)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
    revealPauseIcon()
  }, [revealPauseIcon])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i < videos.length - 1) {
        setProgress(0); setBuffering(true); setError(false); setPlaying(true)
        return i + 1
      }
      return i
    })
  }, [videos.length])

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i > 0) {
        setProgress(0); setBuffering(true); setError(false); setPlaying(true)
        return i - 1
      }
      return i
    })
  }, [])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext()
      else if (e.key === " ") { e.preventDefault(); togglePlay() }
      else if (e.key === "m") toggleMute()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, goNext, goPrev, togglePlay, toggleMute])

  // video events
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => { setPlaying(true); setBuffering(false) }
    const onPause = () => setPlaying(false)
    const onTime = () => { if (v.duration) setProgress(v.currentTime / v.duration) }
    const onMeta = () => setBuffering(false)
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    const onError = () => { setError(true); setBuffering(false) }
    const onEnded = () => goNext()
    const onCanPlay = () => { setBuffering(false); if (playing) v.play().catch(() => {}) }
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("loadedmetadata", onMeta)
    v.addEventListener("waiting", onWaiting)
    v.addEventListener("playing", onPlaying)
    v.addEventListener("error", onError)
    v.addEventListener("ended", onEnded)
    v.addEventListener("canplay", onCanPlay)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("loadedmetadata", onMeta)
      v.removeEventListener("waiting", onWaiting)
      v.removeEventListener("playing", onPlaying)
      v.removeEventListener("error", onError)
      v.removeEventListener("ended", onEnded)
      v.removeEventListener("canplay", onCanPlay)
    }
  }, [index, playing, goNext])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // Tap handling: single tap = play/pause, double tap = like
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    const isDouble = now - lastTap < 300
    setLastTap(now)

    if (isDouble) {
      // double tap = like
      setLiked((l) => ({ ...l, [index]: true }))
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 1000)
    } else {
      // single tap — wait to see if double follows
      setTimeout(() => {
        if (Date.now() - lastTap >= 300) {
          togglePlay()
        }
      }, 300)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    const dt = Date.now() - touchStartTime.current
    if (delta < -40 && dt < 500) goNext()
    else if (delta > 40 && dt < 500) goPrev()
    touchStartY.current = null
  }

  const isLiked = liked[index]
  const isSaved = saved[index]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none"
      style={{ touchAction: "pan-y" }}
    >
      {/* Video container — vertical, fills screen */}
      <div
        ref={containerRef}
        className="relative h-full w-full max-w-md mx-auto bg-black overflow-hidden"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* The video itself */}
        <video
          ref={videoRef}
          src={video.url}
          poster={video.poster || undefined}
          playsInline
          autoPlay
          loop
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-black">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl p-8 max-w-xs">
              <p className="text-white text-base font-medium mb-2">این ویدیو پخش نمی‌شود</p>
              <p className="text-white/50 text-xs mb-5 leading-6">فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل MP4 (H.264) معتبر آپلود کنید.</p>
              {index < videos.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); goNext() }} className="rounded-full bg-white/20 px-5 py-2.5 text-sm text-white">ویدیوی بعدی</button>
              )}
            </div>
          </div>
        )}

        {/* Buffering spinner */}
        {buffering && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="h-28 w-28 text-white" fill="oklch(0.52 0.18 25)" stroke="oklch(0.52 0.18 25)" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause icon overlay */}
        <AnimatePresence>
          {showPauseIcon && !buffering && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="rounded-full bg-black/40 backdrop-blur p-6">
                {playing ? (
                  <Play className="h-12 w-12 text-white" fill="currentColor" />
                ) : (
                  <div className="flex gap-2">
                    <div className="w-4 h-12 bg-white rounded" />
                    <div className="w-4 h-12 bg-white rounded" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top gradient + close + progress bars */}
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
          <div className="h-32 bg-gradient-to-b from-black/50 to-transparent" />
        </div>
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto">
          {/* Segmented progress bars — Instagram Stories style */}
          <div className="flex gap-1 mb-3">
            {videos.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                {i === index && (
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                )}
                {i < index && <div className="h-full w-full bg-white rounded-full" />}
              </div>
            ))}
          </div>
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button onClick={(e) => { e.stopPropagation(); onClose() }} className="flex h-9 w-9 items-center justify-center rounded-full text-white active:scale-90 transition">
              <X className="h-6 w-6" />
            </button>
            <span className="text-white text-sm font-medium">ریلز</span>
            <button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="flex h-9 w-9 items-center justify-center rounded-full text-white active:scale-90 transition">
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Right sidebar — Instagram actions */}
        <div className="absolute right-2 bottom-28 z-30 flex flex-col items-center gap-5 pointer-events-auto">
          {/* Like */}
          <button
            onClick={(e) => { e.stopPropagation(); setLiked((l) => ({ ...l, [index]: !l[index] })) }}
            className="flex flex-col items-center gap-1 active:scale-90 transition"
          >
            <div className="flex h-12 w-12 items-center justify-center">
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`h-8 w-8 ${isLiked ? "text-[oklch(0.52_0.18_25)]" : "text-white"}`}
                  fill={isLiked ? "oklch(0.52 0.18 25)" : "none"}
                  stroke="white"
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>
            <span className="text-white text-[11px] font-medium tabular-nums">{toPersianDigits(isLiked ? 124 : 123)}</span>
          </button>
          {/* Comment */}
          <button onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-1 active:scale-90 transition">
            <div className="flex h-12 w-12 items-center justify-center">
              <MessageCircle className="h-8 w-8 text-white" stroke="white" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[11px] font-medium">{toPersianDigits(12)}</span>
          </button>
          {/* Share */}
          <button onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-1 active:scale-90 transition">
            <div className="flex h-12 w-12 items-center justify-center">
              <Send className="h-8 w-8 text-white" stroke="white" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[11px] font-medium">ارسال</span>
          </button>
          {/* Save */}
          <button
            onClick={(e) => { e.stopPropagation(); setSaved((s) => ({ ...s, [index]: !s[index] })) }}
            className="flex flex-col items-center gap-1 active:scale-90 transition"
          >
            <div className="flex h-12 w-12 items-center justify-center">
              <Bookmark className={`h-8 w-8 ${isSaved ? "text-white" : "text-white"}`} fill={isSaved ? "white" : "none"} stroke="white" strokeWidth={1.5} />
            </div>
          </button>
          {/* More */}
          <button onClick={(e) => e.stopPropagation()} className="flex h-12 w-12 items-center justify-center active:scale-90 transition">
            <MoreHorizontal className="h-7 w-7 text-white" />
          </button>
        </div>

        {/* Bottom info — caption + author + music */}
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
          <div className="h-40 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div
          className="absolute bottom-0 right-0 left-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pr-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Author row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[oklch(0.52_0.18_25)] via-[oklch(0.74_0.135_82)] to-[oklch(0.36_0.07_168)] p-[2px]">
              <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-xs font-bold">ا</span>
              </div>
            </div>
            <span className="text-white text-sm font-semibold">{video.author || "یادبود شهید"}</span>
            <button className="rounded-lg border border-white/60 px-3 py-0.5 text-white text-xs font-medium">دنبال کردن</button>
          </div>
          {/* Caption */}
          {(video.title || video.description) && (
            <p className="text-white text-sm leading-6 mb-2 line-clamp-2">
              <span className="font-semibold">{video.author || "یادبود"}</span>{" "}
              {(video.title || video.description || "").slice(0, 100)}
              {(video.title || video.description || "").length > 100 ? "..." : ""}
              <span className="text-white/60"> بیشتر</span>
            </p>
          )}
          {/* Music bar */}
          <div className="flex items-center gap-2 mt-2">
            <Music2 className="h-3.5 w-3.5 text-white shrink-0" />
            <div className="overflow-hidden flex-1">
              <motion.div
                animate={{ x: [0, -200] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="whitespace-nowrap text-white text-xs"
              >
                یادبود شهید ابوالفضل دهنوی • امدادگر هلال احمر • {video.title || "ریلز یادبود"}
              </motion.div>
            </div>
          </div>
          {/* Counter */}
          <div className="mt-2 text-white/60 text-[11px]">
            {toPersianDigits(index + 1)} از {toPersianDigits(videos.length)}
          </div>
        </div>

        {/* Swipe hint arrows (desktop) */}
        {index < videos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="hidden sm:flex absolute bottom-1/2 left-2 z-30 h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur text-white"
          >
            ↓
          </button>
        )}
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="hidden sm:flex absolute top-1/2 left-2 z-30 h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur text-white"
          >
            ↑
          </button>
        )}
      </div>
    </motion.div>
  )
}
