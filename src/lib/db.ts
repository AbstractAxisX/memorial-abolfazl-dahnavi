import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

/**
 * Bulletproof SQLite URL resolution.
 *
 * DATABASE_URL can arrive in three states, and all of them must work on ANY
 * machine (sandbox, user's Windows laptop, CI):
 *   1. Relative file path (`file:../db/custom.db`) → keep it; Prisma resolves
 *      it relative to prisma/schema.prisma, which is portable.
 *   2. Absolute file path that EXISTS on this machine → keep it (explicit config).
 *   3. Absolute file path that does NOT exist (e.g. a stale sandbox path
 *      `file:/home/z/my-project/db/custom.db` baked into a cloned .env) →
 *      fall back to <project root>/db/custom.db, which is where this repo
 *      keeps the database. Without this, a clone would silently open a
 *      foreign/empty database and the site would render `setting: null`.
 */
function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL?.trim()
  if (raw && !raw.startsWith('file:')) return raw
  if (raw) {
    const p = raw.slice('file:'.length)
    if (!path.isAbsolute(p)) return raw
    try {
      if (fs.existsSync(p)) return raw
    } catch {
      /* fall through to project-relative fallback */
    }
    // Stale absolute path from another machine → use the repo's own db.
    const fallback = path.resolve(process.cwd(), 'db', 'custom.db')
    try {
      if (fs.existsSync(fallback)) return 'file:' + fallback
    } catch {
      /* fall through */
    }
    return raw
  }
  // No DATABASE_URL at all → repo convention.
  return 'file:' + path.resolve(process.cwd(), 'db', 'custom.db')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: { db: { url: resolveDbUrl() } },
  })

// Always cache on globalThis — in production too! Without this, each request
// creates a new PrismaClient instance, causing memory leaks and crashes.
globalForPrisma.prisma = db
