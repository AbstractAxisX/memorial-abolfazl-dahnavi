import type { Metadata, Viewport } from "next";
import { Vazirmatn, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

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
  title: "شهید ابوالفضل دهنوی | یادبود جاودان",
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
  openGraph: {
    title: "شهید ابوالفضل دهنوی | یادبود جاودان",
    description: "امدادگری که جان خود را فدای نجات جان دیگران کرد.",
    type: "profile",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e4d45",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.fontcdn.ir" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Persian CDN fonts */}
        <link rel="stylesheet" href="https://cdn.fontcdn.ir/Font/Persian/Shabnam/Shabnam.css" />
        <link rel="stylesheet" href="https://cdn.fontcdn.ir/Font/Persian/Sahel/Sahel.css" />
        <link rel="stylesheet" href="https://cdn.fontcdn.ir/Font/Persian/Samim/Samim.css" />
        <link rel="stylesheet" href="https://cdn.fontcdn.ir/Font/Persian/Gandom/Gandom.css" />
        {/* Extra Google fonts via CSS link (next/font can't load these reliably in sandbox) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gulzar&family=Lalezar&family=Markazi+Text:wght@400;500;600;700&display=swap" />
      </head>
      <body
        className={`${vazirmatn.variable} ${nastaliq.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
