import { createReadStream, statSync } from "fs"
import path from "path"
import { Readable } from "stream"
import { storageDir } from "@/lib/storage"

/**
 * Serves a runtime-written file from disk with full Range support (videos).
 *
 * WHY THIS EXISTS: Next.js only serves files from public/ that existed at
 * BUILD time (documented behavior for `next start` / standalone — plus a
 * long-standing flakiness in dev). Uploads land on disk at RUNTIME, so
 * their URLs (/uploads/<uuid>.png) 404 on a deployed server → images and
 * videos never load for visitors even though the upload returned 201.
 *
 * This is the safety net used by /uploads/[...file] and /fonts/[...file]:
 * when the static file server misses, the request falls through to those
 * routes, which stream the file from disk. Committed (build-time) files
 * keep being served by the fast static path.
 */

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

function toWebStream(absPath: string, range?: { start: number; end: number }): ReadableStream<Uint8Array> {
  const node = range ? createReadStream(absPath, range) : createReadStream(absPath)
  return Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>
}

/**
 * Guarded against path traversal, streams large files, honors Range.
 * Used by the /uploads/[...file] and /fonts/[...file] route handlers.
 */
export async function serveStorageFile(
  subdir: "uploads" | "fonts",
  segments: string[],
  rangeHeader: string | null
): Promise<Response> {
  const rel = (segments ?? []).join("/")
  const base = storageDir(subdir)
  const abs = path.resolve(base, rel)

  // traversal guard: resolved path must stay inside the storage dir.
  // dotfiles are also blocked (e.g. .staging-* = an upload in progress).
  if (
    !rel ||
    rel.includes("\0") ||
    rel.split("/").some((s) => s === ".." || s.startsWith("."))
  ) {
    return new Response("Not found", { status: 404 })
  }
  if (!abs.startsWith(path.resolve(base) + path.sep)) {
    return new Response("Not found", { status: 404 })
  }

  let size: number
  try {
    const st = statSync(abs)
    if (!st.isFile()) return new Response("Not found", { status: 404 })
    size = st.size
  } catch {
    return new Response("Not found", { status: 404 })
  }

  const type = MIME[path.extname(abs).toLowerCase()] || "application/octet-stream"
  const commonHeaders: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  }

  const range = rangeHeader ? /bytes=(\d*)-(\d*)/.exec(rangeHeader) : null
  if (range) {
    let start = range[1] ? parseInt(range[1], 10) : 0
    let end = range[2] ? parseInt(range[2], 10) : size - 1
    if (Number.isNaN(start) || start < 0) start = 0
    if (Number.isNaN(end) || end >= size) end = size - 1
    if (start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
      })
    }
    return new Response(toWebStream(abs, { start, end }), {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    })
  }

  return new Response(toWebStream(abs), {
    status: 200,
    headers: { ...commonHeaders, "Content-Length": String(size) },
  })
}
