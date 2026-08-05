import { db } from "@/lib/db"
import { json } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const font = await db.fontFile.findUnique({ where: { id } })
  if (font) {
    try {
      const rel = font.url.replace(/^\/+/, "")
      await unlink(path.join(process.cwd(), "public", rel))
    } catch {
      // ignore
    }
    await db.fontFile.delete({ where: { id } })
  }
  return json({ ok: true })
}
