"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X, LogOut, Loader2, Lock, Settings, Files, Image as ImageIcon, Newspaper, MessageSquareHeart, Eye, Type } from "lucide-react"
import { useAuth, useMemorial } from "@/lib/store"
import { toast } from "sonner"
import { SettingsEditor } from "./settings-editor"
import { PageManager } from "./page-manager"
import { MediaLibrary } from "./media-library"
import { BlogAdmin } from "./blog-admin"
import { MessagesEditor } from "./messages-editor"
import { FontManager } from "./font-manager"

type Tab = "pages" | "settings" | "fonts" | "media" | "blog" | "messages"

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pages", label: "صفحات", icon: Files },
  { key: "settings", label: "تنظیمات", icon: Settings },
  { key: "fonts", label: "فونت‌ها", icon: Type },
  { key: "media", label: "رسانه", icon: ImageIcon },
  { key: "blog", label: "بلاگ", icon: Newspaper },
  { key: "messages", label: "پیام‌ها", icon: MessageSquareHeart },
]

export function AdminPanel({ onClose, onChanged }: { onClose: () => void; onChanged: () => Promise<void> }) {
  const { isAdmin, checking, login, logout, check } = useAuth()
  const { data } = useMemorial()
  const [password, setPassword] = useState("")
  const [tab, setTab] = useState<Tab>("pages")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { check() }, [check])

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(password)
    if (ok) { toast.success("خوش آمدید"); setPassword("") }
    else toast.error("رمز عبور نادرست است")
  }

  const doLogout = async () => { await logout(); onClose() }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-[oklch(0.74_0.135_82/0.15)] bg-[oklch(0.985_0.006_85/0.9)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.36_0.07_168)] text-ivory"><Lock className="h-4 w-4" /></span>
            <div>
              <h2 className="font-display text-base emerald-text leading-tight">پنل مدیریت</h2>
              <p className="text-[10px] text-muted-foreground">یادبود شهید ابوالفضل دهنوی</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button onClick={() => setShowPreview(true)} className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-3 py-1.5 text-xs text-[oklch(0.36_0.07_168)] hover:bg-[oklch(0.95_0.018_82)]"><Eye className="h-3.5 w-3.5" /> مشاهده سایت</button>
                <button onClick={doLogout} className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.52_0.18_25/0.3)] px-3 py-1.5 text-xs text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.08)]"><LogOut className="h-3.5 w-3.5" /> خروج</button>
              </>
            )}
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[oklch(0.95_0.018_82)]" aria-label="بستن"><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {checking ? (
          <div className="flex flex-col items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[oklch(0.74_0.135_82)]" /><p className="mt-3 text-sm text-muted-foreground">در حال بررسی نشست...</p></div>
        ) : !isAdmin ? (
          <LoginScreen password={password} setPassword={setPassword} onSubmit={doLogin} />
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-8 sm:items-start">
            {/* Sticky sidebar on desktop, horizontal scroll on mobile */}
            <nav className="sm:w-48 sm:shrink-0 sm:sticky sm:top-20 z-30">
              <div className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-1 sm:overflow-visible sm:max-h-[calc(100svh-7rem)]">
                {TABS.map((t) => {
                  const Icon = t.icon
                  const active = tab === t.key
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[oklch(0.36_0.07_168)] text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.25)]" : "text-muted-foreground hover:bg-[oklch(0.95_0.018_82)] hover:text-[oklch(0.36_0.07_168)]"}`}>
                      <Icon className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
            <div className="min-w-0 flex-1">
              {tab === "settings" && <SettingsEditor setting={data?.setting ?? null} customFonts={data?.fonts ?? []} />}
              {tab === "pages" && <PageManager onChanged={onChanged} customFonts={data?.fonts ?? []} />}
              {tab === "media" && <MediaLibrary onChanged={onChanged} />}
              {tab === "blog" && <BlogAdmin posts={data?.blogPosts ?? []} onChanged={onChanged} />}
              {tab === "messages" && <MessagesEditor onChanged={onChanged} />}
              {tab === "fonts" && <FontManager onChanged={onChanged} />}
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowPreview(false)} className="fixed inset-0 z-[60] flex items-end justify-center bg-[oklch(0.12_0.02_165/0.85)] p-4">
          <motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="w-full max-w-sm rounded-2xl bg-background p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-lg emerald-text mb-2">برای مشاهده سایت</p>
            <p className="text-sm text-muted-foreground mb-4">دکمه بستن پنل را بزنید تا به سایت بازگردید. تغییرات شما به‌صورت زنده اعمال می‌شود.</p>
            <button onClick={() => { setShowPreview(false); onClose() }} className="rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm font-medium text-ivory">بستن پنل</button>
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  )
}

function LoginScreen({ password, setPassword, onSubmit }: { password: string; setPassword: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={onSubmit} className="w-full max-w-sm parchment rounded-3xl border border-[oklch(0.74_0.135_82/0.25)] p-7 shadow-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.36_0.07_168)] text-ivory shadow-lg"><Lock className="h-6 w-6" /></div>
          <h2 className="font-display text-xl emerald-text">ورود به پنل مدیریت</h2>
          <p className="mt-1 text-xs text-muted-foreground">رمز عبور را وارد کنید</p>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus dir="ltr" placeholder="••••••••" className="w-full rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)]" />
        <button type="submit" className="mt-4 w-full rounded-xl bg-[oklch(0.36_0.07_168)] py-3 text-sm font-medium text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.3)] transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">ورود</button>
      </motion.form>
    </div>
  )
}
