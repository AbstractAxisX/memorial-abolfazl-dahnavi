import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ type?: string; url?: string; thumb?: string; caption?: string; order?: number }>(req)
  const url = (body?.url ?? "").trim()
  if (!url) return json({ error: "آدرس فایل الزامی است" }, 400)
  const type = body?.type === "video" ? "video" : "photo"
  const maxOrder = await db.galleryItem.count()
  const item = await db.galleryItem.create({
    data: {
      type,
      url,
      thumb: body?.thumb ?? null,
      caption: body?.caption ?? null,
      order: body?.order ?? maxOrder,
    },
  })
  return json({ item }, 201)
}
