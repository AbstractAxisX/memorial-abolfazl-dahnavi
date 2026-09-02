import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "یادبود جاودان شهید ابوالفضل دهنوی",
    short_name: "یادبود ابوالفضل",
    description: "یادبود دیجیتال شهید ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر — زندگی‌نامه، گالری، خط زمانی و یادبودها",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf5",
    theme_color: "#0e4d45",
    lang: "fa-IR",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
