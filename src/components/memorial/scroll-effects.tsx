"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useSpring } from "framer-motion"

// Scroll progress bar — thin gold gradient line at top of page
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 right-0 left-0 h-[3px] origin-right z-[55] bg-gradient-to-l from-[oklch(0.36_0.07_168)] via-[oklch(0.74_0.135_82)] to-[oklch(0.6_0.12_70)] shadow-[0_0_10px_oklch(0.74_0.135_82/0.4)]"
    />
  )
}

// Animated SVG ornaments — breathing crescent, floating gold ring, geometric star
export function AnimatedOrnaments() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Top-right breathing crescent */}
      <svg className="absolute top-[8%] right-[5%] w-16 h-16 opacity-[0.12] animate-breathe" viewBox="0 0 64 64" fill="none">
        <path
          d="M 32 8 A 24 24 0 1 0 32 56 A 18 18 0 1 1 32 8 Z"
          fill="oklch(0.74 0.135 82)"
        />
      </svg>

      {/* Bottom-left geometric star — slow rotation */}
      <svg className="absolute bottom-[15%] left-[3%] w-20 h-20 opacity-[0.08] animate-slow-spin" viewBox="0 0 80 80" fill="none">
        <path
          d="M 40 4 L 47 30 L 76 30 L 53 47 L 61 76 L 40 58 L 19 76 L 27 47 L 4 30 L 33 30 Z"
          stroke="oklch(0.36 0.07 168)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="40" cy="40" r="32" stroke="oklch(0.74 0.135 82)" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
      </svg>

      {/* Mid-right floating ring */}
      <svg className="absolute top-[45%] right-[8%] w-12 h-12 opacity-[0.1] animate-drift" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="oklch(0.74 0.135 82)" strokeWidth="1" fill="none" />
        <circle cx="24" cy="24" r="14" stroke="oklch(0.74 0.135 82)" strokeWidth="0.5" fill="none" strokeDasharray="2 3" />
        <circle cx="24" cy="24" r="3" fill="oklch(0.74 0.135 82)" />
      </svg>

      {/* Bottom-right small star sparkle */}
      <svg className="absolute bottom-[30%] right-[10%] w-8 h-8 opacity-[0.15] animate-breathe" style={{ animationDelay: "2s" }} viewBox="0 0 32 32" fill="none">
        <path d="M 16 2 L 18 13 L 30 16 L 18 19 L 16 30 L 14 19 L 2 16 L 14 13 Z" fill="oklch(0.74 0.135 82)" />
      </svg>
    </div>
  )
}

// Scroll-reveal wrapper — fades + slides + un-blurs children on scroll into view
export function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
