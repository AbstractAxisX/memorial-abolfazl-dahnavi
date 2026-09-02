import { ImageResponse } from "next/og"
import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"

export const alt = "یادبود شهید ابوالفضل دهنوی — بلاگ و اخبار"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })

  const [bold, regular] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/Vazirmatn-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/Vazirmatn-Regular.ttf")),
  ])

  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3d36"/><stop offset="0.55" stop-color="#0e4d45"/><stop offset="1" stop-color="#072a25"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#c9a227" stroke-width="2" rx="24"/><rect x="40" y="40" width="1120" height="550" fill="none" stroke="#c9a227" stroke-opacity="0.45" stroke-width="1" rx="18"/></svg>`

  const title = (post?.title ?? "یادبود شهید ابوالفضل دهنوی").slice(0, 60)
  const excerpt = (post?.excerpt ?? "امدادگری که جان خود را فدای نجات جان دیگران کرد.").slice(0, 110)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          padding: "0 90px",
          backgroundImage: `url(data:image/svg+xml;base64,${Buffer.from(bg).toString("base64")})`,
          backgroundSize: "1200px 630px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>
          <div style={{ width: 90, height: 2, background: "#c9a227", opacity: 0.75 }} />
          <div style={{ fontSize: 26, fontFamily: "Vazirmatn", color: "#c9a227" }}>بلاگ یادبود</div>
          <div style={{ width: 90, height: 2, background: "#c9a227", opacity: 0.75 }} />
        </div>

        <div
          style={{
            fontSize: title.length > 34 ? 56 : 68,
            fontFamily: "Vazirmatn",
            fontWeight: 700,
            color: "#f5efe0",
            textAlign: "center",
            lineHeight: 1.35,
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          {title}
        </div>

        <div style={{ marginTop: 26, fontSize: 30, fontFamily: "Vazirmatn", color: "rgba(231,224,205,0.8)", textAlign: "center", lineHeight: 1.6 }}>
          {excerpt}
        </div>

        <div style={{ position: "absolute", bottom: 70, fontSize: 22, fontFamily: "Vazirmatn", color: "rgba(201,162,39,0.85)" }}>
          شهید ابوالفضل دهنوی | یادبود جاودان
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Vazirmatn", data: bold, weight: 700, style: "normal" },
        { name: "Vazirmatn", data: regular, weight: 400, style: "normal" },
      ],
    }
  )
}
