import type { MetadataRoute } from "next"
import { siteBaseUrl } from "@/lib/site-data"

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl(null)
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
