import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ date?: string; title?: string; description?: string; icon?: string; order?: number }>(req)
  const title = (body?.title ?? "").trim()
  const date = (body?.date ?? "").trim()
  if (!title) return json({ error: "عنوان الزامی است" }, 400)
  const maxOrder = await db.timelineEvent.count()
  const item = await db.timelineEvent.create({
    data: {
      title,
      date,
      description: body?.description ?? null,
      icon: body?.icon ?? "Sparkles",
      order: body?.order ?? maxOrder,
    },
  })
  return json({ item }, 201)
}
