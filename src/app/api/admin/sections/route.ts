import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard
  const items = await db.bioSection.findMany({ orderBy: { order: "asc" } })
  return json({ items })
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ title?: string; content?: string; image?: string | null; order?: number }>(req)
  const title = (body?.title ?? "").trim()
  const content = (body?.content ?? "").trim()
  if (!title) return json({ error: "عنوان الزامی است" }, 400)
  const maxOrder = await db.bioSection.count()
  const item = await db.bioSection.create({
    data: {
      title,
      content,
      image: body?.image ?? null,
      order: body?.order ?? maxOrder,
    },
  })
  return json({ item }, 201)
}
