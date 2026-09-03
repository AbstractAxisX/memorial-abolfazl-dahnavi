"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { enqueueUpload } from "./upload-center"
import { faNum, fmtBytes, fmtSpeed, type UploadProgressInfo } from "@/lib/upload-client"

export function ImageUpload({
  value,
  onChange,
  accept = "image/*",
  label,
  aspect = "aspect-video",
}: {
  value: string | null
  onChange: (url: string | null) => void
  accept?: string
  label?: string
  aspect?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [prog, setProg] = useState<UploadProgressInfo | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const upload = async (file: File) => {
    setUploading(true)
    setProg(null)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const data = await enqueueUpload(file, {
        signal: controller.signal,
        onProgress: (p) => setProg(p),
      })
      onChange(data.url)
      toast.success("فایل آپلود شد")
    } catch (e) {
      const err = e as Error
      if (err?.name === "AbortError") toast.info("آپلود لغو شد")
      else toast.error(err?.message || "آپلود ناموفق بود")
    } finally {
      abortRef.current = null
      setUploading(false)
      setProg(null)
    }
  }

  const isVideo = accept.includes("video")

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ""
        }}
      />
      {value ? (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-xl border border-[oklch(0.74_0.135_82/0.25)] bg-ivory`}>
          {isVideo && value.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={value} className="h-full w-full object-cover" controls preload="metadata" />
          ) : value.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={value} className="h-full w-full object-cover" muted preload="metadata" />
          ) : (
            <img src={value} alt="" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.12_0.02_165/0.7)] text-white backdrop-blur hover:bg-[oklch(0.12_0.02_165/0.9)]"
            aria-label="حذف"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[oklch(0.74_0.135_82/0.3)] bg-ivory/50 text-muted-foreground transition hover:border-[oklch(0.74_0.135_82/0.6)] hover:bg-ivory disabled:opacity-60`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.74_0.135_82)]" />
                <span className="text-xs font-medium text-[oklch(0.36_0.07_168)]">
                  {prog ? `${faNum(prog.percent)}٪ — ${fmtBytes(prog.loaded)} از ${fmtBytes(prog.total)}` : "در حال آپلود..."}
                </span>
              </>
            ) : (
              <>
                {isVideo ? <ImageIcon className="h-6 w-6 text-[oklch(0.74_0.135_82/0.6)]" /> : <Upload className="h-6 w-6 text-[oklch(0.74_0.135_82/0.6)]" />}
                <span className="text-xs">برای آپلود انتخاب کنید</span>
                <span className="text-[10px] text-muted-foreground/70">حداکثر ۲۰۰ مگابایت</span>
              </>
            )}
          </button>
          {uploading && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[oklch(0.93_0.02_82)]">
                <div
                  className="h-full rounded-full bg-[oklch(0.39_0.085_168)] transition-[width] duration-150"
                  style={{ width: `${prog?.percent ?? 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{prog && prog.speedBps > 0 ? fmtSpeed(prog.speedBps) : "در حال اتصال..."}</span>
                <button type="button" onClick={cancel} className="rounded-full px-2 py-0.5 text-[oklch(0.52_0.18_25)] transition hover:bg-[oklch(0.52_0.18_25/0.08)]">
                  لغو آپلود
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {value && !uploading && (
        <button type="button" onClick={() => inputRef.current?.click()} className="text-[11px] text-[oklch(0.36_0.07_168)] hover:underline">
          جایگزینی فایل
        </button>
      )}
    </div>
  )
}
