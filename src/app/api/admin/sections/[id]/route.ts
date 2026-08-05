import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ type?: string; title?: string | null; subtitle?: string | null; config?: Record<string, unknown> | string; fontKey?: string | null; background?: string; visible?: boolean; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.type !== undefined) data.type = body.type
  if (body?.title !== undefined) data.title = body.title
  if (body?.subtitle !== undefined) data.subtitle = body.subtitle
  if (body?.config !== undefined) {
    data.config = typeof body.config === "string" ? body.config : JSON.stringify(body.config)
  }
  if (body?.fontKey !== undefined) data.fontKey = body.fontKey
  if (body?.background !== undefined) data.background = body.background
  if (body?.visible !== undefined) data.visible = body.visible
  if (body?.order !== undefined) data.order = body.order
  const item = await db.section.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.section.delete({ where: { id } })
  return json({ ok: true })
}
