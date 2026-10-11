"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import dynamic from "next/dynamic"

const WatchModal = dynamic(() => import("@/components/player/WatchModal"), { ssr: false })

interface Props {
  tvId: number
  title: string
  year: string
  runtime: number
  posterUrl?: string
  season: number
  episode: number
}

export default function TVWatchButton({ tvId, title, year, runtime, posterUrl, season, episode }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm rounded-xl transition-colors"
      >
        <Play size={16} fill="currentColor" />
        Play S{season}E{episode}
      </button>
      {open && (
        <WatchModal
          tmdbId={tvId}
          title={title}
          year={year}
          runtime={runtime}
          posterUrl={posterUrl}
          mediaType="tv"
          season={season}
          episode={episode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
