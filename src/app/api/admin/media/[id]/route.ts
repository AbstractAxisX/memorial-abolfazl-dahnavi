import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

// safely delete a file inside public/ (no path traversal)
async function safeDelete(publicUrl: string) {
  if (!publicUrl.startsWith("/") || publicUrl.includes("..")) return
  const rel = publicUrl.replace(/^\/+/, "")
  const target = path.join(process.cwd(), "public", rel)
  if (!target.startsWith(path.join(process.cwd(), "public"))) return
  try {
    await unlink(target)
  } catch {
    // already gone
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ title?: string; description?: string; alt?: string; category?: string }>(req)
  const data: Record<string, unknown> = {}
  if (body?.title !== undefined) data.title = body.title
  if (body?.description !== undefined) data.description = body.description
  if (body?.alt !== undefined) data.alt = body.alt
  if (body?.category !== undefined) data.category = body.category
  const item = await db.mediaFile.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const file = await db.mediaFile.findUnique({ where: { id } })
  if (file) {
    // delete the physical file AND its thumbnail
    await safeDelete(file.url)
    if (file.thumb) await safeDelete(file.thumb)
    await db.mediaFile.delete({ where: { id } })
  }
  return json({ ok: true })
}
