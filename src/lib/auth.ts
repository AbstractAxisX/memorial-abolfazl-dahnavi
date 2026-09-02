import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { db } from "./db"

const SECRET = process.env.ADMIN_SECRET || "memorial-abolfazl-dahnavi-2026-secret"
const COOKIE_NAME = "memorial_admin"
const MAX_AGE = 60 * 60 * 24 * 7 // 1 week

// ---------- password hashing (scrypt: scheme:salt:hash) ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(":")
    if (scheme !== "scrypt" || !salt || !hash) return false
    const candidate = scryptSync(password, salt, 64)
    const expected = Buffer.from(hash, "hex")
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

// ---------- session token: HMAC of the password hash ----------
// Deterministic → survives restarts, auto-invalidates when the password changes.

function tokenFor(passwordHash: string): string {
  return createHmac("sha256", SECRET).update(passwordHash).digest("hex")
}

export async function login(password: string): Promise<boolean> {
  const setting = await db.siteSetting.findUnique({ where: { id: "main" } })
  if (!setting) return false

  let passwordHash = setting.adminPasswordHash ?? ""
  let ok = false

  if (passwordHash) {
    ok = verifyPassword(password, passwordHash)
  } else if (setting.adminPassword && setting.adminPassword === password) {
    // legacy plaintext → transparently upgrade to scrypt hash
    passwordHash = hashPassword(password)
    await db.siteSetting.update({
      where: { id: "main" },
      data: { adminPasswordHash: passwordHash, adminPassword: "" },
    })
    ok = true
  }

  if (!ok) return false

  const store = await cookies()
  store.set(COOKIE_NAME, tokenFor(passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  })
  return true
}

export async function logout() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAdmin(): Promise<boolean> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return false
    const setting = await db.siteSetting.findUnique({ where: { id: "main" } })
    const passwordHash = setting?.adminPasswordHash
    if (!passwordHash) return false
    const expected = tokenFor(passwordHash)
    const a = Buffer.from(token)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function requireAdmin() {
  const ok = await isAdmin()
  if (!ok) {
    return Response.json({ error: "غیرمجاز" }, { status: 401 })
  }
  return null
}
