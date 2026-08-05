"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, Pencil, X, Check, Quote as QuoteIcon } from "lucide-react"
import { toast } from "sonner"
import type { Quote } from "@/lib/store"
import { Card, Field, Input, Textarea } from "./settings-editor"

export function QuotesEditor({
  quotes,
  onChanged,
}: {
  quotes: Quote[]
  onChanged: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ text: "", author: "" })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ text: string; author: string } | null>(null)

  const add = async () => {
    if (!draft.text.trim()) return toast.error("متن الزامی است")
    setSaving(true)
    try {
      await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.text, author: draft.author || null }),
      })
      toast.success("افزوده شد")
      setDraft({ text: "", author: "" })
      setAdding(false)
      await onChanged()
    } catch {
      toast.error("افزودن ناموفق بود")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return
    await fetch(`/api/admin/quotes/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    await onChanged()
  }

  const saveEdit = async (id: string) => {
    if (!editDraft) return
    setSaving(true)
    try {
      await fetch(`/api/admin/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editDraft.text, author: editDraft.author || null }),
      })
      toast.success("به‌روزرسانی شد")
      setEditId(null)
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
        <p className="text-sm text-muted-foreground">{quotes.length} نقل‌قول</p>
        <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Plus className="h-4 w-4" /> نقل‌قول جدید
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card title="افزودن نقل‌قول">
              <Field label="متن"><Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={3} /></Field>
              <Field label="منبع/نویسنده (اختیاری)"><Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></Field>
              <div className="flex gap-2">
                <button onClick={add} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2 text-sm font-medium text-ivory disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} ذخیره
                </button>
                <button onClick={() => setAdding(false)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]"><X className="h-4 w-4 inline" /></button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50 p-4">
            {editId === q.id && editDraft ? (
              <div className="space-y-3">
                <Field label="متن"><Textarea value={editDraft.text} onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })} rows={3} /></Field>
                <Field label="منبع"><Input value={editDraft.author} onChange={(e) => setEditDraft({ ...editDraft, author: e.target.value })} /></Field>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(q.id)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-1.5 text-xs font-medium text-ivory disabled:opacity-60">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} ذخیره
                  </button>
                  <button onClick={() => setEditId(null)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-1.5 text-xs text-[oklch(0.36_0.07_168)]"><X className="h-3.5 w-3.5 inline" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <QuoteIcon className="h-5 w-5 shrink-0 text-[oklch(0.74_0.135_82/0.5)] mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-7 text-foreground/80 line-clamp-3">{q.text}</p>
                  {q.author && <p className="mt-1 text-xs text-muted-foreground">— {q.author}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(q.id); setEditDraft({ text: q.text, author: q.author ?? "" }) }} className="p-2 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(q.id)} className="p-2 text-muted-foreground hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {quotes.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">هنوز نقل‌قولی ثبت نشده است.</p>
        )}
      </div>
    </div>
  )
}
