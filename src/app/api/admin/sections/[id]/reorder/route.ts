import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

// Reorder sections within a page: body = { order: [id, id, ...] }
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  await params
  const body = await parseJson<{ order?: string[] }>(req)
  if (!body?.order) return json({ error: "order الزامی است" }, 400)
  await Promise.all(body.order.map((id, i) => db.section.update({ where: { id }, data: { order: i } })))
  return json({ ok: true })
}
