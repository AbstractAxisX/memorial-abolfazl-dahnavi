"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

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
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "آپلود ناموفق بود")
      }
      const data = (await res.json()) as { url: string }
      onChange(data.url)
      toast.success("فایل آپلود شد")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
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
            <video src={value} className="h-full w-full object-cover" controls />
          ) : value.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={value} className="h-full w-full object-cover" muted />
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[oklch(0.74_0.135_82/0.3)] bg-ivory/50 text-muted-foreground transition hover:border-[oklch(0.74_0.135_82/0.6)] hover:bg-ivory disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.74_0.135_82)]" />
              <span className="text-xs">در حال آپلود...</span>
            </>
          ) : (
            <>
              {isVideo ? <ImageIcon className="h-6 w-6 text-[oklch(0.74_0.135_82/0.6)]" /> : <Upload className="h-6 w-6 text-[oklch(0.74_0.135_82/0.6)]" />}
              <span className="text-xs">برای آپلود انتخاب کنید</span>
            </>
          )}
        </button>
      )}
      {value && (
        <button type="button" onClick={() => inputRef.current?.click()} className="text-[11px] text-[oklch(0.36_0.07_168)] hover:underline">
          جایگزینی فایل
        </button>
      )}
    </div>
  )
}
