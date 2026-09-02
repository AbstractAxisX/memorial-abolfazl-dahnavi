import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import sharp from "sharp"

const MAX_SIZE = 25 * 1024 * 1024

// ---------- real file-type detection (magic bytes) ----------

type FileKind = "font" | "image" | "video" | null

function detectKind(buf: Buffer, ext: string): FileKind {
  if (buf.length < 12) return null
  // images
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ext === "jpg" || ext === "jpeg" ? "image" : null
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ext === "png" ? "image" : null
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return ext === "gif" ? "image" : null
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) return ext === "webp" ? "image" : null
  // videos (mp4/mov: ....ftyp)
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") return ["mp4", "mov", "webm"].includes(ext) ? "video" : null
  // webm (mkv family starts with 0x1A45DFA3)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return ext === "webm" ? "video" : null
  // fonts
  const ttfMagic = buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00
  const otfMagic = buf.subarray(0, 4).toString("ascii") === "OTTO"
  const ttcf = buf.subarray(0, 4).toString("ascii") === "ttcf"
  if (ttfMagic || otfMagic || ttcf) return ext === "ttf" || ext === "otf" ? "font" : null
  return null
}

async function makeThumb(srcPath: string, destPath: string): Promise<{ w: number; h: number } | null> {
  try {
    const meta = await sharp(srcPath).rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(destPath)
    return { w: meta.width ?? 480, h: meta.height ?? 480 }
  } catch {
    return null
  }
}

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
  if (file.size > MAX_SIZE) {
    return json({ error: "حجم فایل بیش از حد مجاز (۲۵ مگابایت)" }, 400)
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  // verify the file content really matches its extension (no fake uploads)
  const kind = detectKind(buffer, ext)
  if (!kind) {
    return json({ error: "نوع فایل معتبر نیست یا با پسوند آن هم‌خوانی ندارد" }, 400)
  }

  const subdir = kind === "font" ? "fonts" : "uploads"
  const dir = path.join(process.cwd(), "public", subdir)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  const url = `/${subdir}/${filename}`

  if (kind === "font") {
    return json({ url, type: "font", filename: file.name }, 201)
  }

  // images → generate webp thumbnail + read real dimensions
  let thumb: string | null = null
  let width: number | null = null
  let height: number | null = null
  if (kind === "image") {
    try {
      const meta = await sharp(filepath).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
    } catch { /* ignore */ }
    const thumbsDir = path.join(process.cwd(), "public", "uploads", "thumbs")
    await mkdir(thumbsDir, { recursive: true })
    const thumbPath = path.join(thumbsDir, filename.replace(/\.[^.]+$/, "") + ".webp")
    if (await makeThumb(filepath, thumbPath)) {
      thumb = `/uploads/thumbs/${filename.replace(/\.[^.]+$/, "")}.webp`
    }
  }

  const media = await db.mediaFile.create({
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

  return json({ url, type: kind, thumb, mediaId: media.id }, 201)
}
