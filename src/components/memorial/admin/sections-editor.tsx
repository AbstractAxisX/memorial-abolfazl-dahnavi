"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, Pencil, X, Check } from "lucide-react"
import { toast } from "sonner"
import type { BioSection } from "@/lib/store"
import { ImageUpload } from "./image-upload"
import { Card, Field, Input, Textarea } from "./settings-editor"

export function SectionsEditor({
  sections,
  onChanged,
}: {
  sections: BioSection[]
  onChanged: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ title: "", content: "", image: null as string | null })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ title: string; content: string; image: string | null } | null>(null)

  const add = async () => {
    if (!draft.title.trim()) {
      toast.error("عنوان الزامی است")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error("افزودن ناموفق بود")
      toast.success("بخش اضافه شد")
      setDraft({ title: "", content: "", image: null })
      setAdding(false)
      await onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("این بخش حذف شود؟")) return
    try {
      const res = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("حذف ناموفق بود")
      toast.success("حذف شد")
      await onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const move = async (id: string, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === id)
    const target = idx + dir
    if (target < 0 || target >= sections.length) return
    const a = sections[idx]
    const b = sections[target]
    await Promise.all([
      fetch(`/api/admin/sections/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/admin/sections/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }),
    ])
    await onChanged()
  }

  const startEdit = (s: BioSection) => {
    setEditingId(s.id)
    setEditDraft({ title: s.title, content: s.content, image: s.image })
  }

  const saveEdit = async (id: string) => {
    if (!editDraft) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      })
      if (!res.ok) throw new Error("ذخیره ناموفق بود")
      toast.success("به‌روزرسانی شد")
      setEditingId(null)
      setEditDraft(null)
      await onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sections.length} بخش ثبت شده است
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          بخش جدید
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card title="افزودن بخش جدید">
              <Field label="عنوان">
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              <Field label="متن (با Enter پاراگراف جدا کنید)">
                <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={5} />
              </Field>
              <Field label="تصویر (اختیاری)">
                <ImageUpload value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} />
              </Field>
              <div className="flex gap-2">
                <button onClick={add} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm font-medium text-ivory disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  ذخیره
                </button>
                <button onClick={() => setAdding(false)} className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">
                  <X className="h-4 w-4" />
                  انصراف
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50 p-4">
            {editingId === s.id && editDraft ? (
              <div className="space-y-3">
                <Field label="عنوان">
                  <Input value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                </Field>
                <Field label="متن">
                  <Textarea value={editDraft.content} onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })} rows={5} />
                </Field>
                <Field label="تصویر">
                  <ImageUpload value={editDraft.image} onChange={(v) => setEditDraft({ ...editDraft, image: v })} />
                </Field>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(s.id)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-1.5 text-xs font-medium text-ivory disabled:opacity-60">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    ذخیره
                  </button>
                  <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-1.5 text-xs text-[oklch(0.36_0.07_168)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  <button onClick={() => move(s.id, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(s.id, 1)} disabled={i === sections.length - 1} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                {s.image && (
                  <img src={s.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover border border-[oklch(0.74_0.135_82/0.2)]" />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-[oklch(0.36_0.07_168)]">{s.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.content}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(s)} className="p-2 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(s.id)} className="p-2 text-muted-foreground hover:text-[oklch(0.52_0.18_25)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">
            هنوز بخشی ثبت نشده است.
          </p>
        )}
      </div>
    </div>
  )
}
