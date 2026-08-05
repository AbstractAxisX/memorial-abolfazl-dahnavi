"use client"

import { motion } from "framer-motion"

export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} dir="ltr">
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="h-px w-16 sm:w-24 origin-right bg-gradient-to-l from-transparent to-[oklch(0.74_0.135_82/0.7)]"
      />
      <motion.svg
        initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M12 2 L14 9 L22 12 L14 15 L12 22 L10 15 L2 12 L10 9 Z"
          fill="oklch(0.74 0.135 82 / 0.85)"
          stroke="oklch(0.6 0.12 70)"
          strokeWidth="0.5"
        />
        <circle cx="12" cy="12" r="1.6" fill="oklch(0.36 0.07 168)" />
      </motion.svg>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        className="h-px w-16 sm:w-24 origin-left bg-gradient-to-r from-transparent to-[oklch(0.74_0.135_82/0.7)]"
      />
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  align = "center",
}: {
  title: string
  subtitle?: string
  align?: "center" | "start"
}) {
  const alignCls = align === "center" ? "text-center items-center" : "text-right items-end"
  return (
    <div className={`flex flex-col ${alignCls} gap-3`}>
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-3xl sm:text-4xl md:text-5xl emerald-text text-balance"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-sm sm:text-base text-muted-foreground tracking-wide"
        >
          {subtitle}
        </motion.p>
      )}
      <OrnamentDivider className={align === "center" ? "" : "self-end"} />
    </div>
  )
}
