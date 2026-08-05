"use client"

import { useState } from "react"
import { Save, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import type { SiteSetting } from "@/lib/store"
import { ImageUpload } from "./image-upload"
import { QrCodeGenerator } from "./qr-code"

export function SettingsEditor({ setting }: { setting: SiteSetting | null }) {
  const [form, setForm] = useState<Partial<SiteSetting>>(setting ?? {})
  const [saving, setSaving] = useState(false)

  const set = (k: keyof SiteSetting, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("ذخیره ناموفق بود")
      toast.success("تنظیمات ذخیره شد")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setForm(setting ?? {})

  return (
    <div className="space-y-6">
      {/* Hero block */}
      <Card title="بخش اصلی صفحه" subtitle="تصویر، نام و معرفی اولیه">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام کامل (نمایش در هدر)">
            <Input value={form.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} />
          </Field>
          <Field label="عنوان نمایشی (عنوان بزرگ)">
            <Input value={form.displayTitle ?? ""} onChange={(e) => set("displayTitle", e.target.value)} />
          </Field>
          <Field label="زیرعنوان">
            <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="سمت / نقش">
            <Input value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} />
          </Field>
          <Field label="تاریخ تولد">
            <Input value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} placeholder="مثلاً: ۱۳۶۹" />
          </Field>
          <Field label="تاریخ شهادت">
            <Input value={form.martyrdomDate ?? ""} onChange={(e) => set("martyrdomDate", e.target.value)} />
          </Field>
          <Field label="محل شهادت">
            <Input value={form.martyrdomPlace ?? ""} onChange={(e) => set("martyrdomPlace", e.target.value)} />
          </Field>
          <Field label="آدرس عمومی سایت (برای QR)">
            <Input value={form.publicUrl ?? ""} onChange={(e) => set("publicUrl", e.target.value)} dir="ltr" placeholder="https://..." />
          </Field>
        </div>
        <Field label="تصویر اصلی (پرتره)">
          <ImageUpload value={form.heroImage ?? null} onChange={(v) => set("heroImage", v)} aspect="aspect-square w-40" />
        </Field>
        <Field label="مقدمه کوتاه">
          <Textarea value={form.heroIntro ?? ""} onChange={(e) => set("heroIntro", e.target.value)} rows={3} />
        </Field>
      </Card>

      {/* QR */}
      <QrCodeGenerator key={setting?.publicUrl ?? "none"} publicUrl={setting?.publicUrl ?? null} />

      {/* Security */}
      <Card title="امنیت پنل" subtitle="تغییر رمز ورود به پنل مدیریت">
        <Field label="رمز عبور مدیریت">
          <Input value={form.adminPassword ?? ""} onChange={(e) => set("adminPassword", e.target.value)} dir="ltr" />
        </Field>
        <p className="text-[11px] text-muted-foreground/70 leading-5">
          این رمز برای ورود به پنل مدیریت استفاده می‌شود. آن را در جای امن نگه دارید.
        </p>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.135_82/0.3)] bg-ivory px-5 py-2.5 text-sm font-medium text-[oklch(0.36_0.07_168)] transition hover:bg-[oklch(0.95_0.018_82)] active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          بازنشانی
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.36_0.07_168)] px-6 py-2.5 text-sm font-medium text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.3)] transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </div>
  )
}

// Small shared primitives
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory/50 p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-display text-lg emerald-text">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-3 py-2 text-sm outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition ${props.className ?? ""}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-lg border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-3 py-2 text-sm leading-7 outline-none focus:border-[oklch(0.74_0.135_82)] focus:ring-2 focus:ring-[oklch(0.74_0.135_82/0.2)] transition ${props.className ?? ""}`}
    />
  )
}

export { Card, Field, Input, Textarea }
