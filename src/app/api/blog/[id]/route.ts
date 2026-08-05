import { db } from "@/lib/db"
import { json } from "@/lib/api"

// Public: get a single blog post by id
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) return json({ error: "یافت نشد" }, 404)
  return json({ post })
}
