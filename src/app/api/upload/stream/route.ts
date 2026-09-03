import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { storageDir } from "@/lib/storage"
import { detectKind, processMedia, MAX_UPLOAD_BYTES, MAX_SIZE_LABEL } from "@/lib/media-process"
import { createWriteStream } from "fs"
import { mkdir, open, unlink, rename } from "fs/promises"
import { Readable, Transform } from "stream"
import { pipeline } from "stream/promises"
import path from "path"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Raw-body streaming upload endpoint (memory-flat: the file is piped
 * straight to disk, never buffered in RAM) — used by the upload-center
 * for large 200MB videos on small servers.
 *
 * POST the file as the raw request body with query params:
 *   ?name=<filename>&size=<bytes>&category=<optional>
 *
 * Response JSON matches /api/upload: { url, type, thumb, mediaId }.
 */

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard

  const q = new URL(req.url).searchParams
  const name = q.get("name") || "file"
  const category = q.get("category") || "عمومی"
  const declaredSize = Number(q.get("size") || "0")
  if (declaredSize > MAX_UPLOAD_BYTES) {
    return json({ error: `حجم فایل بیش از حد مجاز است (حداکثر ${MAX_SIZE_LABEL})` }, 413)
  }
  if (!req.body) return json({ error: "بدنه درخواست خالی است" }, 400)

  const ext = (name.split(".").pop() || "").toLowerCase()
  const tmpPath = path.join(storageDir("uploads"), `${randomUUID()}.part`)
  await mkdir(path.dirname(tmpPath), { recursive: true })

  // stream to disk while enforcing the size cap (flat memory usage)
  let size = 0
  let tooLarge = false
  const source = Readable.fromWeb(req.body as unknown as import("stream/web").ReadableStream)
  const counter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      size += chunk.length
      if (size > MAX_UPLOAD_BYTES) {
        tooLarge = true
        cb(new Error("TOO_LARGE"))
        return
      }
      cb(null, chunk)
    },
  })
  const out = createWriteStream(tmpPath)
  try {
    await pipeline(source, counter, out)
  } catch {
    try {
      await unlink(tmpPath)
    } catch {
      /* ignore */
    }
    if (tooLarge) {
      return json({ error: `حجم فایل بیش از حد مجاز است (حداکثر ${MAX_SIZE_LABEL})` }, 413)
    }
    return json({ error: "خطا در دریافت فایل" }, 500)
  }

  // magic-byte check on the first bytes of the file now on disk
  let head: Buffer
  try {
    const handle = await open(tmpPath, "r")
    head = Buffer.alloc(16)
    await handle.read(head, 0, 16, 0)
    await handle.close()
  } catch {
    try {
      await unlink(tmpPath)
    } catch {
      /* ignore */
    }
    return json({ error: "فایل خوانا نیست" }, 400)
  }

  const kind = detectKind(head, ext)
  if (!kind) {
    try {
      await unlink(tmpPath)
    } catch {
      /* ignore */
    }
    return json({ error: "نوع فایل معتبر نیست یا با پسوند آن هم‌خوانی ندارد" }, 400)
  }

  const subdir = kind === "font" ? "fonts" : "uploads"
  const filename = `${randomUUID()}.${ext}`
  const finalPath = path.join(storageDir(subdir), filename)
  await rename(tmpPath, finalPath)
  const fileUrl = `/${subdir}/${filename}`

  if (kind === "font") {
    return json({ url: fileUrl, type: "font", filename: name }, 201)
  }

  // images → webp thumbnail + dimensions; videos → poster frame + dimensions
  const { thumb, width, height } = await processMedia(finalPath, kind, filename.replace(/\.[^.]+$/, ""))

  let media
  try {
    media = await db.mediaFile.create({
      data: {
        url: fileUrl,
        type: kind === "video" ? "video" : "image",
        thumb,
        width,
        height,
        alt: name.replace(/\.[^.]+$/, "").slice(0, 120),
        size,
        category,
      },
    })
  } catch {
    // don't leave an orphaned file behind
    try {
      await unlink(finalPath)
    } catch {
      /* ignore */
    }
    if (thumb) {
      try {
        await unlink(path.join(storageDir("uploads"), thumb.replace(/^\/uploads\//, "")))
      } catch {
        /* ignore */
      }
    }
    return json({ error: "خطا در ثبت فایل — دوباره تلاش کنید" }, 500)
  }

  return json({ url: fileUrl, type: kind, thumb, mediaId: media.id }, 201)
}
