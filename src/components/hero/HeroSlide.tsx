"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Play, Info, Star } from "lucide-react"
import { getTmdbBackdrop } from "@/lib/tmdb/image"
import { formatDate, formatRating, getMediaTitle, getMediaDate } from "@/lib/utils"
import type { TMDBMedia } from "@/lib/tmdb/types"

interface HeroSlideProps {
  item: TMDBMedia
  direction: number
}

const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -60 : 60,
  }),
}

const textVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  }),
}

export default function HeroSlide({ item, direction }: HeroSlideProps) {
  const title = getMediaTitle(item)
  const year = formatDate(getMediaDate(item))
  const rating = formatRating(item.vote_average)
  const mediaType = item.media_type
  const href = `/${mediaType}/${item.id}`
  const backdrop = getTmdbBackdrop(item.backdrop_path)

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="absolute inset-0"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={backdrop}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16 lg:pb-20">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Label */}
            <motion.div
              custom={0}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 mb-4"
            >
              <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
                Trending Now
              </span>
              <span className="w-8 h-px bg-amber-400/50" />
              <span className="text-white/50 text-xs uppercase tracking-wider">
                {mediaType === "tv" ? "TV Series" : "Movie"}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              custom={0.1}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4"
            >
              {title}
            </motion.h1>

            {/* Meta */}
            <motion.div
              custom={0.2}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-4 mb-4"
            >
              {rating !== "N/A" && (
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-white font-semibold text-sm">{rating}</span>
                </div>
              )}
              {year !== "N/A" && (
                <span className="text-white/50 text-sm">{year}</span>
              )}
            </motion.div>

            {/* Overview */}
            {item.overview && (
              <motion.p
                custom={0.3}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-white/60 text-sm lg:text-base leading-relaxed line-clamp-3 mb-8"
              >
                {item.overview}
              </motion.p>
            )}

            {/* CTAs */}
            <motion.div
              custom={0.4}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3"
            >
              <button
                disabled
                className="flex items-center gap-2.5 px-6 py-3 bg-amber-400 text-black font-bold text-sm rounded-xl opacity-60 cursor-not-allowed"
                title="Streaming coming soon"
              >
                <Play size={16} className="fill-black" />
                Watch Now
              </button>
              <Link
                href={href}
                className="flex items-center gap-2.5 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/20 hover:border-white/25 transition-all"
              >
                <Info size={16} />
                More Info
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
