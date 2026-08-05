import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { slug } = await params
  const body = await parseJson<{ title?: string; subtitle?: string; navIcon?: string; showInNav?: boolean; isHome?: boolean; slug?: string }>(req)
  const data: Record<string, unknown> = {}
  if (body?.title !== undefined) data.title = body.title
  if (body?.subtitle !== undefined) data.subtitle = body.subtitle
  if (body?.navIcon !== undefined) data.navIcon = body.navIcon
  if (body?.showInNav !== undefined) data.showInNav = body.showInNav
  if (body?.slug && body.slug !== slug) data.slug = body.slug
  if (body?.isHome !== undefined) {
    if (body.isHome) {
      await db.page.updateMany({ where: { isHome: true }, data: { isHome: false } })
    }
    data.isHome = body.isHome
  }
  try {
    const item = await db.page.update({ where: { slug }, data })
    return json({ item })
  } catch {
    return json({ error: "به‌روزرسانی ناموفق بود (شاید slug تکراری باشد)" }, 400)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { slug } = await params
  const page = await db.page.findUnique({ where: { slug } })
  if (page?.isHome) return json({ error: "صفحه خانه قابل حذف نیست" }, 400)
  await db.page.delete({ where: { slug } })
  return json({ ok: true })
}
