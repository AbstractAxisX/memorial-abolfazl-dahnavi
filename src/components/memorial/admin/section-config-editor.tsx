"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { ImageUpload } from "./image-upload"
import { Card, Field, Input, Textarea, Select } from "./settings-editor"
import type { Page } from "@/lib/store"

type Item = { type: string; url: string; thumb?: string | null; caption?: string | null; description?: string | null }

const ICON_CHOICES = ["Sparkles", "Heart", "Baby", "HandHeart", "ShieldPlus", "Flame", "Award", "Star", "GraduationCap", "Medal", "Sprout", "TreePine", "Gift", "BookOpen", "Clock", "MapPin"]

export function SectionConfigEditor({
  type,
  config,
  onChange,
  pages,
  categories = [],
}: {
  type: string
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  pages: Page[]
  categories?: string[]
}) {
  const c = config as Record<string, unknown>
  const up = (patch: Record<string, unknown>) => onChange({ ...c, ...patch })

  switch (type) {
    case "hero":
      return <HeroEditor c={c} up={up} pages={pages} />
    case "text":
      return <TextEditor c={c} up={up} />
    case "image":
      return <ImageEditor c={c} up={up} />
    case "gallery":
      return <GalleryEditor c={c} up={up} categories={categories} />
    case "slider":
      return <SliderEditor c={c} up={up} categories={categories} />
    case "video":
      return <VideoEditor c={c} up={up} />
    case "timeline":
      return <TimelineEditor c={c} up={up} />
    case "quotes":
      return <QuotesEditor c={c} up={up} />
    case "guestbook":
      return <p className="text-sm text-muted-foreground">این بخش نیازی به تنظیمات ندارد. پیام‌ها از بخش «پیام‌ها» مدیریت می‌شوند.</p>
    case "blogList":
      return <BlogListEditor c={c} up={up} />
    case "cta":
      return <CtaEditor c={c} up={up} pages={pages} />
    case "divider":
      return (
        <Field label="نوع جداکننده">
          <Select value={(c.variant as string) || "ornament"} onChange={(e) => up({ variant: e.target.value })}>
            <option value="ornament">تزئینی (آرامایش)</option>
            <option value="plain">خط ساده</option>
          </Select>
        </Field>
      )
    default:
      return <p className="text-sm text-muted-foreground">ویرایشگر این نوع پیاده‌سازی نشده است.</p>
  }
}

function HeroEditor({ c, up, pages }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void; pages: Page[] }) {
  const btns = (c.ctaButtons as { label: string; pageSlug: string }[]) || []
  return (
    <Field label="دکمه‌های فراخوان (CTA)">
      <div className="space-y-2">
        {btns.map((b, i) => (
          <div key={i} className="flex gap-2">
            <Input value={b.label} onChange={(e) => { const n = [...btns]; n[i] = { ...n[i], label: e.target.value }; up({ ctaButtons: n }) }} placeholder="متن دکمه" />
            <Select value={b.pageSlug} onChange={(e) => { const n = [...btns]; n[i] = { ...n[i], pageSlug: e.target.value }; up({ ctaButtons: n }) }} className="w-40">
              {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </Select>
            <button onClick={() => up({ ctaButtons: btns.filter((_, j) => j !== i) })} className="shrink-0 text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.1)] rounded p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => up({ ctaButtons: [...btns, { label: "دکمه جدید", pageSlug: pages[0]?.slug ?? "" }] })} className="inline-flex items-center gap-1 text-xs text-[oklch(0.36_0.07_168)] hover:underline"><Plus className="h-3.5 w-3.5" /> افزودن دکمه</button>
      </div>
    </Field>
  )
}

function TextEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="متن (Enter = پاراگراف جدید)"><Textarea value={(c.content as string) || ""} onChange={(e) => up({ content: e.target.value })} rows={6} /></Field>
      <Field label="چیدمان">
        <Select value={(c.layout as string) || "full"} onChange={(e) => up({ layout: e.target.value })}>
          <option value="full">تمام‌عرض (متن یا متن+تصویر پایین)</option>
          <option value="half-left">تصویر کنار متن (راست)</option>
          <option value="half-right">تصویر کنار متن (چپ)</option>
        </Select>
      </Field>
      <Field label="تصویر (اختیاری)"><ImageUpload value={(c.image as string) || null} onChange={(v) => up({ image: v })} aspect="aspect-video w-full max-w-md" /></Field>
    </div>
  )
}

function ImageEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="تصویر"><ImageUpload value={(c.url as string) || null} onChange={(v) => up({ url: v })} aspect="aspect-video w-full max-w-md" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="کپشن"><Input value={(c.caption as string) || ""} onChange={(e) => up({ caption: e.target.value })} /></Field>
        <Field label="متن جایگزین (alt)"><Input value={(c.alt as string) || ""} onChange={(e) => up({ alt: e.target.value })} /></Field>
      </div>
      <Field label="توضیح (زیر کپشن)"><Textarea value={(c.description as string) || ""} onChange={(e) => up({ description: e.target.value })} rows={2} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="اندازه"><Select value={(c.size as string) || "md"} onChange={(e) => up({ size: e.target.value })}><option value="sm">کوچک</option><option value="md">متوسط</option><option value="lg">بزرگ</option><option value="full">تمام‌عرض</option></Select></Field>
        <Field label="تراز"><Select value={(c.align as string) || "center"} onChange={(e) => up({ align: e.target.value })}><option value="center">مرکز</option><option value="left">چپ</option><option value="right">راست</option></Select></Field>
      </div>
    </div>
  )
}

