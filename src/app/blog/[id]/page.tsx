import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MemorialApp } from "@/components/memorial/memorial-app"
import { fetchSiteData, siteBaseUrl } from "@/lib/site-data"
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await fetchSiteData()
  const post = data.blogPosts.find((p) => p.id === id)
  if (!post) return {}
  const description = post.excerpt?.trim() || post.content.replace(/\s+/g, " ").slice(0, 155)

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${id}`,
      locale: "fa_IR",
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  }
}

export default async function BlogRoute({ params }: Props) {
  const { id } = await params
  const data = await fetchSiteData()
  const post = data.blogPosts.find((p) => p.id === id)
  if (!post) notFound()

  return (
    <>
      <BlogPostingJsonLd post={post} baseUrl={siteBaseUrl(data.setting)} />
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: "بلاگ و خبر", url: "/p/blog" },
          { name: post.title, url: `/blog/${post.id}` },
        ]}
        baseUrl={siteBaseUrl(data.setting)}
      />
      <MemorialApp initialData={data} view={{ kind: "blog", postId: id }} />
    </>
  )
}
