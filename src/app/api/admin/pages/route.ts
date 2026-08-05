import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "").slice(0, 50)
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard
  const items = await db.page.findMany({ orderBy: { order: "asc" }, include: { sections: { orderBy: { order: "asc" } } } })
  return json({ items })
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ slug?: string; title?: string; subtitle?: string; navIcon?: string; showInNav?: boolean }>(req)
  const title = (body?.title ?? "").trim()
  const slug = (body?.slug?.trim() || slugify(title) || "page").trim()
  if (!title) return json({ error: "عنوان الزامی است" }, 400)
  const exists = await db.page.findUnique({ where: { slug } })
  if (exists) return json({ error: "این شناسه (slug) قبلاً استفاده شده" }, 400)
  const maxOrder = await db.page.count()
  const item = await db.page.create({
    data: {
      slug,
      title,
      subtitle: body?.subtitle ?? null,
      navIcon: body?.navIcon ?? "FileText",
      showInNav: body?.showInNav ?? true,
      order: maxOrder,
    },
  })
  return json({ item }, 201)
}
