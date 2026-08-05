"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Trash2, Pencil, Search, X, Upload, Image as ImageIcon, Film } from "lucide-react"
import { toast } from "sonner"
import type { MediaFile } from "@/lib/store"
import { Card, Field, Input, Textarea } from "./settings-editor"
import { toPersianDigits } from "../biography-view"

export function MediaLibrary({ onChanged }: { onChanged: () => Promise<void> }) {
  const [items, setItems] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "image" | "video">("all")
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<MediaFile | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { items: MediaFile[] }
      setItems(data.items)
    } catch { toast.error("بارگذاری ناموفق") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter((i) => (filter === "all" || i.type === filter) && (!q || (i.title ?? "").includes(q) || (i.description ?? "").includes(q) || i.url.includes(q)))

  const save = async () => {
    if (!editing) return
    await fetch(`/api/admin/media/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editing.title, description: editing.description, alt: editing.alt }) })
    toast.success("ذخیره شد")
    setEditing(null)
    load()
    onChanged()
  }

  const remove = async (id: string) => {
    if (!confirm("این فایل برای همیشه حذف شود؟ (فایل فیزیکی هم پاک می‌شود)")) return
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    load()
    onChanged()
  }

  const onUpload = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    toast.loading("در حال آپلود...", { id: "up" })
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    toast.dismiss("up")
    if (!res.ok) { toast.error("آپلود ناموفق"); return }
    toast.success("آپلود شد")
    load()
    onChanged()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory cursor-pointer transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Upload className="h-4 w-4" /> آپلود فایل
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = "" }} />
        </label>
        <div className="flex gap-1">
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.3)] text-[oklch(0.36_0.07_168)]"}`}>{f === "all" ? "همه" : f === "image" ? "عکس‌ها" : "ویدیوها"}</button>
          ))}
        </div>
        <div className="relative mr-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." className="w-40 rounded-full border border-[oklch(0.74_0.135_82/0.25)] bg-ivory pr-9 pl-3 py-1.5 text-sm outline-none focus:border-[oklch(0.74_0.135_82)]" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[oklch(0.74_0.135_82)]" /></div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">هیچ فایلی یافت نشد. روی «آپلود فایل» بزنید.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <AnimatePresence>
            {filtered.map((m) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory">
                <div className="aspect-square overflow-hidden">
                  {m.type === "video" ? <video src={m.url} className="h-full w-full object-cover" muted /> : <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />}
                </div>
                <div className="absolute top-1 right-1"><span className="rounded bg-[oklch(0.12_0.02_165/0.7)] px-1 py-0.5 text-[9px] text-white">{m.type === "video" ? <Film className="h-3 w-3 inline" /> : <ImageIcon className="h-3 w-3 inline" />}</span></div>
                <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setEditing(m)} className="flex h-7 w-7 items-center justify-center rounded bg-white/90 text-[oklch(0.36_0.07_168)]"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(m.id)} className="flex h-7 w-7 items-center justify-center rounded bg-[oklch(0.52_0.18_25/0.9)] text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {m.title && <p className="p-1.5 text-[10px] truncate">{m.title}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.12_0.02_165/0.7)] p-4" onClick={() => setEditing(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg emerald-text">ویرایش فایل</h3>
                <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="mb-3 overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.2)]">
                {editing.type === "video" ? <video src={editing.url} className="max-h-48 w-full object-contain bg-black" controls /> : <img src={editing.url} alt="" className="max-h-48 w-full object-contain" />}
              </div>
              <p className="mb-3 truncate text-[11px] text-muted-foreground" dir="ltr">{editing.url}</p>
              <div className="space-y-3">
                <Field label="عنوان"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
                <Field label="توضیح"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} /></Field>
                <Field label="متن جایگزین (alt)"><Input value={editing.alt ?? ""} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} /></Field>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={save} className="rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm text-ivory">ذخیره</button>
                <button onClick={() => setEditing(null)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
