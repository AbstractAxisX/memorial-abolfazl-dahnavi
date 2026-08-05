import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

// GET all media files + categories (admin only)
export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard
  const items = await db.mediaFile.findMany({ orderBy: { createdAt: "desc" } })
  // derive categories from items
  const cats = [...new Set(items.map((i) => i.category || "عمومی"))]
  return json({ items, categories: cats })
}

// Register an uploaded file into the media library (with editable metadata)
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ url: string; title?: string; description?: string; alt?: string; category?: string }>(req)
  if (!body?.url) return json({ error: "آدرس الزامی است" }, 400)
  const type = body.url.match(/\.(mp4|webm|mov)$/i) ? "video" : "image"
  const item = await db.mediaFile.upsert({
    where: { url: body.url },
    update: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      alt: body.alt ?? undefined,
      category: body.category ?? undefined,
    },
    create: {
      url: body.url,
      type,
      title: body.title ?? null,
      description: body.description ?? null,
      alt: body.alt ?? null,
      category: body.category ?? "عمومی",
    },
  })
  return json({ item }, 201)
}
