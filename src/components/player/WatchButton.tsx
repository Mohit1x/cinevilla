"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import dynamic from "next/dynamic"

const WatchModal = dynamic(() => import("@/components/player/WatchModal"), { ssr: false })

interface Props {
  tmdbId: number
  imdbId?: string
  title: string
  year: string
  runtime: number
  posterUrl?: string
}

export default function WatchButton({ tmdbId, imdbId, title, year, runtime, posterUrl }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm rounded-xl transition-colors"
      >
        <Play size={16} fill="currentColor" />
        Watch Now
      </button>
      {open && (
        <WatchModal
          tmdbId={tmdbId}
          imdbId={imdbId}
          title={title}
          year={year}
          runtime={runtime}
          posterUrl={posterUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
