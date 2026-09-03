"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

// Deterministic PRNG (mulberry32) — the SAME particle layout is produced on
// the server and on the client, so SSR HTML matches hydration 1:1.
// (Math.random() caused a hydration attribute mismatch + console error.)
function seededRandom(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Floating golden particles + slow rotating light rays + subtle pattern
export function DecorativeBg({
  variant = "default",
}: {
  variant?: "default" | "hero"
}) {
  const particles = useMemo(() => {
    const rand = seededRandom(variant === "hero" ? 1405 : 2026)
    return Array.from({ length: variant === "hero" ? 26 : 14 }).map((_, i) => ({
      id: i,
      left: rand() * 100,
      size: 2 + rand() * 4,
      delay: rand() * 12,
      duration: 14 + rand() * 12,
      opacity: 0.2 + rand() * 0.4,
    }))
  }, [variant])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-x-hidden" aria-hidden>
      {/* Subtle, dignified ambient gradients (hero only) — toned down for solemnity */}
      {variant === "hero" && (
        <>
          <motion.div
            animate={{ x: ["-8%", "8%", "-8%"], y: ["-3%", "3%", "-3%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 left-0 w-[80vw] h-[70vh] rounded-full bg-[radial-gradient(circle,oklch(0.74_0.135_82/0.08),transparent_60%)] blur-3xl"
          />
          <motion.div
            animate={{ x: ["8%", "-8%", "8%"], y: ["3%", "-3%", "3%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 right-0 w-[70vw] h-[60vh] rounded-full bg-[radial-gradient(circle,oklch(0.36_0.07_168/0.06),transparent_60%)] blur-3xl"
          />
        </>
      )}
      {variant !== "hero" && (
        <>
          <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full bg-[radial-gradient(circle,oklch(0.74_0.135_82/0.07),transparent_60%)] blur-2xl" />
          <div className="absolute bottom-0 right-0 w-[60vw] h-[50vh] rounded-full bg-[radial-gradient(circle,oklch(0.36_0.07_168/0.04),transparent_60%)] blur-2xl" />
        </>
      )}

      {/* Subtle rotating light rays (hero only) — reduced opacity */}
      {variant === "hero" && (
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] -translate-y-1/2 animate-ray-rotate opacity-[0.08]">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,oklch(0.74_0.135_82)_8deg,transparent_16deg,transparent_30deg,oklch(0.74_0.135_82)_38deg,transparent_46deg,transparent_70deg,oklch(0.36_0.07_168)_78deg,transparent_86deg,transparent_110deg,oklch(0.74_0.135_82)_118deg,transparent_126deg,transparent_180deg,oklch(0.74_0.135_82)_188deg,transparent_196deg,transparent_220deg,oklch(0.36_0.07_168)_228deg,transparent_236deg,transparent_290deg,oklch(0.74_0.135_82)_298deg,transparent_306deg,transparent_360deg)] rounded-full blur-md" />
        </div>
      )}

      {/* pattern overlay */}
      <div className="pattern-overlay absolute inset-0" />

      {/* floating particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="particle rounded-full bg-[oklch(0.74_0.135_82)]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            bottom: -10,
            opacity: p.opacity,
          }}
          animate={{ y: ["0vh", "-115vh"], x: [0, p.size * 3, -p.size * 2, 0], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}
