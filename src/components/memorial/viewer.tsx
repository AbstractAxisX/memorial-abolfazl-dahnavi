"use client"

import { useState } from "react"
import { MediaViewer, type MediaItem } from "./media-viewer"

export type ViewerItem = {
  url: string
  type: "photo" | "video"
  caption?: string | null
  description?: string | null
  thumb?: string | null
  width?: number | null
  height?: number | null
}

/**
 * Legacy-compatible wrapper: keeps the old (items, startIndex, originRect,
 * onClose) API used by gallery-section / section-renderers, now powered by
 * the full MediaViewer engine (original-size display, zoom/pan/pinch,
 * strong video player, swipe, preloading).
 */
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
  return (
    <MediaViewer
      items={items as MediaItem[]}
      index={index}
      onIndex={setIndex}
      onClose={onClose}
      originRect={originRect}
    />
  )
}
