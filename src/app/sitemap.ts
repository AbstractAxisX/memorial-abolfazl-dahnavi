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

  return entries
}
