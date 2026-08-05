import { db } from "@/lib/db"
import { json } from "@/lib/api"

export const dynamic = "force-dynamic"

// GET all public content for the memorial site
export async function GET() {
  const [setting, bioSections, gallery, timeline, quotes, messages] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: "main" } }),
    db.bioSection.findMany({ orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ orderBy: { order: "asc" } }),
    db.timelineEvent.findMany({ orderBy: { order: "asc" } }),
    db.quote.findMany({ orderBy: { order: "asc" } }),
    db.guestMessage.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ])

  return json({
    setting,
    bioSections,
    gallery,
    timeline,
    quotes,
    messages,
  })
}
