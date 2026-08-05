import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"

// GET approved guestbook messages
export async function GET() {
  const messages = await db.guestMessage.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return json({ messages })
}

// POST a new guestbook message (public, auto-approved by default but admin can moderate)
export async function POST(req: Request) {
  const body = await parseJson<{ name?: string; text?: string }>(req)
  const name = (body?.name ?? "").trim().slice(0, 60)
  const text = (body?.text ?? "").trim().slice(0, 800)
  if (!name || !text) return json({ error: "نام و متن پیام الزامی است" }, 400)
  const msg = await db.guestMessage.create({
    data: { name, text, approved: true },
  })
  return json({ message: msg }, 201)
}
