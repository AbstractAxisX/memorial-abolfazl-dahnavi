import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ approved?: boolean }>(req)
  const data: Record<string, unknown> = {}
  if (body?.approved !== undefined) data.approved = body.approved
  const item = await db.guestMessage.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.guestMessage.delete({ where: { id } })
  return json({ ok: true })
}
