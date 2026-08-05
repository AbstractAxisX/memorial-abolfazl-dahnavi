import {
  Sparkles, AlignRight, Image as ImageIcon, Images, GalleryHorizontalEnd,
  PlayCircle, Clock, Quote, MessageSquareHeart, Newspaper, MousePointerClick, Minus, Square,
  type LucideIcon,
} from "lucide-react"

import { getIcon } from "./icon-registry"

export type SectionTypeDef = {
  key: string
  label: string
  description: string
  icon: LucideIcon
  defaultConfig: () => Record<string, unknown>
}

function icon(name: string): LucideIcon {
  return getIcon(name)
}

export const SECTION_TYPES: SectionTypeDef[] = [
  {
    key: "hero",
    label: "بخش اصلی (هیرو)",
    description: "پرتره، نام بزرگ، تاریخ و معرفی — فقط یک‌بار در صفحه خانه",
    icon: Sparkles,
    defaultConfig: () => ({
      ctaButtons: [
        { label: "زندگی‌نامه", pageSlug: "biography" },
        { label: "گالری یادبود", pageSlug: "gallery" },
      ],
    }),
  },
  {
    key: "text",
    label: "متن و پاراگراف",
    description: "عنوان + متن چند پاراگرافی + تصویر اختیاری",
    icon: AlignRight,
    defaultConfig: () => ({ content: "متن این بخش را اینجا بنویسید.\n\nپاراگراف‌ها را با Enter جدا کنید.", image: null, layout: "full" }),
  },
  {
    key: "image",
    label: "تصویر تکی",
    description: "یک تصویر با کپشن و توضیح",
    icon: ImageIcon,
    defaultConfig: () => ({ url: null, caption: "", alt: "", size: "md", align: "center" }),
  },
  {
    key: "gallery",
    label: "گالری",
    description: "شبکه‌ای از عکس‌ها و ویدیوها با فیلتر",
    icon: Images,
    defaultConfig: () => ({ items: [], filterable: true, columns: 3 }),
  },
  {
    key: "slider",
    label: "اسلایدر",
    description: "اسلایدشو تصاویر با تنظیمات پخش خودکار و افکت",
    icon: GalleryHorizontalEnd,
    defaultConfig: () => ({
      items: [],
      autoplay: true,
      interval: 4000,
      transition: "fade",
      arrows: true,
      dots: true,
      height: "lg",
    }),
  },
  {
    key: "video",
    label: "ویدیو",
    description: "یک ویدیو با پلیر اختصاصی + عنوان و توضیح",
    icon: PlayCircle,
    defaultConfig: () => ({ url: null, poster: null, title: "", description: "" }),
  },
  {
    key: "timeline",
    label: "خط زمانی",
    description: "رویدادهای زندگی با آیکون",
    icon: Clock,
    defaultConfig: () => ({
      events: [{ date: "تاریخ", title: "عنوان رویداد", description: "توضیح", icon: "Sparkles" }],
    }),
  },
  {
    key: "quotes",
    label: "نقل‌قول‌ها",
    description: "مجموعه نقل‌قول با کارت‌های زیبا",
    icon: Quote,
    defaultConfig: () => ({ quotes: [{ text: "نقل قول", author: "" }] }),
  },
  {
    key: "guestbook",
    label: "کتاب یادبود",
    description: "فرم ثبت پیام + نمایش پیام‌ها",
    icon: MessageSquareHeart,
    defaultConfig: () => ({}),
  },
  {
    key: "blogList",
    label: "فهرست بلاگ/خبر",
    description: "نمایش آخرین اخبار و یادبودها",
    icon: Newspaper,
    defaultConfig: () => ({ count: 12, showExcerpt: true }),
  },
  {
    key: "cta",
    label: "دکمه فراخوان (CTA)",
    description: "عنوان + دکمه‌های هدایت",
    icon: MousePointerClick,
    defaultConfig: () => ({
      title: "برای ادامه مسیر او...",
      buttons: [{ label: "گالری یادبود", pageSlug: "gallery", variant: "primary" }],
    }),
  },
  {
    key: "divider",
    label: "جداکننده تزئینی",
    description: "خط طلایی با آرامایش",
    icon: Minus,
    defaultConfig: () => ({ variant: "ornament" }),
  },
]

export const SECTION_TYPE_MAP: Record<string, SectionTypeDef> = Object.fromEntries(
  SECTION_TYPES.map((t) => [t.key, t])
)

export function sectionTypeLabel(key: string): string {
  return SECTION_TYPE_MAP[key]?.label ?? key
}

export function sectionTypeIcon(key: string): LucideIcon {
  return SECTION_TYPE_MAP[key]?.icon ?? getIcon("Square")
}

// Background variants for sections
export const SECTION_BACKGROUNDS = [
  { key: "default", label: "ساده" },
  { key: "parchment", label: "پرگامنت" },
  { key: "emerald", label: "سبز زمردی" },
  { key: "gold", label: "طلایی" },
] as const
