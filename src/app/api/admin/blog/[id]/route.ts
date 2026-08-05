import { db } from "@/lib/db"
import { json, parseJson } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const body = await parseJson<{ title?: string; excerpt?: string; content?: string; coverImage?: string | null; videoUrl?: string | null; tags?: string; featured?: boolean; publishedAt?: string; order?: number }>(req)
  const data: Record<string, unknown> = {}
  if (body?.title !== undefined) data.title = body.title
  if (body?.excerpt !== undefined) data.excerpt = body.excerpt
  if (body?.content !== undefined) data.content = body.content
  if (body?.coverImage !== undefined) data.coverImage = body.coverImage
  if (body?.videoUrl !== undefined) data.videoUrl = body.videoUrl
  if (body?.tags !== undefined) data.tags = body.tags
  if (body?.featured !== undefined) data.featured = body.featured
  if (body?.publishedAt !== undefined) data.publishedAt = body.publishedAt
  if (body?.order !== undefined) data.order = body.order
  const item = await db.blogPost.update({ where: { id }, data })
  return json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  await db.blogPost.delete({ where: { id } })
  return json({ ok: true })
}
