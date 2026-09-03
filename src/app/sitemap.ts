import type { MetadataRoute } from "next"
import { fetchSiteData, siteBaseUrl } from "@/lib/site-data"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await fetchSiteData()
  const base = siteBaseUrl(data.setting)
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ]

  // CMS pages (skip home — already added)
  for (const page of data.pages) {
    if (page.isHome) continue
    entries.push({
      url: `${base}/p/${page.slug}`,
      lastModified: page.sections.length
        ? page.sections.map((s) => new Date(s.createdAt)).sort((a, b) => b.getTime() - a.getTime())[0] || now
        : now,
      changeFrequency: "monthly",
      priority: page.slug === "blog" ? 0.8 : 0.7,
    })
  }

  // blog posts
  for (const post of data.blogPosts) {
    entries.push({
      url: `${base}/blog/${post.id}`,
      lastModified: new Date(post.publishedAt || post.createdAt),
      changeFrequency: "yearly",
      priority: 0.6,
    })
  }

  // gallery media → Google Images (image sitemap extension)
  const galleryPage = entries.find((e) => e.url === `${base}/p/gallery`) ?? entries[0]
  for (const m of data.media) {
    if (m.type === "video") {
      entries.push({
        url: galleryPage.url,
        lastModified: new Date(m.createdAt),
        videos: [{
          contentUrl: `${base}${m.url}`,
          thumbnailUrl: m.thumb ? `${base}${m.thumb}` : undefined,
        }],
      })
    } else {
      entries.push({
        url: galleryPage.url,
        lastModified: new Date(m.createdAt),
        images: [
          {
            loc: `${base}${m.url}`,
            ...(m.title || m.alt ? { title: m.title || m.alt! } : {}),
          },
        ],
      })
    }
  }

  return entries
}
