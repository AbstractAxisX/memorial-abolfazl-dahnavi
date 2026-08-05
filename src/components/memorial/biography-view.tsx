"use client"

import { motion } from "framer-motion"
import { ScrollText, Quote as QuoteIcon } from "lucide-react"
import type { BioSection } from "@/lib/store"
import { SectionTitle, OrnamentDivider } from "./ornaments"

function Paragraphs({ text }: { text: string }) {
  const paras = text.split("\n").map((p) => p.trim()).filter(Boolean)
  return (
    <div className="space-y-4">
      {paras.map((p, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="leading-9 text-[15px] sm:text-base text-foreground/85 text-justify"
        >
          {p}
        </motion.p>
      ))}
    </div>
  )
}

export function BiographyView({ sections }: { sections: BioSection[] }) {
  return (
    <section className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionTitle
          title="زندگی‌نامه"
          subtitle="روایتی از زندگی، خدمت و شهادت"
        />

        {sections.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">
            هنوز بخشی ثبت نشده است.
          </p>
        )}

        <div className="mt-14 space-y-14 sm:space-y-20">
          {sections.map((s, idx) => {
            const flip = idx % 2 === 1
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* section index ornament */}
                <div className="mb-5 flex items-center justify-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[oklch(0.74_0.135_82/0.4)] bg-ivory text-sm font-semibold text-[oklch(0.36_0.07_168)] shadow-sm">
                    {toPersianDigits(idx + 1)}
                  </span>
                  <OrnamentDivider className="flex-1 max-w-[180px]" />
                </div>

                <h3 className="font-display text-2xl sm:text-3xl emerald-text text-center mb-6 text-balance">
                  {s.title}
                </h3>

                {s.image ? (
                  <div
                    className={`flex flex-col ${
                      flip ? "sm:flex-row-reverse" : "sm:flex-row"
                    } gap-6 sm:gap-8 items-start`}
                  >
                    <div className="w-full sm:w-2/5">
                      <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.74_0.135_82/0.25)] shadow-lg shadow-[oklch(0.36_0.07_168/0.12)]">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-full h-56 sm:h-72 object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.36_0.07_168/0.15)] to-transparent" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Paragraphs text={s.content} />
                    </div>
                  </div>
                ) : (
                  <div className="parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.18)] p-6 sm:p-8 shadow-sm">
                    <QuoteIcon className="h-6 w-6 text-[oklch(0.74_0.135_82/0.5)] mb-3" />
                    <Paragraphs text={s.content} />
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function toPersianDigits(n: number) {
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return String(n)
    .split("")
    .map((d) => fa[+d] ?? d)
    .join("")
}

export { toPersianDigits }
