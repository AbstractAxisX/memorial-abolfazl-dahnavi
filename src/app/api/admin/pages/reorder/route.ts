import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

// Reorder pages: body = { order: [slug, slug, ...] }
export async function PUT(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ order?: string[] }>(req)
  if (!body?.order) return json({ error: "order الزامی است" }, 400)
  await Promise.all(body.order.map((slug, i) => db.page.update({ where: { slug }, data: { order: i } })))
  return json({ ok: true })
}
