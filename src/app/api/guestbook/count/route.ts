import { db } from "@/lib/db"
import { json } from "@/lib/api"

export async function GET() {
  const count = await db.guestMessage.count({ where: { approved: true } })
  return json({ count })
}
