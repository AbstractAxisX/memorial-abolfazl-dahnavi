import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const MAX_SIZE = 25 * 1024 * 1024 // 25 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime", "font/ttf", "font/otf", "application/font-ttf", "application/x-font-ttf", "application/octet-stream"]

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

  const name = file.name.toLowerCase()
  const isFont = name.endsWith(".ttf") || name.endsWith(".otf") || file.type.includes("font")
  const isVideo = file.type.startsWith("video/") || name.match(/\.(mp4|webm|mov)$/)
  const isImage = file.type.startsWith("image/") || name.match(/\.(jpg|jpeg|png|webp|gif)$/)

  if (!isFont && !ALLOWED.includes(file.type) && !isImage && !isVideo) {
    return json({ error: "نوع فایل پشتیبانی نمی‌شود" }, 400)
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase()
  const subdir = isFont ? "fonts" : "uploads"
  const dir = path.join(process.cwd(), "public", subdir)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  const url = `/${subdir}/${filename}`
  const type = isFont ? "font" : isVideo ? "video" : "image"

  if (type === "font") {
    // don't create a MediaFile for fonts — handled by FontFile model
    return json({ url, type, filename: file.name }, 201)
  }

  // Register in the media library
  const media = await db.mediaFile.create({
    data: {
      url,
      type: type === "video" ? "video" : "image",
      alt: file.name.replace(/\.[^.]+$/, ""),
      size: file.size,
    },
  })

  return json({ url, type, mediaId: media.id }, 201)
}
