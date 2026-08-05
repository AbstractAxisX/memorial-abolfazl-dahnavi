import { db } from "@/lib/db"
import { json } from "@/lib/api"

export const dynamic = "force-dynamic"

// GET the full site tree: settings + pages (with sections) + blog posts + guest messages + custom fonts
export async function GET() {
  const [setting, pages, blogPosts, messages, fonts] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: "main" } }),
    db.page.findMany({
      orderBy: { order: "asc" },
      include: { sections: { orderBy: { order: "asc" } } },
    }),
    db.blogPost.findMany({ orderBy: { order: "asc" } }),
    db.guestMessage.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.fontFile.findMany(),
  ])

  return json({
    setting,
    pages,
    blogPosts,
    messages,
    fonts,
  })
}
