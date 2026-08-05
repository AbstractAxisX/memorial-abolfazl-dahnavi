"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, X, Check, Film, Image as ImageIcon, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { GalleryItem } from "@/lib/store"
import { ImageUpload } from "./image-upload"
import { Card, Field, Input } from "./settings-editor"

export function GalleryEditor({
  items,
  onChanged,
}: {
  items: GalleryItem[]
  onChanged: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<{ type: "photo" | "video"; url: string | null; caption: string }>({ type: "photo", url: null, caption: "" })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ caption: string } | null>(null)

  const add = async () => {
    if (!draft.url) {
      toast.error("ابتدا یک فایل آپلود کنید")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: draft.type, url: draft.url, caption: draft.caption }),
      })
      if (!res.ok) throw new Error("افزودن ناموفق بود")
      toast.success("به گالری اضافه شد")
      setDraft({ type: "photo", url: null, caption: "" })
      setAdding(false)
      await onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("این مورد حذف شود؟")) return
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" })
      toast.success("حذف شد")
      await onChanged()
    } catch {
      toast.error("حذف ناموفق بود")
    }
  }

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id)
    const target = idx + dir
    if (target < 0 || target >= items.length) return
    const a = items[idx]
    const b = items[target]
    await Promise.all([
      fetch(`/api/admin/gallery/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/gallery/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ])
    await onChanged()
  }

  const saveCaption = async (id: string) => {
    if (!editDraft) return
    setSaving(true)
    try {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editDraft.caption }),
      })
      toast.success("به‌روزرسانی شد")
      setEditingId(null)
      setEditDraft(null)
      await onChanged()
    } catch {
      toast.error("ذخیره ناموفق بود")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} مورد در گالری</p>
        <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Plus className="h-4 w-4" />
          افزودن مورد
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card title="افزودن به گالری">
              <div className="flex gap-2">
                <button onClick={() => setDraft({ ...draft, type: "photo" })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${draft.type === "photo" ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.3)] text-[oklch(0.36_0.07_168)]"}`}>
                  <ImageIcon className="h-3.5 w-3.5" /> عکس
                </button>
                <button onClick={() => setDraft({ ...draft, type: "video" })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${draft.type === "video" ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.3)] text-[oklch(0.36_0.07_168)]"}`}>
                  <Film className="h-3.5 w-3.5" /> ویدیو
                </button>
              </div>
              <Field label="فایل">
                <ImageUpload
                  value={draft.url}
                  onChange={(v) => setDraft({ ...draft, url: v, type: v && v.match(/\.(mp4|webm|mov)$/i) ? "video" : draft.type })}
                  accept={draft.type === "video" ? "video/*" : "image/*"}
                />
              </Field>
              <Field label="توضیح (اختیاری)">
                <Input value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} placeholder="مثلاً: لحظه‌ای از امدادرسانی" />
              </Field>
              <div className="flex gap-2">
                <button onClick={add} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm font-medium text-ivory disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  ذخیره
                </button>
                <button onClick={() => setAdding(false)} className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it, i) => (
          <div key={it.id} className="group relative overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory">
            <div className="aspect-square overflow-hidden">
              {it.type === "video" ? (
                <video src={it.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute top-1 right-1 flex flex-col">
              <button onClick={() => move(it.id, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded bg-[oklch(0.12_0.02_165/0.6)] text-white backdrop-blur disabled:opacity-30">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button onClick={() => move(it.id, 1)} disabled={i === items.length - 1} className="flex h-6 w-6 items-center justify-center rounded bg-[oklch(0.12_0.02_165/0.6)] text-white backdrop-blur disabled:opacity-30">
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div className="absolute top-1 left-1 flex gap-1">
              <button onClick={() => { setEditingId(it.id); setEditDraft({ caption: it.caption ?? "" }) }} className="flex h-6 w-6 items-center justify-center rounded bg-[oklch(0.12_0.02_165/0.6)] text-white backdrop-blur">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => remove(it.id)} className="flex h-6 w-6 items-center justify-center rounded bg-[oklch(0.52_0.18_25/0.8)] text-white backdrop-blur">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="absolute bottom-1 right-1">
              <span className="rounded bg-[oklch(0.12_0.02_165/0.7)] px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
                {it.type === "video" ? "ویدیو" : "عکس"}
              </span>
            </div>
            {it.caption && (
              <p className="p-1.5 text-[10px] leading-4 line-clamp-2 text-foreground/70">{it.caption}</p>
            )}
          </div>
        ))}
        {items.length === 0 && !adding && (
          <p className="col-span-full rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">
            گالری خالی است.
          </p>
        )}
      </div>

      <AnimatePresence>
        {editingId && editDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.12_0.02_165/0.7)] p-4"
            onClick={() => setEditingId(null)}
          >
            <div className="w-full max-w-sm rounded-2xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
              <h4 className="mb-3 font-display text-lg emerald-text">ویرایش توضیح</h4>
              <Field label="توضیح">
                <Input value={editDraft.caption} onChange={(e) => setEditDraft({ caption: e.target.value })} />
              </Field>
              <div className="mt-4 flex gap-2">
                <button onClick={() => saveCaption(editingId)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  ذخیره
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">انصراف</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
