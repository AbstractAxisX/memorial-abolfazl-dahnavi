"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Loader2, ChevronUp, ChevronDown, Pencil, X, Copy, Eye, EyeOff, Save, FileText, Settings2,
} from "lucide-react"
import { toast } from "sonner"
import type { Page, Section } from "@/lib/store"
import { SECTION_TYPES, SECTION_TYPE_MAP, SECTION_BACKGROUNDS, sectionTypeLabel } from "@/lib/section-types"
import { IconEl } from "@/lib/icon-registry"
import { fontLabel } from "@/lib/fonts"
import { Card, Field, Input, Select, FontPicker } from "./settings-editor"
import { SectionConfigEditor } from "./section-config-editor"
import { toPersianDigits } from "../biography-view"
import { useMemorial } from "@/lib/store"
import type { FontFile } from "@/lib/store"

const NAV_ICONS = ["Home", "BookOpen", "Images", "Clock", "Heart", "Newspaper", "FileText", "Flame", "Star", "Award", "Sparkles", "Image", "Video", "Quote", "MessageSquareHeart", "TreePine"]

export function PageManager({ onChanged, customFonts = [] }: { onChanged: () => Promise<void>; customFonts?: FontFile[] }) {
  const { data } = useMemorial()
  const pages = data?.pages ?? []
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [addingPage, setAddingPage] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [addingSection, setAddingSection] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Partial<Section>>>({})

  const selected = pages.find((p) => p.slug === selectedSlug) ?? pages[0]

  const addPage = async () => {
    if (!newTitle.trim()) { toast.error("عنوان الزامی است"); return }
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), navIcon: "FileText", showInNav: true }),
      })
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "ناموفق") }
      toast.success("صفحه اضافه شد")
      setNewTitle(""); setAddingPage(false)
      await onChanged()
    } catch (e) { toast.error((e as Error).message) }
  }

  const movePage = async (slug: string, dir: -1 | 1) => {
    const idx = pages.findIndex((p) => p.slug === slug)
    const t = idx + dir
    if (t < 0 || t >= pages.length) return
    const order = pages.map((p) => p.slug)
    ;[order[idx], order[t]] = [order[t], order[idx]]
    await fetch("/api/admin/pages/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) })
    await onChanged()
  }

  const deletePage = async (slug: string) => {
    if (!confirm("این صفحه و همه‌ی بخش‌هایش حذف شود؟")) return
    const res = await fetch(`/api/admin/pages/${slug}`, { method: "DELETE" })
    if (!res.ok) { const d = await res.json().catch(() => null); toast.error(d?.error || "حذف ناموفق"); return }
    toast.success("صفحه حذف شد")
    if (selectedSlug === slug) setSelectedSlug(null)
    await onChanged()
  }

  const addSection = async (type: string) => {
    if (!selected) return
    const def = SECTION_TYPE_MAP[type]
    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selected.id, type, config: def?.defaultConfig() ?? {}, title: def?.label ?? type }),
    })
    if (!res.ok) { toast.error("افزودن ناموفق"); return }
    toast.success("بخش اضافه شد")
    setAddingSection(false)
    await onChanged()
    const created = (await res.json()) as { item: Section }
    setEditingSectionId(created.item.id)
  }

  const moveSection = async (id: string, dir: -1 | 1) => {
    if (!selected) return
    const secs = [...selected.sections].sort((a, b) => a.order - b.order)
    const idx = secs.findIndex((s) => s.id === id)
    const t = idx + dir
    if (t < 0 || t >= secs.length) return
    ;[secs[idx], secs[t]] = [secs[t], secs[idx]]
    await fetch(`/api/admin/sections/${id}/reorder`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: secs.map((s) => s.id) }) })
    await onChanged()
  }

  const deleteSection = async (id: string) => {
    if (!confirm("این بخش حذف شود؟")) return
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    setEditingSectionId(null)
    await onChanged()
  }

  const duplicateSection = async (s: Section) => {
    if (!selected) return
    await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selected.id, type: s.type, title: s.title, subtitle: s.subtitle, config: JSON.parse(s.config), fontKey: s.fontKey, background: s.background }),
    })
    toast.success("کپی ساخته شد")
    await onChanged()
  }

  const toggleVisible = async (s: Section) => {
    await fetch(`/api/admin/sections/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible: !s.visible }) })
    await onChanged()
  }

  const savePageMeta = async () => {
    if (!selected) return
    const d = drafts[selected.slug]
    if (!d) return
    setSavingId(selected.slug)
    try {
      const res = await fetch(`/api/admin/pages/${selected.slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      if (!res.ok) { const j = await res.json().catch(() => null); throw new Error(j?.error || "ناموفق") }
      toast.success("صفحه به‌روزرسانی شد")
      setDrafts((p) => { const n = { ...p }; delete n[selected.slug]; return n })
      await onChanged()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSavingId(null) }
  }

  const saveSection = async (s: Section) => {
    setSavingId(s.id)
    try {
      const d = drafts[s.id] ?? {}
      const body: Record<string, unknown> = {}
      if (d.type !== undefined) body.type = d.type
      if (d.title !== undefined) body.title = d.title
      if (d.subtitle !== undefined) body.subtitle = d.subtitle
      if (d.fontKey !== undefined) body.fontKey = d.fontKey
      if (d.background !== undefined) body.background = d.background
      if (d.config !== undefined) body.config = d.config
      const res = await fetch(`/api/admin/sections/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("ذخیره ناموفق")
      toast.success("بخش ذخیره شد")
      setDrafts((p) => { const n = { ...p }; delete n[s.id]; return n })
      await onChanged()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSavingId(null) }
  }

  const patch = (id: string, p: Partial<Section>) => setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...p } }))
  const patchPage = (slug: string, p: Partial<Page>) => setDrafts((prev) => ({ ...prev, [slug]: { ...(prev[slug] ?? {}), ...p } }))

  if (pages.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">صفحه‌ای وجود ندارد.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{toPersianDigits(pages.length)} صفحه</p>
        <button onClick={() => setAddingPage((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
          <Plus className="h-4 w-4" /> صفحه جدید
        </button>
      </div>

      <AnimatePresence>
        {addingPage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card title="افزودن صفحه جدید">
              <Field label="عنوان صفحه"><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="مثلاً: مراسم یادبود" /></Field>
              <div className="flex gap-2">
                <button onClick={addPage} className="rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm text-ivory">ایجاد</button>
                <button onClick={() => setAddingPage(false)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">انصراف</button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {pages.map((p) => {
          const active = selected?.slug === p.slug
          return (
            <div key={p.slug} className="relative shrink-0">
              <button onClick={() => { setSelectedSlug(p.slug); setEditingSectionId(null) }} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-[oklch(0.36_0.07_168)] text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.25)]" : "border border-[oklch(0.74_0.135_82/0.2)] bg-ivory text-[oklch(0.36_0.07_168)] hover:bg-[oklch(0.95_0.018_82)]"}`}>
                <IconEl name={p.navIcon} className="h-4 w-4" /> {p.title}
                {p.isHome && <span className="rounded-full bg-white/20 px-1 text-[9px]">خانه</span>}
              </button>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="space-y-4">
          {/* Page meta */}
          <Card title={`ویرایش صفحه: ${selected.title}`} subtitle="تنظیمات نمایش در منو">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عنوان"><Input value={(drafts[selected.slug]?.title ?? selected.title) as string} onChange={(e) => patchPage(selected.slug, { title: e.target.value })} /></Field>
              <Field label="زیرعنوان"><Input value={(drafts[selected.slug]?.subtitle ?? selected.subtitle ?? "") as string} onChange={(e) => patchPage(selected.slug, { subtitle: e.target.value })} /></Field>
              <Field label="آیکون منو">
                <div className="flex flex-wrap gap-1">
                  {NAV_ICONS.map((ic) => {
                    const cur = (drafts[selected.slug]?.navIcon ?? selected.navIcon) as string
                    return <button key={ic} onClick={() => patchPage(selected.slug, { navIcon: ic })} className={`flex h-8 w-8 items-center justify-center rounded-lg ${cur === ic ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.25)] text-muted-foreground"}`}><IconEl name={ic} className="h-4 w-4" /></button>
                  })}
                </div>
              </Field>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={drafts[selected.slug]?.showInNav ?? selected.showInNav} onChange={(e) => patchPage(selected.slug, { showInNav: e.target.checked })} className="accent-[oklch(0.36_0.07_168)]" /> نمایش در منو</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={drafts[selected.slug]?.isHome ?? selected.isHome} onChange={(e) => patchPage(selected.slug, { isHome: e.target.checked })} className="accent-[oklch(0.36_0.07_168)]" /> صفحه خانه</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={savePageMeta} disabled={savingId === selected.slug} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm text-ivory disabled:opacity-60">{savingId === selected.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره صفحه</button>
              <button onClick={() => movePage(selected.slug, -1)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] p-2 text-[oklch(0.36_0.07_168)]"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => movePage(selected.slug, 1)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] p-2 text-[oklch(0.36_0.07_168)]"><ChevronDown className="h-4 w-4" /></button>
              {!selected.isHome && <button onClick={() => deletePage(selected.slug)} className="mr-auto inline-flex items-center gap-1 rounded-full border border-[oklch(0.52_0.18_25/0.3)] px-3 py-2 text-sm text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.08)]"><Trash2 className="h-4 w-4" /> حذف صفحه</button>}
            </div>
          </Card>

          {/* Sections */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg emerald-text">بخش‌های این صفحه ({toPersianDigits(selected.sections.length)})</h3>
            <button onClick={() => setAddingSection((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95"><Plus className="h-4 w-4" /> بخش جدید</button>
          </div>

          <AnimatePresence>
            {addingSection && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card title="انتخاب نوع بخش" subtitle="نوع بخش را انتخاب کنید. بعداً قابل تغییر است.">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SECTION_TYPES.map((t) => {
                      return <button key={t.key} onClick={() => addSection(t.key)} className="flex flex-col items-center gap-1.5 rounded-xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory p-3 text-center transition hover:border-[oklch(0.74_0.135_82)] hover:shadow-md"><IconEl name="Sparkles" className="h-6 w-6 text-[oklch(0.36_0.07_168)]" /><span className="text-xs font-medium">{t.label}</span></button>
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {[...selected.sections].sort((a, b) => a.order - b.order).map((s, i) => {
              const def = SECTION_TYPE_MAP[s.type]

              const editing = editingSectionId === s.id
              const draft = drafts[s.id] ?? {}
              const curType = (draft.type ?? s.type) as string
              const curConfig = (() => {
                if (draft.config) return draft.config as Record<string, unknown>
                try { return JSON.parse(s.config) as Record<string, unknown> } catch { return {} }
              })()
              return (
                <div key={s.id} className={`rounded-2xl border p-3 ${editing ? "border-[oklch(0.74_0.135_82/0.4)] bg-ivory/60 shadow-md" : s.visible ? "border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50" : "border-dashed border-[oklch(0.74_0.135_82/0.2)] bg-ivory/30 opacity-70"}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]"><IconEl name="Sparkles" className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[oklch(0.36_0.07_168)] truncate">{(draft.title ?? s.title) || sectionTypeLabel(s.type)}</span>
                        <span className="rounded-full bg-[oklch(0.95_0.018_82)] px-1.5 py-0.5 text-[10px] text-muted-foreground">{sectionTypeLabel(s.type)}</span>
                        {s.fontKey && <span className="rounded-full bg-[oklch(0.92_0.035_82)] px-1.5 py-0.5 text-[10px] text-[oklch(0.36_0.07_168)]">{fontLabel(s.fontKey)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} className="p-1.5 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                      <button onClick={() => moveSection(s.id, 1)} disabled={i === selected.sections.length - 1} className="p-1.5 text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                      <button onClick={() => toggleVisible(s)} className="p-1.5 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]">{s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                      <button onClick={() => duplicateSection(s)} className="p-1.5 text-muted-foreground hover:text-[oklch(0.74_0.135_82)]"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => setEditingSectionId(editing ? null : s.id)} className={`p-1.5 ${editing ? "text-[oklch(0.36_0.07_168)]" : "text-muted-foreground hover:text-[oklch(0.74_0.135_82)]"}`}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteSection(s.id)} className="p-1.5 text-muted-foreground hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {editing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-3 border-t border-[oklch(0.74_0.135_82/0.15)] pt-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="عنوان بخش"><Input value={(draft.title ?? s.title ?? "") as string} onChange={(e) => patch(s.id, { title: e.target.value })} placeholder="عنوان (اختیاری)" /></Field>
                          <Field label="زیرعنوان"><Input value={(draft.subtitle ?? s.subtitle ?? "") as string} onChange={(e) => patch(s.id, { subtitle: e.target.value })} placeholder="زیرعنوان (اختیاری)" /></Field>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="نوع بخش">
                            <Select value={curType} onChange={(e) => { const nt = e.target.value; const ndef = SECTION_TYPE_MAP[nt]; if (confirm(`نوع بخش به «${ndef?.label}» تغییر کند؟ تنظیمات فعلی از بین می‌رود.`)) patch(s.id, { type: nt, config: ndef?.defaultConfig() ?? {} }) }}>
                              {SECTION_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </Select>
                          </Field>
                          <Field label="فونت این بخش">
                            <div className="flex gap-1">
                              <FontPicker value={(draft.fontKey ?? s.fontKey ?? "") as string} onChange={(v) => patch(s.id, { fontKey: v || null })} customFonts={customFonts} />
                            </div>
                            {s.fontKey && <button onClick={() => patch(s.id, { fontKey: null })} className="text-[10px] text-muted-foreground hover:underline">استفاده از پیش‌فرض</button>}
                          </Field>
                          <Field label="پس‌زمینه">
                            <Select value={(draft.background ?? s.background) as string} onChange={(e) => patch(s.id, { background: e.target.value })}>
                              {SECTION_BACKGROUNDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                            </Select>
                          </Field>
                        </div>
                        <div className="rounded-xl border border-[oklch(0.74_0.135_82/0.15)] bg-ivory/40 p-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" /> تنظیمات اختصاصی ({sectionTypeLabel(curType)})</p>
                          <SectionConfigEditor type={curType} config={curConfig} onChange={(cfg) => patch(s.id, { config: cfg })} pages={pages} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveSection(s)} disabled={savingId === s.id} className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm text-ivory disabled:opacity-60">{savingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره بخش</button>
                          <button onClick={() => setEditingSectionId(null)} className="rounded-full border border-[oklch(0.74_0.135_82/0.3)] px-4 py-2 text-sm text-[oklch(0.36_0.07_168)]">بستن</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
            {selected.sections.length === 0 && !addingSection && (
              <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">این صفحه هنوز بخشی ندارد. روی «بخش جدید» بزنید.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
