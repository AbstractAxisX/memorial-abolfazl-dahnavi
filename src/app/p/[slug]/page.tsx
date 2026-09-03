import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MemorialApp } from "@/components/memorial/memorial-app"
import { fetchSiteData, siteBaseUrl, pageDescription } from "@/lib/site-data"
import { BreadcrumbJsonLd, MediaJsonLd } from "@/components/seo/json-ld"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchSiteData()
  const page = data.pages.find((p) => p.slug === slug)
  if (!page) return {}
  const base = siteBaseUrl(data.setting)

  return {
    title: page.title,
    description: pageDescription(page),
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      type: "article",
      title: `${page.title} | ${data.setting?.displayTitle ?? "یادبود شهید ابوالفضل دهنوی"}`,
      description: pageDescription(page),
      url: `/p/${slug}`,
      locale: "fa_IR",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: pageDescription(page),
    },
    ...(base !== "http://localhost:3000" ? { metadataBase: new URL(base) } : {}),
  }
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params
  const data = await fetchSiteData()
  const page = data.pages.find((p) => p.slug === slug)
  if (!page) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: page.title, url: `/p/${slug}` },
        ]}
        baseUrl={siteBaseUrl(data.setting)}
      />
      <MediaJsonLd media={data.media} setting={data.setting} baseUrl={siteBaseUrl(data.setting)} />
      <MemorialApp initialData={data} view={{ kind: "page", slug }} />
    </>
  )
}
