"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, X, Save, Pencil, Star, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import type { BlogPost } from "@/lib/store"
import { Card, Field, Input, Textarea } from "./settings-editor"
import { ImageUpload } from "./image-upload"
import { toPersianDigits } from "../biography-view"

type Draft = {
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  videoUrl: string | null
  tags: string
  featured: boolean
  publishedAt: string
}

const empty: Draft = { title: "", excerpt: "", content: "", coverImage: null, videoUrl: null, tags: "", featured: false, publishedAt: new Date().toISOString().slice(0, 10) }

export function BlogAdmin({ posts, onChanged }: { posts: BlogPost[]; onChanged: () => Promise<void> }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [draft, setDraft] = useState<Draft>(empty)
  const [saving, setSaving] = useState(false)

  const startAdd = () => { setDraft(empty); setAdding(true); setEditing(null) }
  const startEdit = (p: BlogPost) => { setEditing(p); setAdding(false); setDraft({ title: p.title, excerpt: p.excerpt ?? "", content: p.content, coverImage: p.coverImage, videoUrl: p.videoUrl, tags: p.tags ?? "", featured: p.featured, publishedAt: (p.publishedAt ?? new Date().toISOString()).slice(0, 10) }) }

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) { toast.error("عنوان و متن الزامی است"); return }
    setSaving(true)
    try {
      const body = { ...draft, publishedAt: new Date(draft.publishedAt).toISOString() }
      if (editing) {
        const res = await fetch(`/api/admin/blog/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error()
        toast.success("به‌روزرسانی شد")
      } else {
        const res = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error()
        toast.success("نوشته ایجاد شد")
      }
      setAdding(false); setEditing(null); setDraft(empty)
      await onChanged()
    } catch { toast.error("ذخیره ناموفق") }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm("این نوشته حذف شود؟")) return
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    await onChanged()
  }

  const move = async (id: string, dir: -1 | 1) => {
    const idx = posts.findIndex((p) => p.id === id)
    const t = idx + dir
    if (t < 0 || t >= posts.length) return
    const a = posts[idx]
    const b = posts[t]
    await Promise.all([
      fetch(`/api/admin/blog/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/blog/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ])
    await onChanged()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{toPersianDigits(posts.length)} نوشته</p>
        <button onClick={startAdd} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Plus className="h-4 w-4" /> نوشته جدید
        </button>
      </div>

      <AnimatePresence>
        {(adding || editing) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card title={editing ? "ویرایش نوشته" : "نوشته جدید"}>
              <Field label="عنوان"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              <Field label="خلاصه (نمایش در فهرست)"><Textarea value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} rows={2} /></Field>
              <Field label="متن کامل (Enter = پاراگراف جدید)"><Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={8} className="font-mono text-xs" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="تصویر کاور"><ImageUpload value={draft.coverImage} onChange={(v) => setDraft({ ...draft, coverImage: v })} aspect="aspect-video w-full" /></Field>
                <Field label="ویدیو (اختیاری)"><ImageUpload value={draft.videoUrl} onChange={(v) => setDraft({ ...draft, videoUrl: v })} accept="video/*" aspect="aspect-video w-full" /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="برچسب‌ها (با کاما جدا کنید)"><Input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="یادبود, نهال کاری" /></Field>
                <Field label="تاریخ انتشار"><Input type="date" value={draft.publishedAt} onChange={(e) => setDraft({ ...draft, publishedAt: e.target.value })} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} className="accent-[oklch(0.36_0.07_168)]" /> نوشته ویژه (بزرگ‌تر نمایش داده می‌شود)</label>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm text-ivory disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره</button>
                <button onClick={() => { setAdding(false); setEditing(null) }} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">انصراف</button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {posts.map((p, i) => (
          <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50 p-3">
            <div className="flex flex-col">
              <button onClick={() => move(p.id, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => move(p.id, 1)} disabled={i === posts.length - 1} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            </div>
            {p.coverImage && <img src={p.coverImage} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover border" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {p.featured && <Star className="h-3.5 w-3.5 text-[oklch(0.74_0.135_82)]" fill="oklch(0.74 0.135 82)" />}
                <h4 className="font-medium text-[oklch(0.36_0.07_168)] truncate">{p.title}</h4>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.excerpt || p.content.slice(0, 80)}</p>
              {p.publishedAt && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(p.publishedAt))}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(p)} className="p-2 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="p-2 text-muted-foreground hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">هنوز نوشته‌ای منتشر نشده است.</p>
        )}
      </div>
    </div>
  )
}
