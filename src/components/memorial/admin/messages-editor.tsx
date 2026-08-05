"use client"

import { useState, useEffect } from "react"
import { Trash2, Check, X, Loader2, MessageSquareHeart } from "lucide-react"
import { toast } from "sonner"
import type { GuestMessage } from "@/lib/store"
import { toPersianDigits } from "../biography-view"

function fullDate(iso: string) {
  try { return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) } catch { return iso }
}

export function MessagesEditor({ onChanged }: { onChanged: () => Promise<void> }) {
  const [items, setItems] = useState<GuestMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { items: GuestMessage[] }
      setItems(data.items)
    } catch { toast.error("بارگذاری ناموفق") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggle = async (m: GuestMessage) => {
    await fetch(`/api/admin/messages/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: !m.approved }) })
    toast.success(m.approved ? "مخفی شد" : "تأیید شد")
    load(); onChanged()
  }

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    load(); onChanged()
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[oklch(0.74_0.135_82)]" /></div>

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{toPersianDigits(items.length)} پیام</p>
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className={`rounded-2xl border p-4 ${m.approved ? "border-[oklch(0.74_0.135_82/0.2)] bg-ivory/50" : "border-dashed border-[oklch(0.74_0.135_82/0.25)] bg-ivory/30 opacity-70"}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]"><MessageSquareHeart className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-[oklch(0.36_0.07_168)] text-sm">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground/70">{fullDate(m.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm leading-7 text-foreground/80 whitespace-pre-wrap break-words">{m.text}</p>
                {!m.approved && <span className="mt-1 inline-block rounded-full bg-[oklch(0.92_0.035_82)] px-2 py-0.5 text-[10px] text-[oklch(0.6_0.1_70)]">مخفی</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggle(m)} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${m.approved ? "text-muted-foreground hover:bg-[oklch(0.95_0.018_82)]" : "text-[oklch(0.36_0.07_168)] hover:bg-[oklch(0.92_0.035_82)]"}`} title={m.approved ? "مخفی کردن" : "تأیید"}>
                  {m.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(m.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[oklch(0.52_0.18_25/0.1)] hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">پیامی ثبت نشده است.</p>}
      </div>
    </div>
  )
}
