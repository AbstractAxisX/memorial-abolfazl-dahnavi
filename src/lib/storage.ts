import fs from "fs"
import path from "path"

/**
 * Resolves the project root no matter HOW the server was started:
 *   - `next dev` / `next start` from the project root  → cwd is the root
 *   - `node .next/standalone/server.js` from the root  → cwd is the root
 *   - `cd .next/standalone && node server.js`          → cwd is .next/standalone
 *   - any nested cwd                                   → walk up
 *
 * The marker is prisma/schema.prisma, which exists at the repo root and
 * nowhere else. Falls back to cwd when nothing matches.
 */
let cachedRoot: string | null = null

export function projectRoot(): string {
  if (cachedRoot) return cachedRoot
  const candidates: string[] = [process.cwd()]
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    candidates.push(parent)
    dir = parent
  }
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(c, "prisma", "schema.prisma"))) {
        cachedRoot = c
        return c
      }
    } catch {
      /* keep searching */
    }
  }
  cachedRoot = process.cwd()
  return cachedRoot
}

/**
 * Storage directory for runtime-written files ("uploads" | "fonts").
 * Writes ALWAYS go through this so the write side and the read side
 * (the /uploads/[...file] and /fonts/[...file] route handlers) agree,
 * on every machine and every start mode.
 */
export function storageDir(subdir: "uploads" | "fonts"): string {
  return path.join(projectRoot(), "public", subdir)
}
