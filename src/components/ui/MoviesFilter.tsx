"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import type { TMDBGenre } from "@/lib/tmdb/types"

interface MoviesFilterProps {
  genres: TMDBGenre[]
}

export default function MoviesFilter({ genres }: MoviesFilterProps) {
  const router = useRouter()
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const handleGenre = (id: number | null) => {
    setSelectedGenre(id)
    if (id) {
      router.push(`/movies?genre=${id}`)
    } else {
      router.push("/movies")
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/12 transition-all text-sm font-medium"
        >
          <SlidersHorizontal size={15} />
          Genres
        </button>

        {open && (
          <>
            <button
              onClick={() => handleGenre(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedGenre === null
                  ? "bg-amber-400 text-black"
                  : "bg-white/8 border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGenre(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedGenre === g.id
                    ? "bg-amber-400 text-black"
                    : "bg-white/8 border border-white/10 text-white/60 hover:text-white"
                }`}
              >
                {g.name}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
