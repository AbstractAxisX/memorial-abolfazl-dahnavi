"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Pencil, Search, X, Upload, Image as ImageIcon, Film, Loader2, Folder, FolderPlus } from "lucide-react"
import { toast } from "sonner"
import type { MediaFile } from "@/lib/store"
import { Card, Field, Input, Textarea, Select } from "./settings-editor"
import { toPersianDigits } from "../biography-view"
import { enqueueUpload } from "./upload-center"

export function MediaLibrary({ onChanged }: { onChanged: () => Promise<void> }) {
  const [items, setItems] = useState<MediaFile[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "image" | "video">("all")
  const [fixing, setFixing] = useState(false)
  const [activeCat, setActiveCat] = useState<string>("all")
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<MediaFile | null>(null)
  const [uploadingCat, setUploadingCat] = useState("عمومی")
  const [newCatName, setNewCatName] = useState("")
  const [showNewCat, setShowNewCat] = useState(false)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { items: MediaFile[]; categories: string[] }
      setItems(data.items)
      setCategories(data.categories?.length ? data.categories : ["عمومی"])
    } catch { setError("بارگذاری ناموفق") }
    finally { setLoading(false) }
  }

  const fixVideos = async () => {
    if (fixing) return
    setFixing(true)
    try {
      const res = await fetch("/api/admin/fix-videos", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "خطا")
      const fixed = (data.results || []).filter((r: { action: string }) => !r.action.includes("سالم")).length
      if (fixed > 0) toast.success(`ویدیوها تعمیر شد (${toPersianDigits(fixed)} مورد)`)
      else toast.info("همه ویدیوها سالم بودند")
      await load()
    } catch (e) {
      toast.error("تعمیر ویدیوها ناموفق بود: " + (e as Error).message)
    } finally {
      setFixing(false)
    }
  }

  // live refresh while the floating Upload Center finishes files (incl. retries)
  useEffect(() => {
    const schedule = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => { load(); onChanged() }, 400)
    }
    window.addEventListener("memorial:upload-done", schedule)
    return () => {
      window.removeEventListener("memorial:upload-done", schedule)
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [])

  useEffect(() => { load() }, [])

  const filtered = items.filter((i) =>
    (filter === "all" || i.type === filter) &&
    (activeCat === "all" || (i.category || "عمومی") === activeCat) &&
    (!q || (i.title ?? "").includes(q) || (i.description ?? "").includes(q) || i.url.includes(q))
  )

  // multi-file upload → queued in the floating Upload Center (progress/speed/cancel there)
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    if (arr.length > 1) toast.info(`${toPersianDigits(arr.length)} فایل در صف آپلود قرار گرفت`)
    const results = await Promise.allSettled(arr.map((f) => enqueueUpload(f, { category: uploadingCat })))
    const ok = results.filter((r) => r.status === "fulfilled").length
    const failed = arr.length - ok
    if (ok > 0) toast.success(`${toPersianDigits(ok)} فایل آپلود شد`)
    if (failed > 0) toast.error(`${toPersianDigits(failed)} فایل آپلود نشد`)
  }

  const save = async () => {
    if (!editing) return
    await fetch(`/api/admin/media/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editing.title, description: editing.description, alt: editing.alt, category: editing.category }),
    })
    toast.success("ذخیره شد")
    setEditing(null); load(); onChanged()
  }

  const remove = async (id: string) => {
    if (!confirm("این فایل برای همیشه حذف شود؟")) return
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    load(); onChanged()
  }

  const addCategory = () => {
    const name = newCatName.trim()
    if (!name) return
    if (!categories.includes(name)) {
      setCategories([...categories, name])
      setUploadingCat(name)
    }
    setNewCatName(""); setShowNewCat(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload bar + category selector */}
      <Card title="آپلود فایل" subtitle="چند فایل با هم — حداکثر ۲۰۰ مگابایت برای هر فایل • پیشرفت در مرکز آپلود پایین صفحه">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.39_0.085_168)] px-4 py-2 text-sm font-medium text-ivory cursor-pointer transition hover:bg-[oklch(0.33_0.08_170)] active:scale-95">
            <Upload className="h-4 w-4" /> انتخاب و آپلود
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = "" }} />
          </label>
          <Field label="">
            <Select value={uploadingCat} onChange={(e) => setUploadingCat(e.target.value)} className="w-36">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <button onClick={() => setShowNewCat((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.76_0.14_80/0.3)] px-3 py-2 text-xs text-[oklch(0.39_0.085_168)] hover:bg-[oklch(0.95_0.018_82)]">
            <FolderPlus className="h-3.5 w-3.5" /> دسته جدید
          </button>
          <button onClick={fixVideos} disabled={fixing} className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.76_0.14_80/0.3)] px-3 py-2 text-xs text-[oklch(0.39_0.085_168)] hover:bg-[oklch(0.95_0.018_82)] disabled:opacity-50" title="ویدیوهای ناسازگار با مرورگر را به H.264 تبدیل می‌کند + تصویر پیش‌نمایش می‌سازد">
            {fixing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />} {fixing ? "در حال تعمیر..." : "تعمیر ویدیوها"}
          </button>
          {showNewCat && (
            <div className="flex items-center gap-1">
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="نام دسته" className="w-32" />
              <button onClick={addCategory} className="rounded-full bg-[oklch(0.39_0.085_168)] px-3 py-2 text-xs text-ivory">افزودن</button>
            </div>
          )}
        </div>
      </Card>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveCat("all")} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCat === "all" ? "bg-[oklch(0.39_0.085_168)] text-ivory" : "border border-[oklch(0.76_0.14_80/0.3)] text-[oklch(0.39_0.085_168)] hover:bg-[oklch(0.95_0.018_82)]"}`}>
          <Folder className="h-3.5 w-3.5" /> همه ({toPersianDigits(items.length)})
        </button>
        {categories.map((cat) => {
          const n = items.filter((i) => (i.category || "عمومی") === cat).length
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCat === cat ? "bg-[oklch(0.39_0.085_168)] text-ivory" : "border border-[oklch(0.76_0.14_80/0.3)] text-[oklch(0.39_0.085_168)] hover:bg-[oklch(0.95_0.018_82)]"}`}>
              <Folder className="h-3.5 w-3.5" /> {cat} ({toPersianDigits(n)})
            </button>
          )
        })}
      </div>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-[oklch(0.39_0.085_168)] text-ivory" : "border border-[oklch(0.76_0.14_80/0.3)] text-[oklch(0.39_0.085_168)]"}`}>{f === "all" ? "همه" : f === "image" ? "عکس" : "ویدیو"}</button>
          ))}
        </div>
        <div className="relative mr-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." className="w-40 rounded-full border border-[oklch(0.76_0.14_80/0.25)] bg-ivory pr-9 pl-3 py-1.5 text-sm outline-none focus:border-[oklch(0.76_0.14_80)]" />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[oklch(0.76_0.14_80)]" /></div>
      ) : error ? (
        <div className="rounded-2xl border border-[oklch(0.52_0.18_25/0.25)] bg-[oklch(0.52_0.18_25/0.05)] p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button onClick={load} className="rounded-full bg-[oklch(0.39_0.085_168)] px-4 py-2 text-sm text-ivory">تلاش دوباره</button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[oklch(0.76_0.14_80/0.25)] py-10 text-center text-sm text-muted-foreground">هیچ فایلی یافت نشد. روی «انتخاب و آپلود» بزنید.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <AnimatePresence>
            {filtered.map((m) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative overflow-hidden rounded-xl border border-[oklch(0.76_0.14_80/0.18)] bg-ivory">
                <div className="aspect-square overflow-hidden">
                  {m.type === "video" ? <video src={m.url} className="h-full w-full object-cover" muted /> : <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />}
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  <span className="rounded bg-[oklch(0.12_0.02_165/0.7)] px-1 py-0.5 text-[9px] text-white">{m.type === "video" ? <Film className="h-3 w-3 inline" /> : <ImageIcon className="h-3 w-3 inline" />}</span>
                  <span className="rounded bg-[oklch(0.39_0.085_168/0.8)] px-1 py-0.5 text-[9px] text-white">{m.category || "عمومی"}</span>
                </div>
                <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setEditing(m)} className="flex h-7 w-7 items-center justify-center rounded bg-white/90 text-[oklch(0.39_0.085_168)]"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(m.id)} className="flex h-7 w-7 items-center justify-center rounded bg-[oklch(0.52_0.18_25/0.9)] text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {m.title && <p className="p-1.5 text-[10px] truncate">{m.title}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.12_0.02_165/0.7)] p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg emerald-text">ویرایش فایل</h3>
                <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="mb-3 overflow-hidden rounded-xl border border-[oklch(0.76_0.14_80/0.2)]">
                {editing.type === "video" ? <video src={editing.url} className="max-h-48 w-full object-contain bg-black" controls /> : <img src={editing.url} alt="" className="max-h-48 w-full object-contain" />}
              </div>
              <p className="mb-3 truncate text-[11px] text-muted-foreground" dir="ltr">{editing.url}</p>
              <div className="space-y-3">
                <Field label="عنوان"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
                <Field label="دسته"><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="مثلاً: عکس‌های کودکی" /></Field>
                <Field label="توضیح"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} /></Field>
                <Field label="متن جایگزین (alt)"><Input value={editing.alt ?? ""} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} /></Field>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={save} className="rounded-full bg-[oklch(0.39_0.085_168)] px-4 py-2 text-sm text-ivory">ذخیره</button>
                <button onClick={() => setEditing(null)} className="rounded-full border border-[oklch(0.76_0.14_80/0.3)] px-4 py-2 text-sm text-[oklch(0.39_0.085_168)]">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