function ItemsEditor({ c, up, withDescription, showColumns }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void; withDescription?: boolean; showColumns?: boolean }) {
  const items = (c.items as Item[]) || []
  const move = (i: number, d: number) => {
    const t = i + d
    if (t < 0 || t >= items.length) return
    const n = [...items]
    ;[n[i], n[t]] = [n[t], n[i]]
    up({ items: n })
  }
  return (
    <div className="space-y-3">
      {showColumns && (
        <Field label="تعداد ستون‌ها">
          <Select value={String(c.columns ?? 3)} onChange={(e) => up({ columns: Number(e.target.value) })}>
            <option value="2">۲ ستون</option>
            <option value="3">۳ ستون</option>
            <option value="4">۴ ستون</option>
          </Select>
        </Field>
      )}
      {c.filterable !== undefined && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!c.filterable} onChange={(e) => up({ filterable: e.target.checked })} className="accent-[oklch(0.36_0.07_168)]" />
          نمایش دکمه‌های فیلتر (همه/عکس/ویدیو)
        </label>
      )}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/40 p-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30 p-0.5"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30 p-0.5"><ChevronDown className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2 items-center">
                  <Select value={it.type} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], type: e.target.value }; up({ items: n }) }} className="w-28">
                    <option value="photo">عکس</option>
                    <option value="video">ویدیو</option>
                  </Select>
                  {it.url && <img src={it.thumb || it.url} alt="" className="h-10 w-10 rounded object-cover border" />}
                  <span className="text-[11px] text-muted-foreground truncate" dir="ltr">{it.url}</span>
                  <button onClick={() => up({ items: items.filter((_, j) => j !== i) })} className="shrink-0 mr-auto text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.1)] rounded p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
                <ImageUpload value={it.url ?? null} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], url: v ?? "" }; up({ items: n }) }} accept={it.type === "video" ? "video/*" : "image/*"} aspect="aspect-video w-full" />
                <Input value={it.caption ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], caption: e.target.value }; up({ items: n }) }} placeholder="کپشن (اختیاری)" />
                {withDescription && <Textarea value={it.description ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; up({ items: n }) }} placeholder="توضیح (در لایت‌باکس نمایش داده می‌شود)" rows={2} />}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => up({ items: [...items, { type: "photo", url: "", caption: "" }] })} className="inline-flex items-center gap-1 text-xs text-[oklch(0.36_0.07_168)] hover:underline"><Plus className="h-3.5 w-3.5" /> افزودن مورد</button>
    </div>
  )
}

