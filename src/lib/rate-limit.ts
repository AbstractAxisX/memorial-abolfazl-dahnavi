// Simple in-memory sliding-window rate limiter (per process — perfect for single-instance deployments)

type Bucket = { count: number; reset: number }

const buckets = new Map<string, Bucket>()

// lazy cleanup — keep the map small
let lastSweep = Date.now()
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k)
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  sweep(now)
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  b.count++
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) }
  }
  return { ok: true, retryAfter: 0 }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "local"
}

export function tooMany(retryAfter: number): Response {
  return Response.json(
    { error: `درخواست‌های بیش از حد. ${Math.max(retryAfter, 1)} ثانیه دیگر تلاش کنید.` },
    { status: 429, headers: { "Retry-After": String(Math.max(retryAfter, 1)) } }
  )
}
