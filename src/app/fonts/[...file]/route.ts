import { serveStorageFile } from "@/lib/serve-storage"

/**
 * Serves runtime-installed fonts (uploaded via the admin panel) from disk
 * when the static file server can't (files written after the build).
 * Committed fonts keep the fast static path.
 */

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request, ctx: { params: Promise<{ file: string[] }> }): Promise<Response> {
  const { file } = await ctx.params
  return serveStorageFile("fonts", file, req.headers.get("range"))
}
