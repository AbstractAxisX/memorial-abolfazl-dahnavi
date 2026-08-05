import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

// GET all custom fonts (public — site needs them to render)
export async function GET() {
  const items = await db.fontFile.findMany({ orderBy: { createdAt: "desc" } })
  return json({ items })
}

// POST — register a font (after upload returns url)
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ name?: string; label?: string; url?: string }>(req)
  const name = (body?.name ?? "").trim().replace(/\s+/g, "")
  const label = (body?.label ?? "").trim()
  const url = (body?.url ?? "").trim()
  if (!name || !label || !url) return json({ error: "نام، برچسب و فایل الزامی است" }, 400)
  if (!name.match(/^[a-zA-Z0-9_-]+$/)) return json({ error: "نام فنی فونت فقط انگلیسی و بدون فاصله" }, 400)
  const existing = await db.fontFile.findUnique({ where: { name } })
  if (existing) return json({ error: "این نام قبلاً استفاده شده" }, 400)
  const item = await db.fontFile.create({ data: { name, label, url } })
  return json({ item }, 201)
}
