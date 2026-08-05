import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const MAX_SIZE = 12 * 1024 * 1024 // 12 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard

  const formData = await req.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return json({ error: "فایلی ارسال نشده است" }, 400)
  }
  if (file.size > MAX_SIZE) {
    return json({ error: "حجم فایل بیش از حد مجاز (۱۲ مگابایت)" }, 400)
  }
  if (!ALLOWED.includes(file.type)) {
    return json({ error: "نوع فایل پشتیبانی نمی‌شود" }, 400)
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase()
  const isVideo = file.type.startsWith("video/")
  const dir = path.join(process.cwd(), "public", "uploads")
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  const url = `/uploads/${filename}`
  return json({ url, type: isVideo ? "video" : "photo" }, 201)
}
