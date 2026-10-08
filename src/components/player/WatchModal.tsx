"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import VideoPlayer from "@/components/player/VideoPlayer"
import { X } from "lucide-react"

interface WatchModalProps {
  tmdbId: number
  title: string
  year: string
  runtime: number
  posterUrl?: string
  onClose: () => void
}

interface Source {
  label: string
  url: string
  captions: { id: string; language: string; url: string; format: string }[]
}

const STEPS = [
  "Searching providers…",
  "Fetching stream sources…",
  "Verifying availability…",
  "Almost ready…",
]

export default function WatchModal({ tmdbId, title, year, runtime, posterUrl, onClose }: WatchModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedUrls = useState(() => new Set<string>())[0]

  const fetchSources = async (cancelled: () => boolean) => {
    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      type: "movie",
      progressive: "true",
      title,
      year,
      runtime: String(runtime),
    })

    while (!cancelled()) {
      try {
        const res = await fetch(`/api/sources?${params}`)
        const data = await res.json()
        if (cancelled()) return
        if (data.found && data.sources?.length && !data.pending) {
          const newSources: Source[] = data.sources.filter((s: Source) => !fetchedUrls.has(s.url))
          newSources.forEach((s: Source) => fetchedUrls.add(s.url))
          if (newSources.length) setSources(prev => [...prev, ...newSources])
          setLoading(false)
          return
        }
      } catch { /* retry */ }
      if (!cancelled()) await new Promise(r => setTimeout(r, 2000))
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchSources(() => cancelled)
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmdbId])

  const handleSourcesExhausted = () => {
    let cancelled = false
    fetchSources(() => cancelled)
  }

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const [stepIdx, setStepIdx] = useState(0)
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    if (!loading) return
    const stepInterval = setInterval(() => setStepIdx(i => Math.min(i + 1, STEPS.length - 1)), 1800)
    const barInterval = setInterval(() => setBarWidth(w => Math.min(w + 1.2, 92)), 100)
    return () => { clearInterval(stepInterval); clearInterval(barInterval) }
  }, [loading])

  useEffect(() => {
    if (!loading) setBarWidth(100)
  }, [loading])

  const modal = (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {loading && (
        <div className="relative flex flex-col items-center w-full max-w-sm px-6">
          {/* Close */}
          <button onClick={onClose} className="absolute -top-10 right-0 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>

          {/* Poster */}
          <div className="relative w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6">
            {posterUrl ? (
              <Image src={posterUrl} alt={title} fill sizes="176px" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse" />
            )}
            {/* shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Title */}
          <p className="text-white font-bold text-lg text-center mb-1 truncate w-full">{title}</p>
          <p className="text-white/40 text-sm mb-6">{year}</p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${barWidth}%` }}
            />
          </div>

          {/* Step label */}
          <p className="text-white/50 text-xs text-center h-4 transition-all duration-300">
            {STEPS[stepIdx]}
          </p>
        </div>
      )}
      {!loading && sources.length > 0 && (
        <VideoPlayer sources={sources} title={title} posterUrl={posterUrl} onClose={onClose} onSourcesExhausted={handleSourcesExhausted} />
      )}
    </div>
  )

  return createPortal(modal, document.body)
}
