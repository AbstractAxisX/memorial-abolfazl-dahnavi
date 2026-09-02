# 🕯️ یادبود دیجیتال شهید ابوالفضل دهنوی

سایت یادبود دیجیتال برای شهید ابوالفضل دهنوی، امدادگر یکم جمعیت هلال احمر که در حمله هوایی به شهرستان مبارکه اصفهان (۱۵ فروردین ۱۴۰۵) به شهادت رسید.

## ✨ ویژگی‌ها

- **صفحه‌ساز کامل (CMS)** — مثل وردپرس، صفحه و بخش اضافه/ویرایش/حذف کن
- **۱۲ نوع بخش** — هیرو، متن، تصویر، گالری، اسلایدر، ویدیو، خط زمانی، نقل‌قول، کتاب یادبود، بلاگ، CTA، جداکننده
- **گالری iOS Photos** — دسته‌بندی با کارت‌های ۳×۳، انیمیشن باز شدن، lazy loading + thumbnail خودکار (WebP)
- **SEO سطح جهانی** — SSR کامل، URLهای واقعی (`/p/[slug]`)، Sitemap داینامیک، JSON-LD (Person/BlogPosting)، OG Image اختصاصی برای هر صفحه
- **PWA** — قابل نصب روی موبایل با آیکون اختصاصی
- **امنیت** — رمز scrypt-هش، Rate-limiting، honeypot ضداسپم، اعتبارسنجی magic-bytes آپلود
- **فونت‌های خودکفا** — ۱۷ فونت فارسی لوکال، بدون هیچ CDN خارجی
- **کد QR** — برای سنگ قبر
- **پنل مدیریت** — روی `/admin`

## 🚀 راه‌اندازی

```bash
# نصب وابستگی‌ها
bun install

# تنظیم دیتابیس
bun run db:push

# اجرای سرور توسعه
bun run dev
```

### پنل مدیریت
آدرس: `/admin` — رمز عبور را از صاحب سایت دریافت کنید (در دیتابیس به‌صورت scrypt هش شده نگهداری می‌شود و هرگز به مرورگر ارسال نمی‌گردد).

### متغیرهای محیطی (اختیاری)
```
DATABASE_URL=file:./db/custom.db
ADMIN_SECRET=<یک رشته تصادفی طولانی>
NEXT_PUBLIC_SITE_URL=https://example.ir   # برای canonical/sitemap/OG
```

## 📁 ساختار پروژه

```
src/
├── app/                    # صفحات و API ها
│   ├── p/[slug]/           # صفحات CMS (SSR + metadata)
│   ├── blog/[id]/          # پست‌های بلاگ (SSR + OG image)
│   ├── admin/              # پنل مدیریت
│   ├── sitemap.ts          # نقشه سایت داینامیک
│   ├── robots.ts           # robots.txt
│   ├── manifest.ts         # PWA manifest
│   └── opengraph-image.tsx # OG image داینامیک (فارسی)
├── components/
│   ├── memorial/           # کامپوننت‌های سایت
│   │   ├── admin/          # پنل مدیریت
│   │   └── seo/            # JSON-LD
│   └── ui/                 # shadcn/ui
├── lib/
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # scrypt + session token
│   ├── rate-limit.ts       # محدودکننده نرخ درخواست
│   ├── site-data.ts        # منبع واحد داده (SSR + API)
│   └── store.ts            # Zustand store
├── scripts/
│   ├── cleanup.mjs         # پاکسازی داده تستی + backfill thumbnail
│   └── gen-icons.mjs       # تولید آیکون‌های PWA
└── prisma/schema.prisma
```

## 🛠 تکنولوژی‌ها

- **Next.js 16** (App Router, SSR)
- **TypeScript 5**
- **Tailwind CSS 4 + shadcn/ui**
- **Prisma ORM** (SQLite)
- **Framer Motion + GSAP** (انیمیشن)
- **Zustand** (state management)
- **sharp** (thumbnail + WebP)
- **Lucide Icons**

## 📝 لایسنس

این پروژه برای یادبود شهید ابوالفضل دهنوی ساخته شده است.

روحش شاد و راهش پر رهرو باد. 🤍
