"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react"

interface Provider {
  id: number
  name: string
  logo: string
}

export default function StreamingProvidersClient({ providers }: { providers: Provider[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-5 px-4 sm:px-6 lg:px-10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Channels &amp; Apps</h2>
          <p className="text-white/40 text-sm mt-0.5">Browse by streaming service</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        )}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-10 pb-6 pt-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {providers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              className="shrink-0"
            >
              <Link
                href={`/provider/${p.id}?name=${encodeURIComponent(p.name)}`}
                className={[
                  "group relative flex flex-col items-center justify-between",
                  "w-[148px] h-[168px] p-4 rounded-2xl",
                  "border border-white/10 bg-white/[0.04]",
                  "hover:border-amber-400/40 hover:bg-white/[0.08]",
                  "transition-all duration-300",
                  "translate-y-0 hover:-translate-y-2",
                  "shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                ].join(" ")}
              >
                {/* Radial glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(251,191,36,0.08) 0%, transparent 65%)" }}
                />

                {/* Top-right arrow */}
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/0 group-hover:bg-amber-400/15 border border-transparent group-hover:border-amber-400/30 flex items-center justify-center transition-all duration-300">
                  <ArrowUpRight size={11} className="text-white/0 group-hover:text-amber-400 transition-colors duration-300" />
                </div>

                {/* Logo */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <div className="relative w-[68px] h-[68px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 group-hover:ring-amber-400/20 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                    <Image
                      src={p.logo}
                      alt={p.name}
                      fill
                      sizes="68px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Name + label */}
                <div className="w-full text-center mt-1 space-y-0.5">
                  <p className="text-white/75 text-xs font-semibold leading-tight line-clamp-1 group-hover:text-white transition-colors duration-200">
                    {p.name}
                  </p>
                  <p className="text-white/20 text-[10px] group-hover:text-amber-400/60 transition-colors duration-200">
                    Browse →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
