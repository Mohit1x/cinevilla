"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import VideoPlayer from "@/components/player/VideoPlayer"
import { X } from "lucide-react"

function AdBanner({ optKey, src, width, height }: { optKey: string; src: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const container = ref.current
    const html = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;overflow:hidden}</style></head><body>
<script>atOptions={'key':'${optKey}','format':'iframe','height':${height},'width':${width},'params':{}}<\/script>
<script src="${src}"><\/script>
</body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement("iframe")
    iframe.src = url
    iframe.width = String(width)
    iframe.height = String(height)
    iframe.style.border = "none"
    iframe.scrolling = "no"
    container.appendChild(iframe)
    return () => {
      URL.revokeObjectURL(url)
      if (container.contains(iframe)) container.removeChild(iframe)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div ref={ref} style={{ width, height, minWidth: width, minHeight: height }} />
}

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
      ...(mediaType === "tv" && season != null ? { season: String(season) } : {}),
      ...(mediaType === "tv" && episode != null ? { episode: String(episode) } : {}),
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
    // Fetch subtitles in parallel if imdbId is available
    if (imdbId) {
      fetch(`/api/subtitles?tmdbId=${tmdbId}&imdbId=${encodeURIComponent(imdbId)}`)
        .then(r => r.json())
        .then(data => {
          if (!cancelled) { setSubtitles(data); setSubtitlesLoading(false) }
        })
        .catch(() => { setSubtitlesLoading(false) })
    } else {
      setSubtitlesLoading(false)
    }
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
          {/* Top banner ad */}
          <div className="flex justify-center items-center py-2 w-full shrink-0">
            <AdBanner optKey="15127a25ba1e2e69a6489bcae8db1cdc" src="https://bancadeltempoidea.org/22/15127a25ba1e2e69a6489bcae8db1cdc" width={468} height={60} />
          </div>

          {/* Middle row: left ad + poster + right ad */}
          <div className="flex flex-1 items-center justify-center gap-6 w-full">
            {/* Left vertical ad */}
            <div className="hidden lg:flex items-center justify-center shrink-0">
              <AdBanner optKey="a3a51579da55d85447afc3a1c263fe87" src="https://bancadeltempoidea.org/22/a3a51579da55d85447afc3a1c263fe87" width={160} height={600} />
            </div>

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

            {/* Right vertical ad */}
            <div className="hidden lg:flex items-center justify-center shrink-0">
              <AdBanner optKey="a3a51579da55d85447afc3a1c263fe87" src="https://bancadeltempoidea.org/22/a3a51579da55d85447afc3a1c263fe87" width={160} height={600} />
            </div>
          </div>

          {/* Bottom banner ad */}
          <div className="flex justify-center items-center py-2 w-full shrink-0">
            <AdBanner optKey="15127a25ba1e2e69a6489bcae8db1cdc" src="https://bancadeltempoidea.org/22/15127a25ba1e2e69a6489bcae8db1cdc" width={468} height={60} />
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
