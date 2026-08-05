import { createHash } from "crypto"
import { cookies } from "next/headers"
import { db } from "./db"

const SECRET = process.env.ADMIN_SECRET || "memorial-secret-abolfazl-1405"
const COOKIE_NAME = "memorial_admin"

function tokenFor(password: string) {
  return createHash("sha256").update(`${password}:${SECRET}`).digest("hex")
}

export async function login(password: string): Promise<boolean> {
  const setting = await db.siteSetting.findUnique({ where: { id: "main" } })
  const expected = setting?.adminPassword ?? ""
  if (!expected || password !== expected) return false
  const token = tokenFor(expected)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
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
    const expected = setting?.adminPassword
    if (!expected) return false
    return token === tokenFor(expected)
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
