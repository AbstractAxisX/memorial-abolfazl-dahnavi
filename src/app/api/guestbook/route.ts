import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit"

// GET approved guestbook messages
export async function GET() {
  const messages = await db.guestMessage.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return json({ messages })
}

// POST a new guestbook message (public — rate limited + honeypot)
export async function POST(req: Request) {
  // spam protection: 5 messages / hour / IP
  const rl = rateLimit(`guestbook:${clientIp(req)}`, 5, 60 * 60 * 1000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await parseJson<{ name?: string; text?: string; website?: string }>(req)

  // honeypot — real users never see this field
  if (body?.website) return json({ error: "درخواست نامعتبر" }, 400)

  const name = (body?.name ?? "").trim().slice(0, 60)
  const text = (body?.text ?? "").trim().slice(0, 800)
  if (!name || !text) return json({ error: "نام و متن پیام الزامی است" }, 400)
  if (name.length < 2 || text.length < 3) return json({ error: "نام یا پیام بسیار کوتاه است" }, 400)

  const msg = await db.guestMessage.create({ data: { name, text, approved: true } })
  return json({ message: msg }, 201)
}
