import { ImageResponse } from "next/og"
import { readFile } from "fs/promises"
import path from "path"

export const alt = "یادبود جاودان شهید ابوالفضل دهنوی — امدادگر یکم جمعیت هلال احمر"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  const [bold, regular] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/Vazirmatn-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/Vazirmatn-Regular.ttf")),
  ])

  // thin gold frame + emerald gradient + candle motif
  const ornament = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3d36"/><stop offset="0.55" stop-color="#0e4d45"/><stop offset="1" stop-color="#072a25"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#c9a227" stroke-width="2" rx="24"/><rect x="40" y="40" width="1120" height="550" fill="none" stroke="#c9a227" stroke-opacity="0.45" stroke-width="1" rx="18"/><circle cx="600" cy="560" r="7" fill="none" stroke="#c9a227" stroke-width="2"/><circle cx="570" cy="560" r="4" fill="none" stroke="#c9a227" stroke-opacity="0.6"/><circle cx="630" cy="560" r="4" fill="none" stroke="#c9a227" stroke-opacity="0.6"/></svg>`

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
          backgroundImage: `url(data:image/svg+xml;base64,${Buffer.from(ornament).toString("base64")})`,
          backgroundSize: "1200px 630px",
        }}
      >
        {/* crescent + small flame mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 26 }}>
          <div style={{ width: 110, height: 2, background: "#c9a227", opacity: 0.75 }} />
          <svg width="64" height="64" viewBox="0 0 64 64">
            <path d="M32 6 C20 10 13 20 13 32 C13 44 20 54 32 58 C24 52 20 44 20 32 C20 20 24 12 32 6 Z" fill="#c9a227" />
            <circle cx="38" cy="32" r="6" fill="#e8c15a" />
          </svg>
          <div style={{ width: 110, height: 2, background: "#c9a227", opacity: 0.75 }} />
        </div>

        <div
          style={{
            fontSize: 88,
            fontFamily: "Vazirmatn",
            fontWeight: 700,
            color: "#f5efe0",
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
            letterSpacing: 1,
          }}
        >
          شهید ابوالفضل دهنوی
        </div>

        <div style={{ marginTop: 20, fontSize: 34, fontFamily: "Vazirmatn", fontWeight: 400, color: "#c9a227" }}>
          امدادگر یکم جمعیت هلال احمر
        </div>

        <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: "10px 26px", borderRadius: 999, border: "1.5px solid rgba(201,162,39,0.55)", fontSize: 26, fontFamily: "Vazirmatn", color: "#e7e0cd" }}>
            ۱۵ فروردین ۱۴۰۵
          </div>
          <div style={{ padding: "10px 26px", borderRadius: 999, border: "1.5px solid rgba(201,162,39,0.55)", fontSize: 26, fontFamily: "Vazirmatn", color: "#e7e0cd" }}>
            مبارکه، اصفهان
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 76, fontSize: 22, fontFamily: "Vazirmatn", color: "rgba(231,224,205,0.65)" }}>
          یادبود جاودان
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
