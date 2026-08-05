import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ text?: string; author?: string; order?: number }>(req)
  const text = (body?.text ?? "").trim()
  if (!text) return json({ error: "متن نقل قول الزامی است" }, 400)
  const maxOrder = await db.quote.count()
  const item = await db.quote.create({
    data: {
      text,
      author: body?.author ?? null,
      order: body?.order ?? maxOrder,
    },
  })
  return json({ item }, 201)
}
