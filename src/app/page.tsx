import type { Metadata } from "next"
import { MemorialApp } from "@/components/memorial/memorial-app"
import { fetchSiteData, siteBaseUrl, pageDescription } from "@/lib/site-data"
import { PersonJsonLd, WebSiteJsonLd, MediaJsonLd } from "@/components/seo/json-ld"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchSiteData()
  const setting = data.setting
  const home = data.pages.find((p) => p.isHome) ?? data.pages[0]
  const base = siteBaseUrl(setting)
  const description = setting?.heroIntro?.replace(/\s+/g, " ").trim().slice(0, 158) || pageDescription(
    home ?? { sections: [], subtitle: null as unknown as string }
  )

  return {
    metadataBase: new URL(base),
    title: {
      default: `${setting?.displayTitle ?? "شهید ابوالفضل دهنوی"} | یادبود جاودان`,
      template: `%s | ${setting?.displayTitle ?? "شهید ابوالفضل دهنوی"}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      siteName: "یادبود شهید ابوالفضل دهنوی",
      title: `${setting?.displayTitle ?? "شهید ابوالفضل دهنوی"} | یادبود جاودان`,
      description,
      url: "/",
      locale: "fa_IR",
    },
    twitter: {
      card: "summary_large_image",
      title: `${setting?.displayTitle ?? "شهید ابوالفضل دهنوی"} | یادبود جاودان`,
      description,
    },
  }
}

export default async function Home() {
  const data = await fetchSiteData()
  const home = data.pages.find((p) => p.isHome) ?? data.pages[0]

  return (
    <>
      <PersonJsonLd setting={data.setting} baseUrl={siteBaseUrl(data.setting)} />
      <WebSiteJsonLd baseUrl={siteBaseUrl(data.setting)} />
      <MediaJsonLd media={data.media} setting={data.setting} baseUrl={siteBaseUrl(data.setting)} />
      <MemorialApp initialData={data} view={{ kind: "page", slug: home?.slug ?? "home" }} />
    </>
  )
}
