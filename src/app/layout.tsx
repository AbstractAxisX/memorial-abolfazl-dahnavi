import type { Metadata, Viewport } from "next";
import { Vazirmatn, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { UploadManager } from "@/components/memorial/admin/upload-center";
import { db } from "@/lib/db";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "شهید ابوالفضل دهنوی | یادبود جاودان",
    template: "%s | شهید ابوالفضل دهنوی",
  },
  description:
    "یادبود شهید ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر که در حمله هوایی به مبارکه اصفهان به شهادت رسید. زندگی‌نامه، گالری، خط زمانی، بلاگ و یادبودها.",
  keywords: [
    "شهید ابوالفضل دهنوی",
    "ابوالفضل دهنوی",
    "هلال احمر",
    "امدادگر",
    "شهادت",
    "مبارکه اصفهان",
    "یادبود",
  ],
  authors: [{ name: "یادبود شهید ابوالفضل دهنوی" }],
  applicationName: "یادبود شهید ابوالفضل دهنوی",
  openGraph: {
    title: "شهید ابوالفضل دهنوی | یادبود جاودان",
    description: "امدادگری که جان خود را فدای نجات جان دیگران کرد.",
    type: "profile",
    locale: "fa_IR",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e4d45",
};

// Preload the fonts/images the first screen actually uses (settings come from the DB).
async function CriticalPreloads() {
  try {
    const [setting, fonts] = await Promise.all([
      db.siteSetting.findUnique({ where: { id: "main" } }),
      db.fontFile.findMany(),
    ]);
    const links: React.ReactElement[] = [];

    // active fonts (global + heading) — resolved to real TTF urls
    const keys = [setting?.globalFontKey, setting?.headingFontKey].filter(Boolean) as string[];
    for (const key of keys) {
      if (key?.startsWith("custom:")) {
        const name = key.slice("custom:".length);
        const font = fonts.find((f) => f.name === name);
        if (font) links.push(<link key={font.id} rel="preload" href={font.url} as="font" type="font/ttf" crossOrigin="anonymous" fetchPriority="high" />);
      }
    }

    // hero portrait (LCP candidate)
    if (setting?.heroImage) {
      links.push(<link key="hero" rel="preload" as="image" href={setting.heroImage} fetchPriority="high" />);
    }
    return <>{links}</>;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <CriticalPreloads />
      </head>
      <body
        className={`${vazirmatn.variable} ${nastaliq.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <UploadManager />
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
