import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { storageDir } from "@/lib/storage"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import sharp from "sharp"

const MAX_SIZE = 25 * 1024 * 1024

// ---------- real file-type detection (magic bytes) ----------

type FileKind = "font" | "image" | "video" | null

function detectKind(buf: Buffer, ext: string): FileKind {
  if (buf.length < 12) return null
  // images
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ext === "jpg" || ext === "jpeg" ? "image" : null
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ext === "png" ? "image" : null
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return ext === "gif" ? "image" : null
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) return ext === "webp" ? "image" : null
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

async function makeThumb(srcPath: string, destPath: string): Promise<{ w: number; h: number } | null> {
  try {
    const meta = await sharp(srcPath).rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(destPath)
    return { w: meta.width ?? 480, h: meta.height ?? 480 }
  } catch {
    return null
  }
}

// ---------- video pipeline (optional, only when ffmpeg exists) ----------
// Browsers can only decode h264/vp8/vp9/av1 — a video uploaded in any other
// codec (e.g. mpeg4/DivX from old cameras) would "load" but never play.
// When ffmpeg is available we transparently transcode to browser-safe
// H.264 + faststart and extract a poster frame for grid tiles.
import { execFile } from "child_process"

const BROWSER_SAFE_VIDEO = new Set(["h264", "vp8", "vp9", "av1"])

function run(cmd: string, args: string[], timeoutMs = 120000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: -1, stdout: "", stderr: "timeout" }), timeoutMs)
    execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(t)
      resolve({ code: err ? (err as { code?: number }).code ?? 1 : 0, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

async function ffprobeVideo(filepath: string): Promise<{ codec: string; width: number; height: number } | null> {
  const r = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", filepath], 15000)
  if (r.code !== 0) return null
  const [codec, width, height] = r.stdout.trim().split(",")
  return { codec: codec || "", width: Number(width) || 0, height: Number(height) || 0 }
}

async function videoPipeline(filepath: string): Promise<{ transcoded: boolean; width: number; height: number; posterPath: string | null }> {
  const info = await ffprobeVideo(filepath)
  const result = { transcoded: false, width: info?.width ?? 0, height: info?.height ?? 0, posterPath: null as string | null }
  if (!info) return result // no ffprobe → keep as-is (no regression)

  // transcode when the codec isn't browser-safe
  if (!BROWSER_SAFE_VIDEO.has(info.codec)) {
    const tmp = filepath + ".h264.mp4"
    const r = await run("ffmpeg", ["-y", "-i", filepath, "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tmp])
    if (r.code === 0) {
      const { rename } = await import("fs/promises")
      await rename(tmp, filepath)
      result.transcoded = true
      const after = await ffprobeVideo(filepath)
      if (after) { result.width = after.width; result.height = after.height }
    } else {
      try { const { unlink } = await import("fs/promises"); await unlink(tmp) } catch { /* ignore */ }
    }
  }

  // poster frame (1s in, fallback to first frame) — used as grid preview
  try {
    const poster = filepath.replace(/\.[^.]+$/, "") + ".poster.jpg"
    const r = await run("ffmpeg", ["-y", "-ss", "1", "-i", filepath, "-frames:v", "1", "-vf", "scale=480:-2", poster], 20000)
    if (r.code !== 0) {
      await run("ffmpeg", ["-y", "-i", filepath, "-frames:v", "1", "-vf", "scale=480:-2", poster], 20000)
    }
    const { access } = await import("fs/promises")
    await access(poster)
    result.posterPath = poster
  } catch { /* poster optional */ }
  return result
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard) return guard

  const contentType = req.headers.get("content-type") || ""
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "فرمت درخواست نامعتبر است" }, 400)
  }

  const formData = await req.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return json({ error: "فایلی ارسال نشده است" }, 400)
  }
  if (file.size > MAX_SIZE) {
    return json({ error: "حجم فایل بیش از حد مجاز (۲۵ مگابایت)" }, 400)
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  // verify the file content really matches its extension (no fake uploads)
  const kind = detectKind(buffer, ext)
  if (!kind) {
    return json({ error: "نوع فایل معتبر نیست یا با پسوند آن هم‌خوانی ندارد" }, 400)
  }

  const subdir = kind === "font" ? "fonts" : "uploads"
  // storageDir() resolves the project root from ANY start mode (dev, next
  // start, node .next/standalone/server.js) — the write side and the
  // /uploads|/fonts route handlers always agree on the same directory.
  const dir = storageDir(subdir)
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  const url = `/${subdir}/${filename}`

  if (kind === "font") {
    return json({ url, type: "font", filename: file.name }, 201)
  }

  // images → generate webp thumbnail + read real dimensions
  // videos → transcode to browser-safe H.264 (if needed) + poster frame
  let thumb: string | null = null
  let width: number | null = null
  let height: number | null = null
  if (kind === "image") {
    try {
      const meta = await sharp(filepath).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
    } catch { /* ignore */ }
    const thumbsDir = storageDir("uploads") + path.sep + "thumbs"
    await mkdir(thumbsDir, { recursive: true })
    const thumbPath = path.join(thumbsDir, filename.replace(/\.[^.]+$/, "") + ".webp")
    if (await makeThumb(filepath, thumbPath)) {
      thumb = `/uploads/thumbs/${filename.replace(/\.[^.]+$/, "")}.webp`
    }
  } else if (kind === "video") {
    const v = await videoPipeline(filepath)
    if (v.width) width = v.width
    if (v.height) height = v.height
    if (v.posterPath) {
      // move poster into thumbs/ with the video's base name
      const thumbsDir = storageDir("uploads") + path.sep + "thumbs"
      await mkdir(thumbsDir, { recursive: true })
      const { rename } = await import("fs/promises")
      const dest = path.join(thumbsDir, filename.replace(/\.[^.]+$/, "") + ".jpg")
      try { await rename(v.posterPath, dest) } catch { /* ignore */ }
      thumb = `/uploads/thumbs/${filename.replace(/\.[^.]+$/, "")}.jpg`
    }
  }

  const media = await db.mediaFile.create({
    data: {
      url,
      type: kind === "video" ? "video" : "image",
      thumb,
      width,
      height,
      alt: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
      size: file.size,
      category: (formData.get("category") as string) || "عمومی",
    },
  })

  return json({ url, type: kind, thumb, mediaId: media.id }, 201)
}
