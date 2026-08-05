import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ pageId?: string; type?: string; title?: string; subtitle?: string; config?: Record<string, unknown>; fontKey?: string | null; background?: string }>(req)
  const pageId = (body?.pageId ?? "").trim()
  const type = (body?.type ?? "text").trim()
  if (!pageId) return json({ error: "صفحه مقصد الزامی است" }, 400)
  const maxOrder = await db.section.count({ where: { pageId } })
  const item = await db.section.create({
    data: {
      pageId,
      type,
      title: body?.title ?? null,
      subtitle: body?.subtitle ?? null,
      config: JSON.stringify(body?.config ?? {}),
      fontKey: body?.fontKey ?? null,
      background: body?.background ?? "default",
      order: maxOrder,
    },
  })
  return json({ item }, 201)
}
