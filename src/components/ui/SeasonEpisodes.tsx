"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Play, Star, ChevronDown } from "lucide-react"
import { getTmdbImage } from "@/lib/tmdb/image"
import type { TMDBEpisode, TMDBSeasonDetails } from "@/lib/tmdb/types"
import dynamic from "next/dynamic"

const WatchModal = dynamic(() => import("@/components/player/WatchModal"), { ssr: false })

interface Props {
  tvId: number
  title: string
  year: string
  runtime: number
  posterUrl?: string
  totalSeasons: number
  initialSeason: TMDBSeasonDetails
}

export default function SeasonEpisodes({ tvId, title, year, runtime, posterUrl, totalSeasons, initialSeason }: Props) {
  const [currentSeason, setCurrentSeason] = useState(initialSeason)
  const [selectedSeason, setSelectedSeason] = useState(initialSeason.season_number)
  const [isPending, startTransition] = useTransition()
  const [watchEp, setWatchEp] = useState<{ season: number; episode: number; runtime: number } | null>(null)

  const handleSeasonChange = (seasonNum: number) => {
    if (seasonNum === selectedSeason) return
    setSelectedSeason(seasonNum)
    startTransition(async () => {
      const res = await fetch(`/api/season?tvId=${tvId}&season=${seasonNum}`)
      const data: TMDBSeasonDetails = await res.json()
      setCurrentSeason(data)
    })
  }

  const seasons = Array.from({ length: totalSeasons }, (_, i) => i + 1)

  return (
    <>
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">Episodes</h2>

          {/* Season switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {totalSeasons <= 8 ? (
              seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSeasonChange(s)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedSeason === s
                      ? "bg-amber-400 text-black"
                      : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white border border-white/10"
                  }`}
                >
                  S{s}
                </button>
              ))
            ) : (
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => handleSeasonChange(Number(e.target.value))}
                  className="appearance-none bg-white/8 border border-white/10 text-white text-sm rounded-lg px-4 py-1.5 pr-8 focus:outline-none focus:border-amber-400/50 cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s} className="bg-[#0a0a0f]">
                      Season {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Episode grid */}
        <div
          className={`grid gap-3 transition-opacity duration-300 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}
        >
          {currentSeason.episodes.map((ep, idx) => (
            <EpisodeCard
              key={ep.id}
              ep={ep}
              idx={idx}
              onPlay={() => setWatchEp({ season: ep.season_number, episode: ep.episode_number, runtime: ep.runtime ?? runtime })}
            />
          ))}
        </div>
      </div>

      {watchEp && (
        <WatchModal
          tmdbId={tvId}
          title={title}
          year={year}
          runtime={watchEp.runtime}
          posterUrl={posterUrl}
          mediaType="tv"
          season={watchEp.season}
          episode={watchEp.episode}
          onClose={() => setWatchEp(null)}
        />
      )}
    </>
  )
}

function EpisodeCard({ ep, idx, onPlay }: { ep: TMDBEpisode; idx: number; onPlay: () => void }) {
  const still = ep.still_path ? getTmdbImage(ep.still_path, "w300") : null

  return (
    <div
      className="group flex gap-4 p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/8 hover:border-white/12 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${idx * 30}ms` }}
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-white/5">
        {still ? (
          <Image src={still} alt={ep.name} fill sizes="176px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-90 group-hover:scale-100">
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-1.5 left-2 text-xs font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
          E{ep.episode_number}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-white font-semibold text-sm leading-snug line-clamp-1">{ep.name}</p>
          <div className="flex items-center gap-3 shrink-0 text-xs text-white/40">
            {ep.vote_average > 0 && (
              <span className="flex items-center gap-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                {ep.vote_average.toFixed(1)}
              </span>
            )}
            {ep.runtime && <span>{ep.runtime}m</span>}
          </div>
        </div>
        {ep.overview && (
          <p className="text-white/45 text-xs leading-relaxed line-clamp-2">{ep.overview}</p>
        )}
        {ep.air_date && (
          <p className="text-white/25 text-xs mt-1.5">{ep.air_date}</p>
        )}
      </div>
    </div>
  )
}
