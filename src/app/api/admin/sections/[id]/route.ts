import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ title?: string; content?: string; image?: string | null; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.title !== undefined) data.title = body.title
  if (body?.content !== undefined) data.content = body.content
  if (body?.image !== undefined) data.image = body.image
  if (body?.order !== undefined) data.order = body.order
  const item = await db.bioSection.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.bioSection.delete({ where: { id } })
  return json({ ok: true })
}
