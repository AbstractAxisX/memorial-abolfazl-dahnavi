"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { GalleryItem } from "@/lib/store"

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[]
  index: number | null
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const open = index !== null

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && index !== null)
        onNavigate((index + 1) % items.length)
      if (e.key === "ArrowRight" && index !== null)
        onNavigate((index - 1 + items.length) % items.length)
    }
    window.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [open, index, items.length, onClose, onNavigate])

  const current = index !== null ? items[index] : null

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[oklch(0.12_0.02_165/0.92)] backdrop-blur-md p-4"
          onClick={onClose}
          dir="ltr"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (index !== null) onNavigate((index + 1) % items.length)
                }}
                className="absolute left-3 sm:left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="قبلی"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (index !== null) onNavigate((index - 1 + items.length) % items.length)
                }}
                className="absolute right-3 sm:right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="بعدی"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-[92vw] max-h-[86vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              <video
                src={current.url}
                controls
                autoPlay
                className="max-w-[92vw] max-h-[80vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={current.url}
                alt={current.caption ?? ""}
                className="max-w-[92vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            )}
            {current.caption && (
              <p className="mt-4 text-center text-sm text-white/80 max-w-xl text-balance">
                {current.caption}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
