/**
 * Client-side upload formatting helpers (Persian digits).
 * Used by the admin upload components + upload-center.
 */

export type UploadProgressInfo = {
  /** 0..100 */
  percent: number
  /** bytes sent */
  loaded: number
  /** total bytes */
  total: number
  /** smoothed bytes/second */
  speedBps: number
  /** estimated seconds remaining */
  etaSeconds: number
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

/** Latin digits → Persian digits (also converts "." and "," separators) */
export function faNum(value: number | string): string {
  return String(value)
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)])
    .replace(/\./g, "٫")
    .replace(/,/g, "٬")
}

/** ۱۲۳ بایت / ۱٫۲ مگابایت … */
export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "۰"
  if (bytes < 1024) return `${faNum(Math.round(bytes))} بایت`
  const units = ["کیلوبایت", "مگابایت", "گیگابایت"]
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  const str = v >= 100 ? String(Math.round(v)) : v.toFixed(1)
  return `${faNum(str)} ${units[i]}`
}

/** ۱٫۲ مگابایت/ثانیه */
export function fmtSpeed(bps: number): string {
  if (!bps || bps <= 0) return "…"
  return `${fmtBytes(bps)}/ثانیه`
}

/** ۳۰ ثانیه / ۲ دقیقه / ۱ ساعت … */
export function fmtEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "…"
  const s = Math.round(seconds)
  if (s < 60) return `${faNum(s)} ثانیه`
  const m = Math.floor(s / 60)
  if (m < 60) return `${faNum(m)} دقیقه`
  const h = Math.floor(m / 60)
  return `${faNum(h)} ساعت`
}
