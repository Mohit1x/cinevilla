"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import Hls from "hls.js"
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Subtitles, X, ChevronRight, RotateCcw,
} from "lucide-react"

interface Caption {
  id: string
  language: string
  url: string
  format: string
  display?: string
}

interface Source {
  label: string
  url: string
  captions: Caption[]
}

interface VideoPlayerProps {
  tmdbId?: number
  sources: Source[]
  subtitles?: Caption[]
  subtitlesLoading?: boolean
  title: string
  posterUrl?: string
  onClose: () => void
  onSourcesExhausted?: () => void
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  return `${m}:${String(sec).padStart(2, "0")}`
}

function storageKey(tmdbId?: number) {
  return tmdbId ? `cv_progress_${tmdbId}` : null
}

export default function VideoPlayer({ tmdbId, sources, subtitles = [], subtitlesLoading = false, title, posterUrl, onClose, onSourcesExhausted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sourceIdx, setSourceIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"quality" | "captions">("quality")
  const [captionIdx, setCaptionIdx] = useState<number>(-1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [seeking, setSeeking] = useState(false)
  const [buffering, setBuffering] = useState(true)
  const [activeCue, setActiveCue] = useState<string>("")
  const [resumeFrom, setResumeFrom] = useState<number | null>(null)

  const hlsRef = useRef<Hls | null>(null)
  const currentSource = sources[sourceIdx]

  const captions = useMemo(() => {
    const seen = new Set<string>()
    return [...(currentSource?.captions ?? []), ...subtitles].filter(c => {
      if (seen.has(c.language)) return false
      seen.add(c.language)
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIdx, subtitles])

  // --- Resume position ---
  // On first load, check localStorage for saved position
  useEffect(() => {
    const key = storageKey(tmdbId)
    if (!key) return
    const saved = parseFloat(localStorage.getItem(key) ?? "0")
    if (saved > 10) setResumeFrom(saved)
  }, [tmdbId])

  // Save position every 5s while playing
  useEffect(() => {
    if (!tmdbId) return
    const key = storageKey(tmdbId)!
    const interval = setInterval(() => {
      const v = videoRef.current
      if (v && !v.paused && v.currentTime > 10) {
        localStorage.setItem(key, String(Math.floor(v.currentTime)))
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [tmdbId])

  // Clear saved position when video ends
  const clearProgress = useCallback(() => {
    const key = storageKey(tmdbId)
    if (key) localStorage.removeItem(key)
  }, [tmdbId])

  // --- Auto-hide controls ---
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [playing, resetHideTimer])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v) return
      switch (e.code) {
        case "Space": case "KeyK": e.preventDefault(); togglePlay(); break
        case "ArrowRight": case "KeyL": v.currentTime = Math.min(v.duration, v.currentTime + 10); break
        case "ArrowLeft": case "KeyJ": v.currentTime = Math.max(0, v.currentTime - 10); break
        case "ArrowUp": e.preventDefault(); setVolume(p => { const n = Math.min(1, p + 0.1); v.volume = n; return n }); break
        case "ArrowDown": e.preventDefault(); setVolume(p => { const n = Math.max(0, p - 0.1); v.volume = n; return n }); break
        case "KeyM": toggleMute(); break
        case "KeyF": toggleFullscreen(); break
        case "Escape": if (!fullscreen) onClose(); break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])

  // --- Fullscreen sync ---
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  // --- Track management: append once, never remove/re-add ---
  useEffect(() => {
    const v = videoRef.current
    if (!v || captions.length === 0) return

    captions.forEach(c => {
      const label = c.display ?? c.language
      if (Array.from(v.querySelectorAll("track")).find(el => el.label === label)) return
      const el = document.createElement("track")
      el.kind = "subtitles"
      el.src = c.url
      el.srclang = c.language
      el.label = label
      el.default = false
      v.appendChild(el)
      console.log("[tracks] appended:", label, c.url)
    })

    setTimeout(() => {
      Array.from(v.textTracks).forEach(t => { t.mode = "disabled" })
    }, 0)
  }, [captions])

  // --- Cue renderer ---
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    if (captionIdx === -1) {
      console.log("[caption] OFF")
      setActiveCue("")
      Array.from(v.textTracks).forEach(t => { t.mode = "disabled" })
      return
    }

    const caption = captions[captionIdx]
    const label = caption?.display ?? caption?.language ?? ""
    console.log(`[caption] selected: "${label}" idx=${captionIdx} videoTime=${v.currentTime.toFixed(1)}s`)

    // Find the HTMLTrackElement by label
    const trackEl = Array.from(v.querySelectorAll("track") as NodeListOf<HTMLTrackElement>)
      .find(el => el.label === label)

    if (!trackEl) {
      console.warn("[caption] no <track> element found for label:", label)
      return
    }

    // The TextTrack is on trackEl.track, readyState is on the HTMLTrackElement itself
    const textTrack = trackEl.track
    console.log(`[caption] trackEl.readyState=${trackEl.readyState} textTrack.mode=${textTrack?.mode} cues=${textTrack?.cues?.length ?? "null"}`)

    // Disable all others
    Array.from(v.querySelectorAll("track") as NodeListOf<HTMLTrackElement>).forEach(el => {
      if (el.label !== label) el.track.mode = "disabled"
    })

    // Set to hidden so browser loads cues but doesn't render natively
    textTrack.mode = "hidden"

    let interval: ReturnType<typeof setInterval>

    const startPolling = () => {
      console.log(`[caption] polling — cues=${textTrack.cues?.length ?? 0} videoTime=${v.currentTime.toFixed(1)}s`)
      interval = setInterval(() => {
        if (textTrack.mode !== "hidden") textTrack.mode = "hidden"
        const active = textTrack.activeCues
        if (active && active.length > 0) {
          const text = Array.from(active)
            .map(c => (c as VTTCue).text.replace(/<[^>]+>/g, ""))
            .join("\n")
          setActiveCue(text)
        } else {
          setActiveCue("")
        }
      }, 100)
    }

    // HTMLTrackElement.readyState: 0=NONE, 1=LOADING, 2=LOADED, 3=ERROR
    if (trackEl.readyState === 2) {
      console.log("[caption] already loaded")
      startPolling()
    } else {
      console.log(`[caption] waiting for load (trackEl.readyState=${trackEl.readyState})`)
      trackEl.addEventListener("load", () => {
        console.log(`[caption] loaded — cues=${textTrack.cues?.length ?? 0}`)
        startPolling()
      }, { once: true })
      trackEl.addEventListener("error", () => {
        console.error("[caption] failed to load:", trackEl.src)
      }, { once: true })
    }

    return () => {
      clearInterval(interval)
      setActiveCue("")
    }
  }, [captionIdx, captions])

  // --- Source loader ---
  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentSource?.url) return

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    v.pause()
    v.removeAttribute("src")
    v.load()
    setBuffering(true)
    setPlaying(false)

    const url = currentSource.url
    if (Hls.isSupported()) {
      const hls = new Hls({
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 0,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 0,
      })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.play().then(() => { setPlaying(true); setBuffering(false) }).catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          } else {
            setSourceIdx(i => {
              if (i + 1 < sources.length) return i + 1
              onSourcesExhausted?.()
              return i
            })
          }
        }
      })
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = url
      v.play().then(() => setPlaying(true)).catch(() => {})
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIdx])

  // --- Playback rate sync ---
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate
  }, [playbackRate])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current
    if (!v || seeking) return
    setCurrentTime(v.currentTime)
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1))
  }

  function onLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    const t = parseFloat(e.target.value)
    v.currentTime = t
    setCurrentTime(t)
  }

  function onVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    const val = parseFloat(e.target.value)
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }

  function switchSource(idx: number) {
    setSourceIdx(idx)
    setShowSettings(false)
  }

  function applyResume() {
    const v = videoRef.current
    if (!v || resumeFrom === null) return
    v.currentTime = resumeFrom
    setResumeFrom(null)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => { if (!showSettings) togglePlay() }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => { setPlaying(false); clearProgress() }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          const v = videoRef.current
          if (!v) return
          setSourceIdx(i => {
            if (i + 1 < sources.length) return i + 1
            onSourcesExhausted?.()
            return i
          })
        }}
        playsInline
      />

      {/* Subtitle cue overlay */}
      {activeCue && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none px-8">
          <span className="bg-black/70 text-white text-base px-3 py-1 rounded text-center whitespace-pre-line leading-relaxed">
            {activeCue}
          </span>
        </div>
      )}

      {/* Resume toast */}
      {resumeFrom !== null && !buffering && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 border border-white/10 rounded-xl px-4 py-3 z-10"
          onClick={e => e.stopPropagation()}
        >
          <RotateCcw size={16} className="text-amber-400 shrink-0" />
          <span className="text-white/80 text-sm">Resume from {formatTime(resumeFrom)}?</span>
          <button
            onClick={applyResume}
            className="text-xs font-semibold bg-amber-400 text-black px-3 py-1 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Resume
          </button>
          <button
            onClick={() => setResumeFrom(null)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }} />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-5 pb-10 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white font-semibold text-lg drop-shadow-lg truncate max-w-[70%]">{title}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
          <X size={22} />
        </button>
      </div>

      {/* Poster backdrop while buffering */}
      {buffering && posterUrl && (
        <div className="absolute inset-0 pointer-events-none">
          <img src={posterUrl} alt={title} className="w-full h-full object-cover opacity-20 blur-sm scale-105" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Center spinner / play indicator */}
      {buffering ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin" />
          <span className="text-white/50 text-sm">
            {sourceIdx > 0 ? `Trying source ${sourceIdx + 1} of ${sources.length}…` : "Loading…"}
          </span>
        </div>
      ) : !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={36} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="relative h-1 mb-4 group cursor-pointer">
          <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: `${bufferedPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
          <input
            type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
            onChange={onSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }} className="text-white/70 hover:text-white transition-colors">
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlay} className="text-white hover:text-amber-400 transition-colors">
            {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }} className="text-white/70 hover:text-white transition-colors">
            <SkipForward size={20} />
          </button>

          <div className="flex items-center gap-2 group/vol">
            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolumeChange} className="w-20 accent-amber-400 cursor-pointer" />
            </div>
          </div>

          <span className="text-white/60 text-xs tabular-nums ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback speed */}
          <div className="relative group/speed">
            <button className="text-white/70 hover:text-white text-xs font-semibold px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-colors">
              {playbackRate}x
            </button>
            <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden hidden group-hover/speed:block min-w-[80px]">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                <button key={r} onClick={() => setPlaybackRate(r)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${playbackRate === r ? "text-amber-400" : "text-white/80"}`}>
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Subtitles button — spinner while loading */}
          <button
            onClick={() => { setSettingsTab("captions"); setShowSettings(p => !p) }}
            className={`relative transition-colors ${captionIdx >= 0 ? "text-amber-400" : "text-white/70 hover:text-white"}`}
          >
            <Subtitles size={20} />
            {subtitlesLoading && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => { setSettingsTab("quality"); setShowSettings(p => !p) }}
            className={`transition-colors ${showSettings && settingsTab === "quality" ? "text-amber-400" : "text-white/70 hover:text-white"}`}
          >
            <Settings size={20} />
          </button>

          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
            {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="absolute bottom-20 right-4 w-64 bg-[#0f0f1a]/95 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex border-b border-white/10">
            {(["quality", "captions"] as const).map(tab => (
              <button key={tab} onClick={() => setSettingsTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${settingsTab === tab ? "text-amber-400 border-b-2 border-amber-400" : "text-white/50 hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>

          {settingsTab === "quality" && (
            <div className="py-1 max-h-64 overflow-y-auto">
              {sources.map((s, i) => (
                <button key={i} onClick={() => switchSource(i)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${sourceIdx === i ? "text-amber-400" : "text-white/80"}`}>
                  <span>{s.label}</span>
                  {sourceIdx === i && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          )}

          {settingsTab === "captions" && (
            <div className="py-1 max-h-64 overflow-y-auto">
              {subtitlesLoading && (
                <div className="flex items-center gap-2 px-4 py-3 text-white/40 text-xs">
                  <div className="w-3 h-3 rounded-full border border-white/20 border-t-amber-400 animate-spin shrink-0" />
                  Loading subtitles…
                </div>
              )}
              <button onClick={() => setCaptionIdx(-1)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${captionIdx === -1 ? "text-amber-400" : "text-white/80"}`}>
                Off
                {captionIdx === -1 && <ChevronRight size={14} />}
              </button>
              {captions.map((c, i) => (
                <button key={c.id} onClick={() => setCaptionIdx(i)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${captionIdx === i ? "text-amber-400" : "text-white/80"}`}>
                  {c.display ?? c.language}
                  {captionIdx === i && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
