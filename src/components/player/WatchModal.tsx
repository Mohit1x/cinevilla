"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import VideoPlayer from "@/components/player/VideoPlayer"
import { X } from "lucide-react"

interface WatchModalProps {
  tmdbId: number
  imdbId?: string
  title: string
  year: string
  runtime: number
  posterUrl?: string
  onClose: () => void
  season?: number
  episode?: number
  mediaType?: "movie" | "tv"
}

interface Source {
  label: string
  url: string
  captions: { id: string; language: string; url: string; format: string }[]
}

interface Subtitle {
  id: string
  language: string
  display: string
  format: string
  url: string
}

const STEPS = [
  "Searching providers…",
  "Fetching stream sources…",
  "Verifying availability…",
  "Almost ready…",
]

export default function WatchModal({ tmdbId, imdbId, title, year, runtime, posterUrl, onClose, season, episode, mediaType = "movie" }: WatchModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [subtitlesLoading, setSubtitlesLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const fetchedUrls = useState(() => new Set<string>())[0]

  const fetchSources = async (cancelled: () => boolean) => {
    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      type: mediaType,
      progressive: "true",
      title,
      year,
      runtime: String(runtime),
      ...(mediaType === "tv" && season != null ? { seasonId: String(season) } : {}),
      ...(mediaType === "tv" && episode != null ? { episodeId: String(episode) } : {}),
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
          // keep polling if only a single 480p source came back
          const only480 = data.sources.length === 1 && data.sources[0].label?.toLowerCase().includes("480")
          if (!only480) { setLoading(false); return }
        }
      } catch { /* retry */ }
      if (!cancelled()) await new Promise(r => setTimeout(r, 2000))
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchSources(() => cancelled)
    // Fetch subtitles — use imdbId if available, fallback to tmdbId only
    const subtitleUrl = imdbId
      ? `/api/subtitles?tmdbId=${tmdbId}&imdbId=${encodeURIComponent(imdbId)}`
      : `/api/subtitles?tmdbId=${tmdbId}`
    fetch(subtitleUrl)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setSubtitles(data); setSubtitlesLoading(false) } })
      .catch(() => { if (!cancelled) setSubtitlesLoading(false) })
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
        <div className="flex flex-col items-center w-full h-full">
          {/* Middle row: left ad + poster + right ad */}
          <div className="flex flex-1 items-center justify-center gap-6 w-full">
            {/* Center: poster + loading */}
            <div className="relative flex flex-col items-center max-w-sm w-full px-6">
              <button onClick={onClose} className="absolute -top-10 right-0 text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="relative w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6">
                {posterUrl ? (
                  <Image src={posterUrl} alt={title} fill sizes="176px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 animate-pulse" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <p className="text-white font-bold text-lg text-center mb-1 truncate w-full">{title}</p>
              <p className="text-white/40 text-sm mb-6">{year}</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className="text-white/50 text-xs text-center h-4 transition-all duration-300">
                {STEPS[stepIdx]}
              </p>
            </div>
          </div>
        </div>
      )}
      {!loading && sources.length > 0 && (
        <VideoPlayer
          tmdbId={tmdbId}
          sources={sources}
          subtitles={subtitles}
          subtitlesLoading={subtitlesLoading}
          title={title}
          posterUrl={posterUrl}
          onClose={onClose}
          onSourcesExhausted={handleSourcesExhausted}
        />
      )}
    </div>
  )

  return createPortal(modal, document.body)
}
