"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Play } from "lucide-react"
import { getTmdbImage } from "@/lib/tmdb/image"
import { formatDate, formatRating } from "@/lib/utils"

export interface MediaCardProps {
  id: number
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  rating?: number
  releaseDate?: string
  mediaType?: "movie" | "tv"
}

export default function MediaCard({
  id,
  title,
  posterPath,
  rating,
  releaseDate,
  mediaType = "movie",
}: MediaCardProps) {
  const href = `/${mediaType}/${id}`
  const year = formatDate(releaseDate)
  const score = formatRating(rating)

  return (
    <Link href={href} className="block shrink-0 w-[160px] sm:w-[180px] lg:w-[200px] group">
      <motion.div
        whileHover={{ y: -6, scale: 1.03 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative"
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-lg">
          {posterPath ? (
            <Image
              src={getTmdbImage(posterPath, "w342")}
              alt={title}
              fill
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5">
              <span className="text-white/20 text-xs text-center px-2">{title}</span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play size={18} className="text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Media type badge */}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70">
              {mediaType === "tv" ? "TV" : "Film"}
            </span>
          </div>

          {/* Rating */}
          {rating && rating > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-semibold text-white">{score}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2.5 px-0.5">
          <p className="text-white/90 text-sm font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors">
            {title}
          </p>
          {year !== "N/A" && (
            <p className="text-white/40 text-xs mt-1">{year}</p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
