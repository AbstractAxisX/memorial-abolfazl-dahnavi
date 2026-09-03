// Server-side JSON-LD structured data (Schema.org) — helps Google build rich results.
import type { SiteSetting, BlogPost } from "@/lib/types"

function safe(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe(data) }} />
}

export function PersonJsonLd({ setting, baseUrl }: { setting: SiteSetting | null; baseUrl: string }) {
  if (!setting) return null
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${baseUrl}/#person`,
        name: setting.fullName || "ابوالفضل دهنوی",
        honorificPrefix: "شهید",
        givenName: "ابوالفضل",
        familyName: "دهنوی",
        jobTitle: "امدادگر یکم",
        description: setting.heroIntro || undefined,
        url: baseUrl,
        nationality: { "@type": "Country", name: "Iran" },
        affiliation: {
          "@type": "Organization",
          name: "جمعیت هلال احمر جمهوری اسلامی ایران",
          alternateName: "Iranian Red Crescent Society",
        },
        deathDate: "2026-04-04", // ۱۵ فروردین ۱۴۰۵
        deathPlace: {
          "@type": "Place",
          name: "شهرستان مبارکه، اصفهان، ایران",
          address: { "@type": "PostalAddress", addressRegion: "اصفهان", addressCountry: "IR" },
        },
        image: setting.heroImage ? `${baseUrl}${setting.heroImage}` : `${baseUrl}/opengraph-image`,
      }}
    />
  )
}

export function WebSiteJsonLd({ baseUrl }: { baseUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "یادبود جاودان شهید ابوالفضل دهنوی",
        inLanguage: "fa-IR",
        publisher: { "@id": `${baseUrl}/#person` },
      }}
    />
  )
}

export function BreadcrumbJsonLd({ items, baseUrl }: { items: { name: string; url: string }[]; baseUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${baseUrl}${it.url}`,
        })),
      }}
    />
  )
}

export function BlogPostingJsonLd({ post, baseUrl }: { post: BlogPost; baseUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || post.content.replace(/\s+/g, " ").slice(0, 200),
        inLanguage: "fa-IR",
        mainEntityOfPage: `${baseUrl}/blog/${post.id}`,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.createdAt,
        image: post.coverImage ? `${baseUrl}${post.coverImage}` : `${baseUrl}/opengraph-image`,
        author: { "@type": "Organization", name: "یادبود شهید ابوالفضل دهنوی", url: baseUrl },
        publisher: { "@type": "Organization", name: "یادبود شهید ابوالفضل دهنوی", url: baseUrl },
      }}
    />
  )
}

/** Media gallery + videos → Google Images / Video rich results. */
export function MediaJsonLd({
  media,
  setting,
  baseUrl,
}: {
  media: { url: string; type: string; title?: string | null; alt?: string | null; thumb?: string | null; width?: number | null; height?: number | null; createdAt?: string | Date }[]
  setting: { fullName?: string | null; displayTitle?: string | null } | null
  baseUrl: string
}) {
  if (!media.length) return null
  const photos = media.filter((m) => m.type !== "video")
  const videos = media.filter((m) => m.type === "video")
  const graph: Record<string, unknown>[] = []

  if (photos.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: `گالری ${setting?.displayTitle || "یادبود"}`,
      inLanguage: "fa-IR",
      url: `${baseUrl}/p/gallery`,
      image: photos.slice(0, 60).map((m) => ({
        "@type": "ImageObject",
        contentUrl: `${baseUrl}${m.url}`,
        thumbnailUrl: m.thumb ? `${baseUrl}${m.thumb}` : undefined,
        name: m.title || m.alt || "یادبود شهید ابوالفضل دهنوی",
        caption: m.alt || undefined,
        width: m.width || undefined,
        height: m.height || undefined,
      })),
    })
  }

  for (const v of videos) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title || v.alt || `ویدیوی ${setting?.displayTitle || "یادبود"}`,
      inLanguage: "fa-IR",
      contentUrl: `${baseUrl}${v.url}`,
      thumbnailUrl: v.thumb ? `${baseUrl}${v.thumb}` : (photos[0]?.thumb ? `${baseUrl}${photos[0].thumb}` : undefined),
      uploadDate: v.createdAt || undefined,
      width: v.width || undefined,
      height: v.height || undefined,
      isFamilyFriendly: true,
    })
  }

  if (!graph.length) return null
  return (
    <>
      {graph.map((g, i) => (
        <JsonLd key={i} data={g} />
      ))}
    </>
  )
}
