"use client"

import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import type { TimelineEvent } from "@/lib/store"
import { SectionTitle } from "./ornaments"
import { toPersianDigits } from "./biography-view"

function EventIcon({ name }: { name: string }) {
  const lib = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  const Icon = lib[name] || Icons.Sparkles
  return <Icon className="h-5 w-5" />
}

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null
  return (
    <section className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="خط زمانی" subtitle="مسیر زندگی در نگاهی کوتاه" />

        <div className="relative mt-16">
          {/* vertical line — on the right for RTL mobile, center on desktop */}
          <div className="absolute right-4 sm:right-1/2 sm:translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[oklch(0.74_0.135_82/0.5)] to-transparent" />

          <div className="space-y-10 sm:space-y-2">
            {events.map((e, idx) => {
              const flip = idx % 2 === 1
              return (
                <div
                  key={e.id}
                  className="relative sm:grid sm:grid-cols-2 sm:gap-8"
                >
                  {/* node */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
                    className="absolute right-4 sm:right-1/2 top-1 -translate-x-1/2 sm:translate-x-1/2 z-10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.36_0.07_168)] text-ivory shadow-lg shadow-[oklch(0.36_0.07_168/0.4)] ring-4 ring-ivory">
                      <EventIcon name={e.icon} />
                    </span>
                  </motion.div>

                  {/* card */}
                  <motion.div
                    initial={{ opacity: 0, x: flip ? 30 : -30, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`pr-14 sm:pr-0 ${
                      flip ? "sm:col-start-1 sm:text-left" : "sm:col-start-2"
                    }`}
                  >
                    <div className="parchment rounded-2xl border border-[oklch(0.74_0.135_82/0.2)] p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[oklch(0.92_0.035_82)] px-2.5 py-0.5 text-[11px] font-medium text-[oklch(0.36_0.07_168)]">
                          {e.date}
                        </span>
                      </div>
                      <h3 className="font-display text-xl emerald-text mb-1.5">
                        {e.title}
                      </h3>
                      {e.description && (
                        <p className="text-sm text-foreground/75 leading-7 text-justify">
                          {e.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="font-display text-lg text-muted-foreground">
            «{toPersianDigits(events.length)} نقطه از مسیر جاودان»
          </p>
        </motion.div>
      </div>
    </section>
  )
}
