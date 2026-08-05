"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Trash2, Loader2, Type, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, Field, Input } from "./settings-editor"

export function FontManager({ onChanged }: { onChanged: () => Promise<void> }) {
  const [name, setName] = useState("")
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fonts, setFonts] = useState<{ id: string; name: string; label: string; url: string }[]>([])
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/admin/fonts", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setFonts(data.items)
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }

  if (!loaded) load()

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || "آپلود ناموفق")
      }
      const data = (await res.json()) as { url: string }
      setUrl(data.url)
      // suggest name/label from filename
      const base = file.name.replace(/\.[^.]+$/, "")
      if (!name) {
        const safe = base.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30) || "MyFont"
        setName(safe)
      }
      if (!label) setLabel(base)
      toast.success("فایل آپلود شد — حالا نام و برچسب را تنظیم و ذخیره کنید")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!url) { toast.error("ابتدا فایل TTF را آپلود کنید"); return }
    if (!name.trim() || !label.trim()) { toast.error("نام فنی و برچسب الزامی است"); return }
    if (!name.match(/^[a-zA-Z0-9_-]+$/)) { toast.error("نام فنی فقط حروف انگلیسی، عدد، خط تیره و زیرخط"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), label: label.trim(), url }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || "ذخیره ناموفق")
      }
      toast.success("فونت نصب شد 🎉")
      setName(""); setLabel(""); setUrl(null)
      await onChanged()
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string, label: string) => {
    if (!confirm(`فونت «${label}» حذف شود؟ فایل فیزیکی هم پاک می‌شود.`)) return
    await fetch(`/api/admin/fonts/${id}`, { method: "DELETE" })
    toast.success("حذف شد")
    await onChanged()
    load()
  }

  return (
    <div className="space-y-4">
      <Card title="نصب فونت جدید" subtitle="فایل TTF یا OTF را آپلود کنید — بدون نیاز به CDN">
        <input
          ref={inputRef}
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ""
          }}
        />
        {url ? (
          <div className="flex items-center gap-3 rounded-xl border border-[oklch(0.74_0.135_82/0.3)] bg-[oklch(0.92_0.035_82/0.4)] p-3">
            <Type className="h-5 w-5 text-[oklch(0.36_0.07_168)]" />
            <span className="flex-1 text-sm text-[oklch(0.36_0.07_168)]">فایل آپلود شد ✓</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-32" dir="ltr">{url}</span>
            <button onClick={() => setUrl(null)} className="text-xs text-[oklch(0.52_0.18_25)] hover:underline">حذف</button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[oklch(0.74_0.135_82/0.3)] bg-ivory/50 py-8 text-muted-foreground transition hover:border-[oklch(0.74_0.135_82/0.6)] hover:bg-ivory disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.74_0.135_82)]" /> : <Upload className="h-6 w-6 text-[oklch(0.74_0.135_82/0.6)]" />}
            <span className="text-sm">{uploading ? "در حال آپلود..." : "انتخاب فایل TTF/OTF"}</span>
          </button>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام فنی (انگلیسی، بدون فاصله)">
            <Input value={name} onChange={(e) => setName(e.target.value)} dir="ltr" placeholder="MyNastaliq" />
          </Field>
          <Field label="برچسب نمایشی (فارسی)">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="نستعلیق اختصاصی" />
          </Field>
        </div>
        {url && (
          <div className="rounded-xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/40 p-4">
            <p className="mb-2 text-xs text-muted-foreground">پیش‌نمایش:</p>
            <p className="text-2xl" style={{ fontFamily: `'${name}', sans-serif` }}>بسم الله الرحمن الرحیم</p>
            <p className="mt-1 text-sm" style={{ fontFamily: `'${name}', sans-serif` }}>شهید ابوالفضل دهنوی — امدادگر هلال احمر</p>
          </div>
        )}
        <button
          onClick={save}
          disabled={saving || !url}
          className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-5 py-2.5 text-sm font-medium text-ivory shadow-md shadow-[oklch(0.36_0.07_168/0.3)] transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Type className="h-4 w-4" />}
          نصب فونت
        </button>
        <div className="flex items-start gap-2 rounded-xl bg-[oklch(0.92_0.035_82/0.3)] p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-[oklch(0.6_0.1_70)]" />
          <p>پس از نصب، این فونت در انتخابگر فونت (تنظیمات سایت و هر بخش) با برچسب «(سفارشی)» ظاهر می‌شود. فونت‌های سفارشی به‌صورت محلی روی همان دامنه ذخیره می‌شوند و به هیچ CDN وابسته نیستند.</p>
        </div>
      </Card>

      <div>
        <h3 className="mb-3 font-display text-lg emerald-text">فونت‌های نصب‌شده ({fonts.length})</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {fonts.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] bg-ivory/50 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.92_0.035_82)] text-[oklch(0.36_0.07_168)]"><Type className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[oklch(0.36_0.07_168)]">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{f.name}</p>
                  <p className="mt-1 text-lg" style={{ fontFamily: `'${f.name}', sans-serif` }}>ابوالفضل دهنوی</p>
                </div>
                <button onClick={() => remove(f.id, f.label)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[oklch(0.52_0.18_25/0.1)] hover:text-[oklch(0.52_0.18_25)]"><Trash2 className="h-4 w-4" /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          {fonts.length === 0 && loaded && (
            <p className="rounded-2xl border border-dashed border-[oklch(0.74_0.135_82/0.25)] py-10 text-center text-sm text-muted-foreground">هنوز فونت سفارشی نصب نشده است.</p>
          )}
        </div>
      </div>
    </div>
  )
}
