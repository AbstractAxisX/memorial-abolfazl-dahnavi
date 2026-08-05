import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

// Register an uploaded file into the media library (with editable metadata)
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ url: string; title?: string; description?: string; alt?: string }>(req)
  if (!body?.url) return json({ error: "آدرس الزامی است" }, 400)
  const type = body.url.match(/\.(mp4|webm|mov)$/i) ? "video" : "image"
  // upsert so re-registering same url just updates
  const item = await db.mediaFile.upsert({
    where: { url: body.url },
    update: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      alt: body.alt ?? undefined,
    },
    create: {
      url: body.url,
      type,
      title: body.title ?? null,
      description: body.description ?? null,
      alt: body.alt ?? null,
    },
  })
  return json({ item }, 201)
}
