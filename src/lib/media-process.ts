import path from "path"
import { mkdir, access } from "fs/promises"
import { execFile } from "child_process"
import sharp from "sharp"
import { storageDir } from "./storage"

/**
 * Shared media-processing helpers for the upload pipeline
 * (used by /api/upload and /api/upload/stream).
 *
 * NOTE: this file was referenced by commit 3c0e9be but never pushed to the
 * repo (build failed with module-not-found). Recreated on the deploy
 * server. If you have your own local version, replace it — just keep the
 * exported API compatible:
 *   detectKind / processMedia / MAX_UPLOAD_BYTES / MAX_SIZE_LABEL
 */

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024 // 200MB
export const MAX_SIZE_LABEL = "۲۰۰ مگابایت"

export type FileKind = "font" | "image" | "video" | null

// ---------- real file-type detection (magic bytes) ----------

export function detectKind(buf: Buffer, ext: string): FileKind {
  if (buf.length < 12) return null
  // images
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ext === "jpg" || ext === "jpeg" ? "image" : null
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ext === "png" ? "image" : null
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return ext === "gif" ? "image" : null
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return ext === "webp" ? "image" : null
  // videos (mp4/mov: ....ftyp)
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") return ["mp4", "mov", "webm"].includes(ext) ? "video" : null
  // webm (mkv family starts with 0x1A45DFA3)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return ext === "webm" ? "video" : null
  // fonts
  const ttfMagic = buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00
  const otfMagic = buf.subarray(0, 4).toString("ascii") === "OTTO"
  const ttcf = buf.subarray(0, 4).toString("ascii") === "ttcf"
  if (ttfMagic || otfMagic || ttcf) return ext === "ttf" || ext === "otf" ? "font" : null
  return null
}

// ---------- helpers ----------

function run(
  cmd: string,
  args: string[],
  timeoutMs = 60000
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: -1, stdout: "", stderr: "timeout" }), timeoutMs)
    execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(t)
      resolve({ code: err ? 1 : 0, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function makeThumb(srcPath: string, destPath: string): Promise<{ w: number; h: number } | null> {
  try {
    const meta = await sharp(srcPath)
      .rotate()
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(destPath)
    return { w: meta.width ?? 480, h: meta.height ?? 480 }
  } catch {
    return null
  }
}

async function videoInfo(
  srcPath: string,
  posterPath: string
): Promise<{ ok: boolean; w: number; h: number }> {
  // real dimensions via ffprobe
  const probe = await run(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", srcPath],
    15000
  )
  let w = 0
  let h = 0
  if (probe.code === 0) {
    const parts = probe.stdout.trim().split(",")
    w = Number(parts[0]) || 0
    h = Number(parts[1]) || 0
  }
  // poster frame via ffmpeg (no/old ffmpeg → no poster, not an error)
  let ok = false
  const poster = await run(
    "ffmpeg",
    ["-y", "-v", "error", "-ss", "0.5", "-i", srcPath, "-frames:v", "1", "-vf", "scale=min(480\\,iw):-2", posterPath],
    60000
  )
  if (poster.code === 0 && (await exists(posterPath))) ok = true
  return { ok, w, h }
}

/**
 * Images → WebP thumbnail (480px inside) + real dimensions.
 * Videos → JPG poster frame + real dimensions (poster requires ffmpeg).
 */
export async function processMedia(
  filepath: string,
  kind: "image" | "video",
  basename: string
): Promise<{ thumb: string | null; width: number | null; height: number | null }> {
  const thumbsDir = path.join(storageDir("uploads"), "thumbs")
  await mkdir(thumbsDir, { recursive: true })

  if (kind === "image") {
    const thumbPath = path.join(thumbsDir, `${basename}.webp`)
    const meta = await makeThumb(filepath, thumbPath)
    return { thumb: `/uploads/thumbs/${basename}.webp`, width: meta?.w ?? null, height: meta?.h ?? null }
  }

  const posterPath = path.join(thumbsDir, `${basename}.jpg`)
  const info = await videoInfo(filepath, posterPath)
  return {
    thumb: info.ok ? `/uploads/thumbs/${basename}.jpg` : null,
    width: info.w || null,
    height: info.h || null,
  }
}
