import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ text?: string; author?: string; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.text !== undefined) data.text = body.text
  if (body?.author !== undefined) data.author = body.author
  if (body?.order !== undefined) data.order = body.order
  const item = await db.quote.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.quote.delete({ where: { id } })
  return json({ ok: true })
}
