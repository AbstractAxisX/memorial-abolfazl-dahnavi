import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ type?: string; url?: string; thumb?: string; caption?: string; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.type !== undefined) data.type = body.type
  if (body?.url !== undefined) data.url = body.url
  if (body?.thumb !== undefined) data.thumb = body.thumb
  if (body?.caption !== undefined) data.caption = body.caption
  if (body?.order !== undefined) data.order = body.order
  const item = await db.galleryItem.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.galleryItem.delete({ where: { id } })
  return json({ ok: true })
}
