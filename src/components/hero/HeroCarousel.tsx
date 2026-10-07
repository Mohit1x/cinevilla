"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { TMDBMedia } from "@/lib/tmdb/types"
import HeroSlide from "./HeroSlide"
import { SkeletonHero } from "@/components/ui/Skeletons"
import { getTmdbImage } from "@/lib/tmdb/image"
import { getMediaTitle, getMediaDate, formatDate, formatRating } from "@/lib/utils"

interface HeroCarouselProps {
  items: TMDBMedia[]
  loading?: boolean
}

export default function HeroCarousel({ items, loading = false }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [direction, setDirection] = useState(1)
  const [progress, setProgress] = useState(0)

  const total = items.length

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir)
      setCurrent((index + total) % total)
      setProgress(0)
    },
    [total]
  )

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo])

  useEffect(() => {
    if (paused || loading || total === 0) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { next(); return 0 }
        return p + 100 / 60
      })
    }, 100)
    return () => clearInterval(interval)
  }, [paused, loading, total, next])

  if (loading) return <SkeletonHero />
  if (!items.length) return null

  return (
    <div
      className="relative w-full h-[90vh] min-h-[640px] max-h-[960px] overflow-hidden bg-[#0a0a0f]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync" custom={direction}>
        <HeroSlide key={items[current].id} item={items[current]} direction={direction} />
      </AnimatePresence>

      {/* Prev / Next */}
      <button
        onClick={prev}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Trending overlay strip ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* gradient fade into hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent pointer-events-none" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pb-7 pt-14">

          {/* progress dots */}
          <div className="flex items-center justify-end mb-5">
            <div className="flex items-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  className="relative h-[3px] rounded-full overflow-hidden transition-all duration-300"
                  style={{ width: i === current ? 28 : 12 }}
                  aria-label={`Slide ${i + 1}`}
                >
                  <div className="absolute inset-0 bg-white/15 rounded-full" />
                  {i === current && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-amber-400 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 5 cards */}
          <div className="grid grid-cols-5 gap-3">
            {items.map((item, i) => {
              const title = getMediaTitle(item)
              const year = formatDate(getMediaDate(item))
              const rating = formatRating(item.vote_average)
              const href = `/${item.media_type}/${item.id}`
              const isActive = i === current

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative"
                >
                  {/* rank number — behind the card */}
                  <span
                    className={`absolute -top-4 -left-1 text-[4rem] font-black leading-none select-none pointer-events-none z-0 transition-colors duration-300 ${
                      isActive ? "text-amber-400/25" : "text-white/8"
                    }`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {i + 1}
                  </span>

                  {/* card */}
                  <Link
                    href={href}
                    onMouseEnter={() => goTo(i, i > current ? 1 : -1)}
                    className="relative z-10 w-full text-left group block"
                  >
                    <div
                      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "bg-white/18 border border-white/20 shadow-xl shadow-black/40"
                          : "bg-white/10 border border-white/10 hover:bg-white/14 hover:border-white/16 shadow-lg shadow-black/30"
                      }`}
                      style={{ backdropFilter: "blur(16px)" }}
                    >
                      {/* inner glow for active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-400/20 pointer-events-none" />
                      )}

                      <div className="flex gap-3 p-4">
                        {/* Poster */}
                        <div className="relative shrink-0 w-16 h-24 rounded-xl overflow-hidden bg-white/5 shadow-md">
                          {item.poster_path ? (
                            <Image
                              src={getTmdbImage(item.poster_path, "w185")}
                              alt={title}
                              fill
                              sizes="56px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-white/5" />
                          )}
                          {isActive && (
                            <div className="absolute inset-0 ring-1 ring-amber-400/40 rounded-xl" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <p
                              className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-200 ${
                                isActive ? "text-white" : "text-white/70 group-hover:text-white/90"
                              }`}
                            >
                              {title}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5">
                              {rating !== "N/A" && (
                                <div className="flex items-center gap-1">
                                  <Star size={10} className="text-amber-400 fill-amber-400" />
                                  <span className="text-xs font-medium text-amber-400/80">{rating}</span>
                                </div>
                              )}
                              {year !== "N/A" && (
                                <span className="text-xs text-white/35">{year}</span>
                              )}
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                                  isActive
                                    ? "bg-amber-400/15 text-amber-400/80"
                                    : "bg-white/8 text-white/35"
                                }`}
                              >
                                {item.media_type === "tv" ? "TV" : "Film"}
                              </span>
                            </div>
                          </div>

                          {/* active indicator line */}
                          {isActive && (
                            <motion.div
                              layoutId="activeBar"
                              className="h-0.5 w-8 bg-amber-400 rounded-full mt-2"
                            />
                          )}
                        </div>
                      </div>

                      {/* hover play hint */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          <Play size={9} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>


                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
