import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { storageDir } from "@/lib/storage"
import { detectKind, processMedia, MAX_UPLOAD_BYTES, MAX_SIZE_LABEL } from "@/lib/media-process"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Multipart upload endpoint (kept for backward compatibility).
 * NOTE: req.formData() buffers the whole file in RAM — for the new 200MB
 * videos use /api/upload/stream, which streams to disk with flat memory.
 */

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard

  const contentType = req.headers.get("content-type") || ""
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "فرمت درخواست نامعتبر است" }, 400)
  }

  const formData = await req.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return json({ error: "فایلی ارسال نشده است" }, 400)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ error: `حجم فایل بیش از حد مجاز است (حداکثر ${MAX_SIZE_LABEL})` }, 413)
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  // verify the file content really matches its extension (no fake uploads)
  const kind = detectKind(buffer, ext)
  if (!kind) {
    return json({ error: "نوع فایل معتبر نیست یا با پسوند آن هم‌خوانی ندارد" }, 400)
  }

  const subdir = kind === "font" ? "fonts" : "uploads"
  // storageDir() resolves the project root from ANY start mode (dev, next
  // start, node .next/standalone/server.js) — the write side and the
  // /uploads|/fonts route handlers always agree on the same directory.
  const dir = storageDir(subdir)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  const url = `/${subdir}/${filename}`

  if (kind === "font") {
    return json({ url, type: "font", filename: file.name }, 201)
  }

  // images → generate webp thumbnail + read real dimensions
  // videos → transcode to browser-safe H.264 (if needed) + poster frame
  const { thumb, width, height } = await processMedia(filepath, kind, filename.replace(/\.[^.]+$/, ""))

  // if the DB write fails, don't leave an orphaned file behind
  let media
  try {
    media = await db.mediaFile.create({
      data: {
        url,
        type: kind === "video" ? "video" : "image",
        thumb,
        width,
        height,
        alt: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
        size: file.size,
        category: (formData.get("category") as string) || "عمومی",
      },
    })
  } catch {
    try { const { unlink } = await import("fs/promises"); await unlink(filepath) } catch { /* ignore */ }
    if (thumb) {
      try {
        const { unlink } = await import("fs/promises")
        await unlink(path.join(storageDir("uploads"), thumb.replace(/^\/uploads\//, "")))
      } catch { /* ignore */ }
    }
    return json({ error: "خطا در ثبت فایل — دوباره تلاش کنید" }, 500)
  }

  return json({ url, type: kind, thumb, mediaId: media.id }, 201)
}
