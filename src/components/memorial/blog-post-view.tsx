"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { BlogPost } from "@/lib/types"

export function BlogPostView({ post }: { post: BlogPost }) {
  const router = useRouter()

  return (
    <article className="px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/p/blog")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[oklch(0.36_0.07_168)] transition"
        >
          <ChevronRight className="h-4 w-4" /> بازگشت به فهرست
        </button>
        {post.coverImage && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative mb-6 h-64 sm:h-80 overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-lg">
            <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
          </motion.div>
        )}
        {post.publishedAt && <p className="mb-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date(post.publishedAt))}</p>}
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-display text-3xl sm:text-4xl emerald-text mb-4 text-balance">{post.title}</motion.h1>
        {post.tags && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {post.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="rounded-full bg-[oklch(0.95_0.018_82)] px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
        {post.videoUrl && (
          <div className="mb-6">
            <video src={post.videoUrl} controls className="w-full rounded-xl border border-[oklch(0.74_0.135_82/0.25)]" />
          </div>
        )}
        <div className="prose-memorial">
          {post.content.split("\n").map((p, i) => {
            const line = p.trim()
            if (!line) return <div key={i} className="h-3" />
            return <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.5) }} className="mb-4 leading-9 text-[15px] sm:text-base text-foreground/85 text-justify">{line}</motion.p>
          })}
        </div>
      </div>
    </article>
  )
}
