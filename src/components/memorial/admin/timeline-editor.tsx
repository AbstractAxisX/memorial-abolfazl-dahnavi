"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, Pencil, X, Check } from "lucide-react"
import { toast } from "sonner"
import type { TimelineEvent } from "@/lib/store"
import { Card, Field, Input, Textarea } from "./settings-editor"

const ICONS = ["Sparkles", "Heart", "Baby", "HandHeart", "ShieldPlus", "Flame", "Award", "Star", "GraduationCap", "Medal", "HandHelping", "Sprout"]

export function TimelineEditor({
  events,
  onChanged,
}: {
  events: TimelineEvent[]
  onChanged: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ date: "", title: "", description: "", icon: "Sparkles" })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ date: string; title: string; description: string; icon: string } | null>(null)

  const add = async () => {
    if (!draft.title.trim()) return toast.error("عنوان الزامی است")
    setSaving(true)
    try {
      const res = await fetch("/api/admin/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error("افزودن ناموفق بود")
      toast.success("افزوده شد")
      setDraft({ date: "", title: "", description: "", icon: "Sparkles" })
      setAdding(false)
      await onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return
    await fetch(`/api/admin/timeline/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    await onChanged()
  }

  const move = async (id: string, dir: -1 | 1) => {
    const idx = events.findIndex((e) => e.id === id)
    const target = idx + dir
    if (target < 0 || target >= events.length) return
    const a = events[idx]
    const b = events[target]
    await Promise.all([
      fetch(`/api/admin/timeline/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/timeline/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ])
    await onChanged()
  }

  const saveEdit = async (id: string) => {
    if (!editDraft) return
    setSaving(true)
    try {
      await fetch(`/api/admin/timeline/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
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

  const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {ICONS.map((ic) => (
        <button
          key={ic}
          type="button"
          onClick={() => onChange(ic)}
          className={`rounded-lg px-2 py-1 text-[11px] transition ${value === ic ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.25)] text-muted-foreground hover:bg-ivory"}`}
        >
          {ic}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{events.length} رویداد</p>
        <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Plus className="h-4 w-4" /> رویداد جدید
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card title="افزودن رویداد">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="تاریخ/زمان"><Input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} placeholder="مثلاً: ۱۵ فروردین ۱۴۰۵" /></Field>
                <Field label="عنوان"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              </div>
              <Field label="توضیح"><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} /></Field>
              <Field label="آیکون"><IconPicker value={draft.icon} onChange={(v) => setDraft({ ...draft, icon: v })} /></Field>
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

      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={e.id} className="rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50 p-4">
            {editId === e.id && editDraft ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="تاریخ"><Input value={editDraft.date} onChange={(ev) => setEditDraft({ ...editDraft, date: ev.target.value })} /></Field>
                  <Field label="عنوان"><Input value={editDraft.title} onChange={(ev) => setEditDraft({ ...editDraft, title: ev.target.value })} /></Field>
                </div>
                <Field label="توضیح"><Textarea value={editDraft.description} onChange={(ev) => setEditDraft({ ...editDraft, description: ev.target.value })} rows={3} /></Field>
                <Field label="آیکون"><IconPicker value={editDraft.icon} onChange={(v) => setEditDraft({ ...editDraft, icon: v })} /></Field>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(e.id)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-1.5 text-xs font-medium text-ivory disabled:opacity-60">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} ذخیره
                  </button>
                  <button onClick={() => setEditId(null)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-1.5 text-xs text-[oklch(0.36_0.07_168)]"><X className="h-3.5 w-3.5 inline" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  <button onClick={() => move(e.id, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                  <button onClick={() => move(e.id, 1)} disabled={i === events.length - 1} className="p-1 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[oklch(0.92_0.035_82)] px-2 py-0.5 text-[11px] text-[oklch(0.36_0.07_168)]">{e.date}</span>
                    <span className="text-[10px] text-muted-foreground/60">[{e.icon}]</span>
                  </div>
                  <h4 className="mt-1 font-medium text-[oklch(0.36_0.07_168)]">{e.title}</h4>
                  {e.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(e.id); setEditDraft({ date: e.date, title: e.title, description: e.description ?? "", icon: e.icon }) }} className="p-2 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(e.id)} className="p-2 text-muted-foreground hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {events.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">هنوز رویدادی ثبت نشده است.</p>
        )}
      </div>
    </div>
  )
}
