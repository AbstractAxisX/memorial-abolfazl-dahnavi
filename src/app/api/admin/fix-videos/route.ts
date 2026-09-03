import { requireAdmin } from "@/lib/auth"
import { json } from "@/lib/api"
import { db } from "@/lib/db"
import { storageDir } from "@/lib/storage"
import { execFile } from "child_process"
import { randomUUID } from "crypto"
import { access, mkdir, rename, unlink } from "fs/promises"
import path from "path"

/**
 * POST /api/admin/fix-videos — one-click media repair (admin only).
 *
 * For every video in the library:
 *   • ffprobe the codec — browsers only decode h264/vp8/vp9/av1, anything
 *     else (mpeg4/DivX…) "loads" but NEVER plays. Re-encode to browser-safe
 *     H.264 + faststart under a FRESH uuid name (defeats any stale cache).
 *   • extract a poster frame into thumbs/ if missing (grid tiles then show a
 *     preview image instead of black, and no video bytes are downloaded).
 *   • update the media row (url/thumb/dimensions) — configs are untouched:
 *     gallery sections reference media by category, not URL.
 *
 * Skips videos that are already healthy. Safe to run repeatedly.
 */

const BROWSER_SAFE_VIDEO = new Set(["h264", "vp8", "vp9", "av1"])

function run(cmd: string, args: string[], timeoutMs = 180000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: -1, stdout: "", stderr: "timeout" }), timeoutMs)
    execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(t)
      resolve({ code: err ? 1 : 0, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

export async function POST() {
  const guard = await requireAdmin()
  if (guard) return guard

  const videos = await db.mediaFile.findMany({ where: { type: "video" } })
  const results: { url: string; action: string }[] = []

  for (const v of videos) {
    const urlPath = v.url.startsWith("/") ? v.url.slice(1) : v.url // "uploads/<uuid>.mp4"
    const filepath = path.join(storageDir("uploads"), path.basename(urlPath))
    try {
      await access(filepath)
    } catch {
      results.push({ url: v.url, action: "فایل پیدا نشد — رد شد" })
      continue
    }

    // probe codec
    const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", filepath], 15000)
    const [codec, pw, ph] = probe.stdout.trim().split(",")
    const width = Number(pw) || v.width || 0
    const height = Number(ph) || v.height || 0
    const needsTranscode = probe.code !== 0 || (!!codec && !BROWSER_SAFE_VIDEO.has(codec))

    let finalPath = filepath
    let action = ""

    if (needsTranscode) {
      const tmp = filepath + ".h264.mp4"
      const enc = await run("ffmpeg", ["-y", "-i", filepath, "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tmp])
      if (enc.code === 0) {
        // fresh name → cache-busting; keep the old file as .bak (never delete user data)
        const newFile = path.join(storageDir("uploads"), `${randomUUID()}.mp4`)
        await rename(tmp, newFile)
        try { await rename(filepath, filepath + ".bak") } catch { /* ignore */ }
        finalPath = newFile
        action = "ترانسکد به H.264"
      } else {
        try { await unlink(tmp) } catch { /* ignore */ }
        action = "ترانسکد ناموفق (ffmpeg؟) — دست نخورد"
      }
    }

    // poster if missing
    let thumb = v.thumb
    const base = path.basename(finalPath).replace(/\.[^.]+$/, "")
    if (!thumb) {
      const thumbsDir = path.join(storageDir("uploads"), "thumbs")
      await mkdir(thumbsDir, { recursive: true })
      const poster = path.join(thumbsDir, base + ".jpg")
      let r = await run("ffmpeg", ["-y", "-ss", "1", "-i", finalPath, "-frames:v", "1", "-vf", "scale=480:-2", poster], 20000)
      if (r.code !== 0) r = await run("ffmpeg", ["-y", "-i", finalPath, "-frames:v", "1", "-vf", "scale=480:-2", poster], 20000)
      if (r.code === 0) {
        thumb = `/uploads/thumbs/${base}.jpg`
        action = action ? action + " + پوستر" : "پوستر اضافه شد"
      }
    }

    // update DB row when something changed (rename or new thumb/dims)
    const newUrl = "/uploads/" + path.relative(storageDir("uploads"), finalPath).split(path.sep).join("/")
    const changed = newUrl !== v.url || thumb !== v.thumb || width !== v.width || height !== v.height
    if (changed || action) {
      await db.mediaFile.update({
        where: { id: v.id },
        data: { url: newUrl, thumb, width: width || null, height: height || null },
      })
      results.push({ url: newUrl, action: action || "به‌روزرسانی ابعاد" })
    } else {
      results.push({ url: v.url, action: "سالم — نیاز به تغییر نبود" })
    }
  }

  return json({ ok: true, count: videos.length, results })
}
