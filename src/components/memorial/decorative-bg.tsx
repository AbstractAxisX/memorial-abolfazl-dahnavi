"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

// Floating golden particles + slow rotating light rays + subtle pattern
export function DecorativeBg({
  variant = "default",
}: {
  variant?: "default" | "hero"
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: variant === "hero" ? 26 : 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 12,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    [variant]
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-x-hidden" aria-hidden>
      {/* animated soft aurora gradients (hero only — more vivid) */}
      {variant === "hero" && (
        <>
          <motion.div
            animate={{ x: ["-10%", "10%", "-10%"], y: ["-5%", "5%", "-5%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 left-0 w-[80vw] h-[70vh] rounded-full bg-[radial-gradient(circle,oklch(0.74_0.135_82/0.18),transparent_60%)] blur-3xl"
          />
          <motion.div
            animate={{ x: ["10%", "-10%", "10%"], y: ["5%", "-5%", "5%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 right-0 w-[70vw] h-[60vh] rounded-full bg-[radial-gradient(circle,oklch(0.36_0.07_168/0.12),transparent_60%)] blur-3xl"
          />
          <motion.div
            animate={{ x: ["-5%", "5%", "-5%"], y: ["5%", "-5%", "5%"] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-1/4 w-[60vw] h-[50vh] rounded-full bg-[radial-gradient(circle,oklch(0.52_0.18_25/0.06),transparent_60%)] blur-3xl"
          />
        </>
      )}
      {variant !== "hero" && (
        <>
          <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full bg-[radial-gradient(circle,oklch(0.74_0.135_82/0.10),transparent_60%)] blur-2xl" />
          <div className="absolute bottom-0 right-0 w-[60vw] h-[50vh] rounded-full bg-[radial-gradient(circle,oklch(0.36_0.07_168/0.06),transparent_60%)] blur-2xl" />
        </>
      )}

      {/* rotating light rays (hero only) */}
      {variant === "hero" && (
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] -translate-y-1/2 animate-ray-rotate opacity-[0.16]">
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
