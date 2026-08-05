"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Download, Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function QrCodeGenerator({ publicUrl }: { publicUrl: string | null }) {
  const initial = publicUrl || (typeof window !== "undefined" ? window.location.origin : "")
  const [target, setTarget] = useState(initial)
  const [draftUrl, setDraftUrl] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [qrFor, setQrFor] = useState("")
  const mounted = useRef(true)

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  useEffect(() => {
    if (!target) return
    let cancelled = false
    QRCode.toDataURL(target, { errorCorrectionLevel: "H", margin: 2, width: 512, color: { dark: "#0e4d45", light: "#FBF8F3" } })
      .then((url) => { if (!cancelled && mounted.current) { setQr(url); setQrFor(target) } })
      .catch(() => {})
    return () => { cancelled = true }
  }, [target])

  const loading = target !== qrFor && !!target

  const download = () => {
    if (!qr) return
    const a = document.createElement("a")
    a.href = qr
    a.download = "qr-abolfazl-dahnavi.png"
    a.click()
    toast.success("فایل QR دانلود شد")
  }

  return (
    <div className="rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] bg-ivory/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-[oklch(0.74_0.135_82)]" />
        <h4 className="text-sm font-semibold text-[oklch(0.36_0.07_168)]">کد QR برای سنگ قبر</h4>
      </div>
      <p className="mb-4 text-xs text-muted-foreground leading-6">
        این کد را چاپ کرده و روی سنگ قبر نصب کنید. هر کس آن را اسکن کند، به این صفحه یادبود هدایت می‌شود. آدرس مقصد را در «آدرس عمومی سایت» (بالا) وارد کنید تا QR درست ساخته شود.
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-[oklch(0.74_0.135_82/0.2)] bg-white p-2 shadow-sm">
          {loading ? <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.74_0.135_82)]" /> : qr ? <img src={qr} alt="QR Code" className="h-full w-full" /> : <span className="text-xs text-muted-foreground">آدرسی وارد نشده</span>}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">آدرس مقصد QR</label>
            {editing ? (
              <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} dir="ltr" placeholder="https://example.com" className="mt-1 w-full rounded-lg border border-[oklch(0.74_0.135_82/0.25)] bg-ivory px-3 py-2 text-sm outline-none focus:border-[oklch(0.74_0.135_82)]" />
            ) : (
              <p className="mt-1 truncate rounded-lg border border-[oklch(0.74_0.135_82/0.15)] bg-ivory px-3 py-2 text-sm" dir="ltr">{target || "—"}</p>
            )}
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setTarget(draftUrl); setEditing(false) }} className="flex-1 rounded-lg bg-[oklch(0.36_0.07_168)] px-3 py-2 text-sm font-medium text-ivory transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">ساخت QR</button>
                <button onClick={() => { setDraftUrl(target); setEditing(false) }} className="rounded-lg border border-[oklch(0.74_0.135_82/0.3)] px-3 py-2 text-sm text-[oklch(0.36_0.07_168)]">لغو</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="flex-1 rounded-lg border border-[oklch(0.74_0.135_82/0.3)] px-3 py-2 text-sm font-medium text-[oklch(0.36_0.07_168)] transition hover:bg-[oklch(0.95_0.018_82)] active:scale-95">تغییر آدرس</button>
                <button onClick={download} disabled={!qr} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.36_0.07_168)] px-4 py-2 text-sm font-medium text-ivory disabled:opacity-50 transition hover:bg-[oklch(0.3_0.07_170)] active:scale-95">
                  <Download className="h-4 w-4" /> دانلود
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-5">راهنمایی: پس از انتشار سایت روی دامنه واقعی، آدرس را تنظیم و QR را دوباره بسازید. فایل ۵۱۲ پیکسلی برای چاپ مناسب است.</p>
        </div>
      </div>
    </div>
  )
}
