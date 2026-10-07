"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, User } from "lucide-react"
import { getTmdbImage } from "@/lib/tmdb/image"
import type { TMDBCastMember } from "@/lib/tmdb/types"

interface CastCarouselProps {
  cast: TMDBCastMember[]
}

export default function CastCarousel({ cast }: CastCarouselProps) {
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
    <section>
      <div className="flex items-center justify-between mb-5 px-0">
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Cast</h2>
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

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cast.map((member) => (
          <div key={member.id} className="shrink-0 w-28 sm:w-32 text-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-white/5 ring-1 ring-white/10 mb-2">
              {member.profile_path ? (
                <Image
                  src={getTmdbImage(member.profile_path, "w185")}
                  alt={member.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User size={28} className="text-white/20" />
                </div>
              )}
            </div>
            <p className="text-white/90 text-xs font-semibold leading-tight line-clamp-2">
              {member.name}
            </p>
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{member.character}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
