"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Grid3x3, X } from "lucide-react"
import { useMemorial } from "@/lib/store"
import { IconEl } from "@/lib/icon-registry"
import { CustomFontInjector } from "@/lib/fonts"
import { ScrollProgress, AnimatedOrnaments } from "./scroll-effects"
import { PageRenderer, PageHeader } from "./page-renderer"
import { MemorialFooter } from "./footer"
import { AdminPanel } from "./admin/admin-panel"

type View =
  | { kind: "page"; slug: string }
  | { kind: "blog"; postId: string }

export function MemorialApp() {
  const { data, loading, error, load } = useMemorial()
  const [view, setView] = useState<View>({ kind: "page", slug: "home" })
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#admin" || window.location.search.includes("admin=1")) {
        setAdminOpen(true)
      }
    }
    check()
    window.addEventListener("hashchange", check)
    return () => window.removeEventListener("hashchange", check)
  }, [])

  const navigatePage = (slug: string) => {
    setView({ kind: "page", slug })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const navigatePost = (postId: string) => {
    setView({ kind: "blog", postId })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.74_0.135_82/0.2)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[oklch(0.74_0.135_82)] animate-spin" />
          </div>
          <p className="font-display text-lg gold-text">در حال بارگذاری یادبود...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-xl text-muted-foreground mb-3">مشکلی پیش آمد</p>
          <button onClick={() => load()} className="rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm text-ivory">تلاش دوباره</button>
        </div>
      </div>
    )
  }

  const setting = data.setting!
  const navPages = data.pages.filter((p) => p.showInNav).sort((a, b) => a.order - b.order)
  const homeSlug = data.pages.find((p) => p.isHome)?.slug ?? "home"

  const renderMain = () => {
    if (view.kind === "blog") {
      const post = data.blogPosts.find((p) => p.id === view.postId)
      if (!post) {
        return <div className="py-20 text-center text-muted-foreground">نوشته یافت نشد. <button onClick={() => navigatePage("blog")} className="text-[oklch(0.36_0.07_168)] underline">بازگشت به بلاگ</button></div>
      }
      return <BlogPostView post={post} onBack={() => navigatePage("blog")} />
    }
    const page = data.pages.find((p) => p.slug === view.slug) ?? data.pages.find((p) => p.slug === homeSlug)
    if (!page) return <div className="py-20 text-center text-muted-foreground">صفحه یافت نشد.</div>
    return (
      <div>
        <PageHeader page={page} />
        <PageRenderer
          page={page}
          setting={setting}
          blogPosts={data.blogPosts}
          messages={data.messages}
          onNavigate={navigatePage}
          onNavigatePost={navigatePost}
          onMessageAdded={load}
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <CustomFontInjector fonts={data.fonts} />
      <ScrollProgress />
      <AnimatedOrnaments />
      <TopNav pages={navPages} setting={setting} currentSlug={view.kind === "page" ? view.slug : "blog"} onNavigate={navigatePage} />

      <main className="flex-1 pb-28 sm:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.kind + (view.kind === "page" ? view.slug : view.postId)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderMain()}
          </motion.div>
        </AnimatePresence>
      </main>

      <MemorialFooter onAdminClick={() => setAdminOpen(true)} setting={setting} />
      <BottomNav pages={navPages} currentSlug={view.kind === "page" ? view.slug : "blog"} onNavigate={navigatePage} />

      <AnimatePresence>
        {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} onChanged={load} />}
      </AnimatePresence>
    </div>
  )
}

