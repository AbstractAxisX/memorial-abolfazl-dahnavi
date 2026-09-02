// Shared types (safe for both server & client — no runtime imports)
// Date fields are ISO strings (JSON-normalized on the server).

export type SiteSetting = {
  id: string
  fullName: string
  displayTitle: string
  subtitle: string
  birthDate: string | null
  martyrdomDate: string
  martyrdomPlace: string
  role: string
  heroImage: string | null
  heroIntro: string | null
  publicUrl: string | null
  globalFontKey: string
  headingFontKey: string
  accent: string
}

export type Section = {
  id: string
  pageId: string
  type: string
  title: string | null
  subtitle: string | null
  config: string // JSON
  fontKey: string | null
  background: string
  order: number
  visible: boolean
  createdAt: string
}

export type Page = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  showInNav: boolean
  navIcon: string
  isHome: boolean
  order: number
  sections: Section[]
}

export type MediaFile = {
  id: string
  url: string
  type: string
  thumb: string | null
  title: string | null
  description: string | null
  alt: string | null
  category: string
  width: number | null
  height: number | null
  size: number | null
  createdAt: string
}

export type BlogPost = {
  id: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  videoUrl: string | null
  publishedAt: string | null
  featured: boolean
  tags: string | null
  order: number
  createdAt: string
}

export type GuestMessage = {
  id: string
  name: string
  text: string
  approved: boolean
  createdAt: string
}

export type FontFile = {
  id: string
  name: string
  label: string
  url: string
  createdAt: string
}

export type SiteData = {
  setting: SiteSetting | null
  pages: Page[]
  blogPosts: BlogPost[]
  messages: GuestMessage[]
  fonts: FontFile[]
  media: MediaFile[]
}
