"use client"

import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import type { Page, SiteSetting, BlogPost, GuestMessage } from "@/lib/store"
import { fontFamilyFor } from "@/lib/fonts"
import { IconEl } from "@/lib/icon-registry"
import { SectionRenderer } from "./section-renderers"

function isDisplayType(type: string): boolean {
  return ["hero", "quotes", "cta", "timeline", "divider"].includes(type)
}

export function PageRenderer({
  page,
  setting,
  blogPosts,
  messages,
  onNavigate,
  onNavigatePost,
  onMessageAdded,
}: {
  page: Page
  setting: SiteSetting
  blogPosts: BlogPost[]
  messages: GuestMessage[]
  onNavigate: (slug: string) => void
  onNavigatePost: (id: string) => void
  onMessageAdded: () => Promise<void>
}) {
  const sections = page.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order)

  return (
    <div>
      {sections.map((section, i) => {
        const fontKey = section.fontKey ?? (isDisplayType(section.type) ? setting.headingFontKey : setting.globalFontKey)
        const fam = fontFamilyFor(fontKey)
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: Math.min(i * 0.03, 0.2), ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: fam }}
          >
            <SectionRenderer
              section={section}
              setting={setting}
              blogPosts={blogPosts}
              messages={messages}
              onNavigate={onNavigate}
              onNavigatePost={onNavigatePost}
              onMessageAdded={onMessageAdded}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

// Page header (title + subtitle banner) — optional, shown for non-home pages
export function PageHeader({ page }: { page: Page }) {
  if (page.isHome) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden px-5 pt-14 pb-2 text-center"
    >
      <div className="pointer-events-none absolute inset-0 pattern-overlay" />
      <div className="relative">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[oklch(0.74_0.135_82/0.3)] bg-ivory text-[oklch(0.36_0.07_168)] shadow-sm">
          <IconEl name={page.navIcon} className="h-5 w-5" />
        </span>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl emerald-text text-balance">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">{page.subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}
