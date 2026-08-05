import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ date?: string; title?: string; description?: string; icon?: string; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.date !== undefined) data.date = body.date
  if (body?.title !== undefined) data.title = body.title
  if (body?.description !== undefined) data.description = body.description
  if (body?.icon !== undefined) data.icon = body.icon
  if (body?.order !== undefined) data.order = body.order
  const item = await db.timelineEvent.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.timelineEvent.delete({ where: { id } })
  return json({ ok: true })
}