function GalleryEditor({ c, up, categories = [] }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void; categories?: string[] }) {
  const source = (c.source as string) || "manual"
  return (
    <div className="space-y-3">
      <Field label="منبع محتوا">
        <Select value={source} onChange={(e) => up({ source: e.target.value })}>
          <option value="manual">دستی (موارد را خودم اضافه می‌کنم)</option>
          <option value="media">کتابخانه رسانه (از فایل‌های آپلود شده)</option>
        </Select>
      </Field>
      {source === "media" && (
        <Field label="دسته (خالی = همه)">
          <Select value={(c.category as string) || ""} onChange={(e) => up({ category: e.target.value })}>
            <option value="">همه دسته‌ها</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </Select>
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!c.filterable} onChange={(e) => up({ filterable: e.target.checked })} className="accent-[oklch(0.39_0.085_168)]" />
        نمایش دکمه‌های فیلتر (همه/عکس/ویدیو)
      </label>
      {source === "manual" && <ItemsEditor c={c} up={up} withDescription />}
      {source === "media" && (
        <p className="text-[11px] text-muted-foreground leading-5">فایل‌ها از تب «رسانه» مدیریت می‌شوند. هر فایلی که آپلود کنید، در این گالری نمایش داده می‌شود.</p>
      )}
    </div>
  )
}

function SliderEditor({ c, up, categories = [] }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void; categories?: string[] }) {
  const source = (c.source as string) || "manual"
  return (
    <div className="space-y-3">
      <Field label="منبع محتوا">
        <Select value={source} onChange={(e) => up({ source: e.target.value })}>
          <option value="manual">دستی</option>
          <option value="media">کتابچه رسانه</option>
        </Select>
      </Field>
      {source === "media" && (
        <Field label="دسته">
          <Select value={(c.category as string) || ""} onChange={(e) => up({ category: e.target.value })}>
            <option value="">همه دسته‌ها</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="فاصله اسلاید (میلی‌ثانیه)"><Input type="number" value={String(c.interval ?? 4000)} onChange={(e) => up({ interval: Number(e.target.value) || 4000 })} /></Field>
        <Field label="ارتفاع"><Select value={(c.height as string) || "lg"} onChange={(e) => up({ height: e.target.value })}><option value="sm">کوتاه</option><option value="md">متوسط</option><option value="lg">بلند</option></Select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="افکت انتقال"><Select value={(c.transition as string) || "fade"} onChange={(e) => up({ transition: e.target.value })}><option value="fade">محو شدن</option><option value="slide">لغزش</option></Select></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.autoplay} onChange={(e) => up({ autoplay: e.target.checked })} className="accent-[oklch(0.39_0.085_168)]" /> پخش خودکار</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.arrows} onChange={(e) => up({ arrows: e.target.checked })} className="accent-[oklch(0.39_0.085_168)]" /> فلش‌ها</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.dots} onChange={(e) => up({ dots: e.target.checked })} className="accent-[oklch(0.39_0.085_168)]" /> نقاط</label>
      </div>
      {source === "manual" && <ItemsEditor c={c} up={up} />}
    </div>
  )
}

function VideoEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="فایل ویدیو"><ImageUpload value={(c.url as string) || null} onChange={(v) => up({ url: v })} accept="video/*" aspect="aspect-video w-full" /></Field>
      <Field label="پوستر (تصویر کاور)"><ImageUpload value={(c.poster as string) || null} onChange={(v) => up({ poster: v })} aspect="aspect-video w-full" /></Field>
      <Field label="عنوان"><Input value={(c.title as string) || ""} onChange={(e) => up({ title: e.target.value })} /></Field>
      <Field label="توضیح"><Textarea value={(c.description as string) || ""} onChange={(e) => up({ description: e.target.value })} rows={3} /></Field>
    </div>
  )
}

function TimelineEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  const events = (c.events as { date: string; title: string; description: string; icon: string }[]) || []
  const move = (i: number, d: number) => { const t = i + d; if (t < 0 || t >= events.length) return; const n = [...events]; [n[i], n[t]] = [n[t], n[i]]; up({ events: n }) }
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/40 p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30 p-0.5"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === events.length - 1} className="text-muted-foreground hover:text-[oklch(0.36_0.07_168)] disabled:opacity-30 p-0.5"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <Input value={e.date} onChange={(ev) => { const n = [...events]; n[i] = { ...n[i], date: ev.target.value }; up({ events: n }) }} placeholder="تاریخ" className="w-32" />
            <Input value={e.title} onChange={(ev) => { const n = [...events]; n[i] = { ...n[i], title: ev.target.value }; up({ events: n }) }} placeholder="عنوان" />
            <button onClick={() => up({ events: events.filter((_, j) => j !== i) })} className="shrink-0 text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.1)] rounded p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
          <Textarea value={e.description} onChange={(ev) => { const n = [...events]; n[i] = { ...n[i], description: ev.target.value }; up({ events: n }) }} placeholder="توضیح" rows={2} />
          <div className="flex flex-wrap gap-1">
            {ICON_CHOICES.map((ic) => (
              <button key={ic} onClick={() => { const n = [...events]; n[i] = { ...n[i], icon: ic }; up({ events: n }) }} className={`rounded px-2 py-0.5 text-[10px] ${e.icon === ic ? "bg-[oklch(0.36_0.07_168)] text-ivory" : "border border-[oklch(0.74_0.135_82/0.25)] text-muted-foreground"}`}>{ic}</button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => up({ events: [...events, { date: "تاریخ", title: "عنوان", description: "", icon: "Sparkles" }] })} className="inline-flex items-center gap-1 text-xs text-[oklch(0.36_0.07_168)] hover:underline"><Plus className="h-3.5 w-3.5" /> افزودن رویداد</button>
    </div>
  )
}

function QuotesEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  const quotes = (c.quotes as { text: string; author: string }[]) || []
  return (
    <div className="space-y-2">
      {quotes.map((q, i) => (
        <div key={i} className="rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/40 p-3 space-y-2">
          <Textarea value={q.text} onChange={(e) => { const n = [...quotes]; n[i] = { ...n[i], text: e.target.value }; up({ quotes: n }) }} placeholder="متن نقل قول" rows={2} />
          <div className="flex gap-2">
            <Input value={q.author} onChange={(e) => { const n = [...quotes]; n[i] = { ...n[i], author: e.target.value }; up({ quotes: n }) }} placeholder="منبع (اختیاری)" />
            <button onClick={() => up({ quotes: quotes.filter((_, j) => j !== i) })} className="shrink-0 text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.1)] rounded p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <button onClick={() => up({ quotes: [...quotes, { text: "", author: "" }] })} className="inline-flex items-center gap-1 text-xs text-[oklch(0.36_0.07_168)] hover:underline"><Plus className="h-3.5 w-3.5" /> افزودن نقل قول</button>
    </div>
  )
}

function BlogListEditor({ c, up }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="تعداد نوشته‌های نمایش داده شده"><Input type="number" value={String(c.count ?? 12)} onChange={(e) => up({ count: Number(e.target.value) || 12 })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.showExcerpt} onChange={(e) => up({ showExcerpt: e.target.checked })} className="accent-[oklch(0.36_0.07_168)]" /> نمایش خلاصه</label>
      <p className="text-[11px] text-muted-foreground">نوشته‌ها از تب «بلاگ» مدیریت می‌شوند.</p>
    </div>
  )
}

function CtaEditor({ c, up, pages }: { c: Record<string, unknown>; up: (p: Record<string, unknown>) => void; pages: Page[] }) {
  const title = (c.title as string) || ""
  const btns = (c.buttons as { label: string; pageSlug: string; variant: string }[]) || []
  return (
    <div className="space-y-3">
      <Field label="عنوان"><Input value={title} onChange={(e) => up({ title: e.target.value })} /></Field>
      <Field label="دکمه‌ها">
        <div className="space-y-2">
          {btns.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input value={b.label} onChange={(e) => { const n = [...btns]; n[i] = { ...n[i], label: e.target.value }; up({ buttons: n }) }} placeholder="متن" />
              <Select value={b.pageSlug} onChange={(e) => { const n = [...btns]; n[i] = { ...n[i], pageSlug: e.target.value }; up({ buttons: n }) }} className="w-36">{pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</Select>
              <Select value={b.variant} onChange={(e) => { const n = [...btns]; n[i] = { ...n[i], variant: e.target.value }; up({ buttons: n }) }} className="w-28"><option value="primary">اصلی</option><option value="outline">کادردار</option></Select>
              <button onClick={() => up({ buttons: btns.filter((_, j) => j !== i) })} className="shrink-0 text-[oklch(0.52_0.18_25)] hover:bg-[oklch(0.52_0.18_25/0.1)] rounded p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => up({ buttons: [...btns, { label: "دکمه", pageSlug: pages[0]?.slug ?? "", variant: "primary" }] })} className="inline-flex items-center gap-1 text-xs text-[oklch(0.36_0.07_168)] hover:underline"><Plus className="h-3.5 w-3.5" /> افزودن دکمه</button>
        </div>
      </Field>
    </div>
  )
}

// unused but kept for potential reuse
export const _Card = Card
