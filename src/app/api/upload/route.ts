import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const MAX_SIZE = 25 * 1024 * 1024

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
  const isFont = name.endsWith(".ttf") || name.endsWith(".otf")
  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/.test(name)
  const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/.test(name)

  if (!isFont && !isImage && !isVideo) {
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
    return json({ url, type, filename: file.name }, 201)
  }

  const media = await db.mediaFile.create({
    data: {
      url,
      type: type === "video" ? "video" : "image",
      alt: file.name.replace(/\.[^.]+$/, ""),
      size: file.size,
      category: (formData.get("category") as string) || "عمومی",
    },
  })

  return json({ url, type, mediaId: media.id }, 201)
}
