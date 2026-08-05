import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "").slice(0, 60)
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard
  const body = await parseJson<{ title?: string; excerpt?: string; content?: string; coverImage?: string | null; videoUrl?: string | null; tags?: string; featured?: boolean; publishedAt?: string }>(req)
  const title = (body?.title ?? "").trim()
  const content = (body?.content ?? "").trim()
  if (!title || !content) return json({ error: "عنوان و متن الزامی است" }, 400)
  const maxOrder = await db.blogPost.count()
  const item = await db.blogPost.create({
    data: {
      title,
      excerpt: body?.excerpt ?? null,
      content,
      coverImage: body?.coverImage ?? null,
      videoUrl: body?.videoUrl ?? null,
      tags: body?.tags ?? null,
      featured: body?.featured ?? false,
      publishedAt: body?.publishedAt ?? new Date().toISOString(),
      order: maxOrder,
    },
  })
  return json({ item }, 201)
}
