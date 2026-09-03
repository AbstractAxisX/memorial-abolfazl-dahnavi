"use client"

import { useSyncExternalStore } from "react"
import { X, Check, AlertCircle, Upload } from "lucide-react"
import { faNum, fmtBytes, fmtSpeed, fmtEta, type UploadProgressInfo } from "@/lib/upload-client"

/**
 * Global upload manager (queue + progress/speed/ETA/cancel).
 *
 * NOTE: this file (and upload-client / media-process) was referenced by
 * commit 3c0e9be but never pushed — recreated on the deploy server.
 *
 * - enqueueUpload(file, opts) → Promise<{ url, type, thumb, mediaId }>
 *   Queues the file, max 3 concurrent uploads, XHR progress tracking,
 *   abort support (AbortSignal + cancel button).
 *   Uploads via the memory-flat /api/upload/stream endpoint and falls
 *   back to the classic multipart /api/upload if it is unavailable.
 * - <UploadManager /> — floating RTL progress panel (rendered in layout).
 */

export type UploadResult = {
  url: string
  type: string
  thumb?: string | null
  mediaId?: string
}

type Opts = {
  signal?: AbortSignal
  onProgress?: (p: UploadProgressInfo) => void
  category?: string
}

type Status = "queued" | "uploading" | "done" | "error"

type Entry = {
  id: string
  name: string
  size: number
  status: Status
  progress: UploadProgressInfo | null
  error?: string
  xhr?: XMLHttpRequest
  startedAt: number
}

// ---------- tiny external store ----------

let entries: Entry[] = []
const listeners = new Set<() => void>()
let version = 0
const notify = () => {
  version++
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const getSnapshot = () => version

const MAX_CONCURRENT = 3

type Job = {
  entry: Entry
  opts: Opts
  file: File
  resolve: (r: UploadResult) => void
  reject: (e: Error) => void
}

const waiting: Job[] = []
let inFlight = 0

function scheduleRemove(id: string, ms: number) {
  setTimeout(() => {
    entries = entries.filter((e) => e.id !== id)
    notify()
  }, ms)
}

function pump() {
  while (inFlight < MAX_CONCURRENT) {
    const job = waiting.shift()
    if (!job) return
    inFlight++
    startJob(job)
  }
}

function startJob(job: Job) {
  const { entry, opts, file, resolve, reject } = job
  entry.status = "uploading"
  entry.startedAt = Date.now()
  notify()

  const finishOk = (result: UploadResult) => {
    entry.status = "done"
    notify()
    scheduleRemove(entry.id, 4000)
    inFlight--
    resolve(result)
    pump()
  }
  const finishErr = (err: Error) => {
    if (err.name === "AbortError") {
      entries = entries.filter((e) => e.id !== entry.id)
      notify()
    } else {
      entry.status = "error"
      entry.error = err.message || "آپلود ناموفق بود"
      notify()
      scheduleRemove(entry.id, 12000)
    }
    inFlight--
    reject(err)
    pump()
  }

  const run = (url: string, body: File | FormData) => {
    const xhr = new XMLHttpRequest()
    entry.xhr = xhr
    xhr.open("POST", url)
    if (!(body instanceof FormData)) xhr.setRequestHeader("Content-Type", "application/octet-stream")

    let lastT = performance.now()
    let lastLoaded = 0
    let speed = 0

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable || ev.total === 0) return
      const now = performance.now()
      const dt = (now - lastT) / 1000
      if (dt > 0.35) {
        const inst = (ev.loaded - lastLoaded) / dt
        speed = speed > 0 ? speed * 0.7 + inst * 0.3 : inst
        lastT = now
        lastLoaded = ev.loaded
      }
      const percent = Math.min(100, Math.round((ev.loaded / ev.total) * 100))
      const etaSeconds = speed > 0 ? Math.max(0, (ev.total - ev.loaded) / speed) : 0
      entry.progress = {
        percent,
        loaded: ev.loaded,
        total: ev.total,
        speedBps: Math.round(speed),
        etaSeconds,
      }
      opts.onProgress?.(entry.progress)
      notify()
    }

    xhr.onload = () => {
      if (xhr.status === 404 && url.includes("/api/upload/stream")) {
        // streaming endpoint not deployed → classic multipart fallback
        const form = new FormData()
        form.append("file", file)
        if (opts.category) form.append("category", opts.category)
        run("/api/upload", form)
        return
      }
      let data: UploadResult & { error?: string } | null = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = null
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.url) {
        finishOk(data)
      } else {
        finishErr(new Error(data?.error || `آپلود ناموفق بود (${xhr.status})`))
      }
    }
    xhr.onerror = () => finishErr(new Error("خطای شبکه در آپلود"))
    xhr.onabort = () => {
      const e = new Error("لغو شد")
      e.name = "AbortError"
      finishErr(e)
    }

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort()
        return
      }
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(body)
  }

  const qs =
    `?name=${encodeURIComponent(file.name)}&size=${file.size}` +
    (opts.category ? `&category=${encodeURIComponent(opts.category)}` : "")
  run(`/api/upload/stream${qs}`, file)
}

export function enqueueUpload(file: File, opts: Opts = {}): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const entry: Entry = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "queued",
      progress: null,
      startedAt: 0,
    }
    entries.push(entry)
    notify()
    waiting.push({ entry, opts, file, resolve, reject })
    pump()
  })
}

// ---------- floating progress panel ----------

export function UploadManager() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (entries.length === 0) return null

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-[9999] flex w-72 flex-col gap-2">
      {entries.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/90"
        >
          <div className="flex items-center gap-2">
            {e.status === "done" ? (
              <Check className="h-4 w-4 shrink-0 text-[oklch(0.55_0.13_155)]" />
            ) : e.status === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-[oklch(0.52_0.18_25)]" />
            ) : (
              <Upload className="h-4 w-4 shrink-0 animate-pulse text-[oklch(0.74_0.135_82)]" />
            )}
            <span className="truncate text-xs font-medium">{e.name}</span>
            {e.status === "uploading" && e.xhr && (
              <button
                type="button"
                onClick={() => e.xhr?.abort()}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-[oklch(0.52_0.18_25)]"
                aria-label="لغو آپلود"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {(e.status === "uploading" || e.status === "queued") && (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[oklch(0.55_0.13_155)] transition-[width] duration-200"
                  style={{ width: `${e.progress?.percent ?? 0}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {e.status === "queued"
                    ? "در صف…"
                    : `${faNum(e.progress?.percent ?? 0)}٪ — ${fmtBytes(e.progress?.loaded ?? 0)} از ${fmtBytes(e.progress?.total ?? e.size)}`}
                </span>
                <span>
                  {e.progress && e.progress.speedBps > 0
                    ? `${fmtSpeed(e.progress.speedBps)} — ${fmtEta(e.progress.etaSeconds)}`
                    : ""}
                </span>
              </div>
            </>
          )}

          {e.status === "error" && e.error && (
            <p className="mt-1 text-[10px] leading-4 text-[oklch(0.52_0.18_25)]">{e.error}</p>
          )}
        </div>
      ))}
    </div>
  )
}