function TopNav({ pages, setting, currentSlug, onNavigate }: { pages: { slug: string; title: string; navIcon: string }[]; setting: { fullName: string }; currentSlug: string; onNavigate: (slug: string) => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-[oklch(0.985_0.006_85/0.85)] backdrop-blur-lg border-b border-[oklch(0.74_0.135_82/0.15)] shadow-sm" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button onClick={() => onNavigate(pages.find((p) => p.navIcon === "Home")?.slug ?? "home")} className="font-display text-lg sm:text-xl emerald-text hover:opacity-80 transition">
          {setting.fullName}
        </button>
        <nav className="hidden sm:flex items-center gap-1">
          {pages.map((p) => (
            <button key={p.slug} onClick={() => onNavigate(p.slug)} className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${currentSlug === p.slug ? "text-[oklch(0.36_0.07_168)]" : "text-muted-foreground hover:text-[oklch(0.36_0.07_168)]"}`}>
              {currentSlug === p.slug && <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-[oklch(0.92_0.035_82)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              {p.title}
            </button>
          ))}
        </nav>
      </div>
    </motion.header>
  )
}

function BottomNav({ pages, currentSlug, onNavigate }: { pages: { slug: string; title: string; navIcon: string }[]; currentSlug: string; onNavigate: (slug: string) => void }) {
  const [moreOpen, setMoreOpen] = useState(false)
  // Show first 4 as fixed tabs + a "more" button for the rest
  const visible = pages.slice(0, 4)
  const hidden = pages.slice(4)
  const hasMore = hidden.length > 0

  return (
    <>
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-2 mb-2 rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] bg-[oklch(0.985_0.006_85/0.92)] backdrop-blur-xl shadow-[0_-8px_32px_-8px_oklch(0.36_0.07_168/0.25)]">
          <div className="flex items-center justify-around px-1 py-1.5">
            {visible.map((p) => {
              const active = currentSlug === p.slug
              return (
                <button key={p.slug} onClick={() => onNavigate(p.slug)} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition">
                  <AnimatePresence>
                    {active && <motion.span layoutId="tab-active" className="absolute inset-0 -z-10 rounded-xl bg-[oklch(0.92_0.035_82)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  </AnimatePresence>
                  <IconEl name={p.navIcon} className={`h-5 w-5 transition-colors ${active ? "text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"}`} />
                  <span className={`text-[10px] transition-colors ${active ? "font-medium text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"}`}>{p.title}</span>
                </button>
              )
            })}
            {hasMore && (
              <button onClick={() => setMoreOpen(true)} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition">
                <AnimatePresence>
                  {moreOpen && <motion.span layoutId="tab-active" className="absolute inset-0 -z-10 rounded-xl bg-[oklch(0.92_0.035_82)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                </AnimatePresence>
                <Grid3x3 className={`h-5 w-5 transition-colors ${moreOpen ? "text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"}`} />
                <span className={`text-[10px] transition-colors ${moreOpen ? "font-medium text-[oklch(0.36_0.07_168)]" : "text-muted-foreground/70"}`}>بیشتر</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* "More" sheet — slides up from bottom */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
            className="sm:hidden fixed inset-0 z-50 bg-[oklch(0.12_0.02_165/0.5)] backdrop-blur-sm flex items-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-background border-t-2 border-[oklch(0.74_0.135_82/0.3)] p-5 pb-8"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[oklch(0.74_0.135_82/0.3)]" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg emerald-text">همه صفحات</h3>
                <button onClick={() => setMoreOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[oklch(0.95_0.018_82)]"><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {hidden.map((p) => {
                  const active = currentSlug === p.slug
                  return (
                    <button
                      key={p.slug}
                      onClick={() => { onNavigate(p.slug); setMoreOpen(false) }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${active ? "border-[oklch(0.74_0.135_82)] bg-[oklch(0.92_0.035_82)]" : "border-[oklch(0.74_0.135_82/0.2)] bg-ivory hover:bg-[oklch(0.95_0.018_82)]"}`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]"}`}>
                        <IconEl name={p.navIcon} className="h-5 w-5" />
                      </span>
                      <span className={`text-xs ${active ? "font-medium text-[oklch(0.36_0.07_168)]" : "text-foreground/80"}`}>{p.title}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function BlogPostView({ post, onBack }: { post: { id: string; title: string; excerpt: string | null; content: string; coverImage: string | null; videoUrl: string | null; publishedAt: string | null; tags: string | null }; onBack: () => void }) {
  return (
    <article className="px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[oklch(0.36_0.07_168)] transition">
          <ChevronRight className="h-4 w-4" /> بازگشت به فهرست
        </button>
        {post.coverImage && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mb-6 overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-lg">
            <img src={post.coverImage} alt={post.title} className="w-full h-64 sm:h-80 object-cover" />
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
