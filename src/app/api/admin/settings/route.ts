import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<Record<string, unknown>>(req)
  if (!body) return json({ error: "بدنه نامعتبر" }, 400)

  const data: Record<string, unknown> = {}
  const allowed = [
    "fullName",
    "displayTitle",
    "subtitle",
    "birthDate",
    "martyrdomDate",
    "martyrdomPlace",
    "role",
    "heroImage",
    "heroIntro",
    "publicUrl",
    "adminPassword",
  ]
  for (const k of allowed) {
    if (k in body) data[k] = body[k]
  }
  const updated = await db.siteSetting.upsert({
    where: { id: "main" },
    update: data,
    create: {
      id: "main",
      displayTitle: (data.displayTitle as string) ?? "شهید ابوالفضل دهنوی",
      fullName: (data.fullName as string) ?? "ابوالفضل دهنوی",
      subtitle: (data.subtitle as string) ?? "امدادگر یکم جمعیت هلال احمر",
      martyrdomDate: (data.martyrdomDate as string) ?? "۱۵ فروردین ۱۴۰۵",
      martyrdomPlace: (data.martyrdomPlace as string) ?? "شهرستان مبارکه، اصفهان",
      role: (data.role as string) ?? "امدادگر یکم جمعیت هلال احمر",
      adminPassword: (data.adminPassword as string) ?? "abolfazl1405",
      heroIntro: (data.heroIntro as string) ?? "",
    },
  })
  return json({ setting: updated })
}
