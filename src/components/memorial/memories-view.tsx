"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote as QuoteIcon, Send, Heart, MessageSquareHeart } from "lucide-react"
import { toast } from "sonner"
import type { Quote, GuestMessage } from "@/lib/store"
import { SectionTitle, OrnamentDivider } from "./ornaments"
import { toPersianDigits } from "./biography-view"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "هم‌اکنون"
  if (m < 60) return `${toPersianDigits(m)} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${toPersianDigits(h)} ساعت پیش`
  const d = Math.floor(h / 24)
  if (d < 30) return `${toPersianDigits(d)} روز پیش`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${toPersianDigits(mo)} ماه پیش`
  return `${toPersianDigits(Math.floor(mo / 12))} سال پیش`
}

export function MemoriesView({
  quotes,
  messages,
  onMessageAdded,
}: {
  quotes: Quote[]
  messages: GuestMessage[]
  onMessageAdded: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) {
      toast.error("نام و متن پیام را وارد کنید")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), text: text.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "ارسال ناموفق بود")
      }
      toast.success("پیام شما ثبت شد. ممنون از یادبودتان.")
      setName("")
      setText("")
      await onMessageAdded()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="یادبودها" subtitle="نقل‌قول‌ها و پیام‌های یادبود" />

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {quotes.map((q, i) => (
              <motion.figure
                key={q.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`relative parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-6 shadow-sm ${
                  i % 3 === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <QuoteIcon className="h-7 w-7 text-[oklch(0.74_0.135_82/0.6)] mb-3" />
                <blockquote className="font-display text-lg sm:text-xl leading-9 emerald-text text-balance">
                  {q.text}
                </blockquote>
                {q.author && (
                  <figcaption className="mt-3 text-sm text-muted-foreground">
                    — {q.author}
                  </figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        )}

        <OrnamentDivider className="my-16" />

        {/* Guestbook form */}
        <div className="text-center">
          <h3 className="font-display text-2xl sm:text-3xl emerald-text mb-2">
            کتاب یادبود
          </h3>
          <p className="text-sm text-muted-foreground mb-8">
            اگر خاطره‌ای، دلیلی برای سپاس یا پیامی از قلب دارید، بنویسید.
          </p>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-5 sm:p-6 shadow-sm"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
            maxLength={60}
            className="w-full rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="پیام یادبود شما..."
            maxLength={800}
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-4 py-3 text-sm leading-7 outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(text.length)}/۸۰۰
            </span>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2.5 text-sm font-medium text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.3)] transition-all hover:bg-[oklch(0.3_0.07_170)] active:scale-95 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "در حال ارسال..." : "ثبت پیام"}
            </button>
          </div>
        </motion.form>

        {/* Messages list */}
        <div className="mt-8 space-y-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="relative rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-[oklch(0.995_0.004_85/0.7)] p-4 sm:p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]">
                    <MessageSquareHeart className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-[oklch(0.36_0.07_168)] text-sm">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-7 text-foreground/80 whitespace-pre-wrap break-words">
                      {m.text}
                    </p>
                  </div>
                </div>
                <Heart className="absolute -bottom-1 -left-1 h-4 w-4 text-[oklch(0.52_0.18_25/0.4)]" fill="oklch(0.52 0.18 25 / 0.3)" />
              </motion.div>
            ))}
          </AnimatePresence>
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              هنوز پیامی ثبت نشده است. اولین پیام یادبود را شما بنویسید.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
