import { login, logout, isAdmin } from "@/lib/auth"
import { json, parseJson } from "@/lib/api"
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit"

export async function GET() {
  return json({ isAdmin: await isAdmin() })
}

export async function POST(req: Request) {
  // brute-force protection: 7 attempts / 15 min / IP
  const rl = rateLimit(`auth:${clientIp(req)}`, 7, 15 * 60 * 1000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await parseJson<{ password?: string }>(req)
  if (!body?.password) return json({ error: "رمز عبور الزامی است" }, 400)
  const ok = await login(body.password)
  if (!ok) return json({ error: "رمز عبور نادرست است" }, 401)
  return json({ ok: true })
}

export async function DELETE() {
  await logout()
  return json({ ok: true })
}
