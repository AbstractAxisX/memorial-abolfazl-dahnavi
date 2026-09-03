import { serveStorageFile } from "@/lib/serve-storage"

/**
 * Serves runtime-uploaded media (images/videos/thumbnails) from disk when
 * the static file server can't (files written after the build).
 * Full Range support → video streaming/seeking works.
 */

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request, ctx: { params: Promise<{ file: string[] }> }): Promise<Response> {
  const { file } = await ctx.params
  return serveStorageFile("uploads", file, req.headers.get("range"))
}
