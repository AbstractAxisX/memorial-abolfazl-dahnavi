import { db } from "@/lib/db"
import { json } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard
  const items = await db.guestMessage.findMany({ orderBy: { createdAt: "desc" } })
  return json({ items })
}
