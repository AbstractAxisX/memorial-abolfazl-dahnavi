"use client"

import { MediaViewer, type MediaItem } from "./media-viewer"
import type { GalleryItem } from "@/lib/store"

/**
 * Legacy-compatible wrapper: keeps the old (items, index|null, onClose,
 * onNavigate) API used by gallery-view, now powered by the full MediaViewer
 * engine (original-size display, zoom/pan/pinch, strong video player,
 * swipe, neighbor preloading).
 */
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
  // index === null → closed; otherwise show the engine at the given index
  if (index === null) return null
  return (
    <MediaViewer
      items={items as unknown as MediaItem[]}
      index={index}
      onIndex={onNavigate}
      onClose={onClose}
      originRect={null}
    />
  )
}
