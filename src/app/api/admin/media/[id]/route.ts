import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ title?: string; description?: string; alt?: string }>(req)
  const data: Record<string, unknown> = {}
  if (body?.title !== undefined) data.title = body.title
  if (body?.description !== undefined) data.description = body.description
  if (body?.alt !== undefined) data.alt = body.alt
  const item = await db.mediaFile.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const file = await db.mediaFile.findUnique({ where: { id } })
  if (file) {
    // delete the physical file too
    try {
      const rel = file.url.replace(/^\/+/, "")
      await unlink(path.join(process.cwd(), "public", rel))
    } catch {
      // ignore — maybe already gone
    }
    await db.mediaFile.delete({ where: { id } })
  }
  return json({ ok: true })
}
