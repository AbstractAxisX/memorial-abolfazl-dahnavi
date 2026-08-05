"use client"

import { createElement } from "react"
import {
  Home, BookOpen, Images, Clock, Heart, Newspaper, FileText, Flame, Star, Award,
  Sparkles, Image as ImageIcon, Video, Quote, MessageSquareHeart, TreePine,
  Baby, HandHeart, ShieldPlus, GraduationCap, Medal, Sprout, Gift, MapPin,
  CalendarDays, Send, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Play, Pause, PauseCircle, PlayCircle, Quote as QuoteIcon,
  AlignRight, Square, Settings2, Lock, LogOut, Loader2, X, Plus, Trash2,
  Pencil, Copy, Eye, EyeOff, Save, Files, Settings, Search, Upload,
  Newspaper as NewspaperIcon, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw,
  HandHeart as HandHeartIcon, Images as ImagesIcon, GalleryHorizontalEnd, MousePointerClick, Minus,
  type LucideIcon,
} from "lucide-react"

// Curated icon map — only icons we actually use, to keep dev-server memory low.
export const ICONS: Record<string, LucideIcon> = {
  Home, BookOpen, Images, Clock, Heart, Newspaper, FileText, Flame, Star, Award,
  Sparkles, Image: ImageIcon, Video, Quote, MessageSquareHeart, TreePine,
  Baby, HandHeart, ShieldPlus, GraduationCap, Medal, Sprout, Gift, MapPin,
  CalendarDays, Send, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Play, Pause, PauseCircle, PlayCircle,
  AlignRight, Square, Settings2, Lock, LogOut, Loader2, X, Plus, Trash2,
  Pencil, Copy, Eye, EyeOff, Save, Files, Settings, Search, Upload,
  NewspaperIcon, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw,
  HandHeartIcon, ImagesIcon, GalleryHorizontalEnd, MousePointerClick, Minus,
  QuoteIcon,
}

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles
}

// Render an icon by name with className — uses createElement so we don't
// create a component during render (satisfies react-hooks/static-components).
export function IconEl({ name, className }: { name: string; className?: string }) {
  const Ic = ICONS[name] ?? Sparkles
  return createElement(Ic, { className })
}
