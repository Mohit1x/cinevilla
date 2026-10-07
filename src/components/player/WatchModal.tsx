"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import VideoPlayer from "@/components/player/VideoPlayer"
import { Loader2 } from "lucide-react"

interface WatchModalProps {
  tmdbId: number
  title: string
  year: string
  runtime: number
  onClose: () => void
}

interface Source {
  label: string
  url: string
  captions: { id: string; language: string; url: string; format: string }[]
}

export default function WatchModal({ tmdbId, title, year, runtime, onClose }: WatchModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      type: "movie",
      progressive: "true",
      title,
      year,
      runtime: String(runtime),
    })

    const poll = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/sources?${params}`)
          const data = await res.json()
          if (cancelled) return
          if (data.found && data.sources?.length && !data.pending) {
            setSources(data.sources)
            setLoading(false)
            return
          }
        } catch { /* network error, retry */ }
        if (!cancelled) await new Promise(r => setTimeout(r, 2000))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [tmdbId, title, year, runtime])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const modal = (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 size={36} className="animate-spin text-amber-400" />
          <span className="text-sm">Finding sources… this may take a moment</span>
        </div>
      )}
      {!loading && sources.length > 0 && (
        <VideoPlayer sources={sources} title={title} onClose={onClose} />
      )}
    </div>
  )

  return createPortal(modal, document.body)
}
