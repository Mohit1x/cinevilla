"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Hls from "hls.js"
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Subtitles, X, ChevronRight,
} from "lucide-react"

interface Caption {
  id: string
  language: string
  url: string
  format: string
}

interface Source {
  label: string
  url: string
  captions: Caption[]
}

interface VideoPlayerProps {
  sources: Source[]
  title: string
  onClose: () => void
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  return `${m}:${String(sec).padStart(2, "0")}`
}

export default function VideoPlayer({ sources, title, onClose }: VideoPlayerProps) {
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

  const hlsRef = useRef<Hls | null>(null)
  const currentSource = sources[sourceIdx]
  const captions = currentSource?.captions ?? []

  // Auto-hide controls
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

  // Keyboard shortcuts
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

  // Fullscreen change sync
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  // Caption track
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    Array.from(v.textTracks).forEach((t, i) => {
      t.mode = i === captionIdx ? "showing" : "hidden"
    })
  }, [captionIdx])

  // Source loader
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
    console.log("[video] loading url:", url)

    if (Hls.isSupported()) {
      const hls = new Hls({
        manifestLoadingTimeOut: 30000,
        manifestLoadingMaxRetry: 0,
      })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.play().then(() => { setPlaying(true); setBuffering(false) }).catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("[hls] fatal error:", data.type, data.details)
          if (data.details === "manifestIncompatibleCodecsError") {
            setSourceIdx(i => i + 1 < sources.length ? i + 1 : i)
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          } else {
            setSourceIdx(i => i + 1 < sources.length ? i + 1 : i)
          }
        }
      })
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      v.src = url
      v.play().then(() => setPlaying(true)).catch(() => {})
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIdx])

  // Playback rate sync
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
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          const v = videoRef.current
          if (!v) return
          const err = v.error
          console.error("[video] error code:", err?.code, "message:", err?.message)
          setSourceIdx(i => i + 1 < sources.length ? i + 1 : i)
        }}
        playsInline
      >
        {captions.map((c, i) => (
          <track
            key={c.id}
            kind="subtitles"
            src={c.url}
            srcLang={c.language}
            label={c.language.toUpperCase()}
            default={i === captionIdx}
          />
        ))}
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 transition-opacity duration-300"
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

      {/* Center buffering spinner / play indicator */}
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
          {/* Buffered */}
          <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: `${bufferedPct}%` }} />
          {/* Progress */}
          <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={onSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Skip back */}
          <button
            onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }}
            className="text-white/70 hover:text-white transition-colors"
          >
            <SkipBack size={20} />
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-amber-400 transition-colors">
            {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>

          {/* Skip forward */}
          <button
            onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }}
            className="text-white/70 hover:text-white transition-colors"
          >
            <SkipForward size={20} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/vol">
            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={onVolumeChange}
                className="w-20 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Time */}
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
                <button
                  key={r}
                  onClick={() => setPlaybackRate(r)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${playbackRate === r ? "text-amber-400" : "text-white/80"}`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Captions toggle */}
          {captions.length > 0 && (
            <button
              onClick={() => { setSettingsTab("captions"); setShowSettings(p => !p) }}
              className={`transition-colors ${captionIdx >= 0 ? "text-amber-400" : "text-white/70 hover:text-white"}`}
            >
              <Subtitles size={20} />
            </button>
          )}

          {/* Settings (quality) */}
          <button
            onClick={() => { setSettingsTab("quality"); setShowSettings(p => !p) }}
            className={`transition-colors ${showSettings ? "text-amber-400" : "text-white/70 hover:text-white"}`}
          >
            <Settings size={20} />
          </button>

          {/* Fullscreen */}
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
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(["quality", "captions"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${settingsTab === tab ? "text-amber-400 border-b-2 border-amber-400" : "text-white/50 hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {settingsTab === "quality" && (
            <div className="py-1 max-h-64 overflow-y-auto">
              {sources.map((s, i) => (
                <button
                  key={i}
                  onClick={() => switchSource(i)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${sourceIdx === i ? "text-amber-400" : "text-white/80"}`}
                >
                  <span>{s.label}</span>
                  {sourceIdx === i && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          )}

          {settingsTab === "captions" && (
            <div className="py-1">
              <button
                onClick={() => setCaptionIdx(-1)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${captionIdx === -1 ? "text-amber-400" : "text-white/80"}`}
              >
                Off
                {captionIdx === -1 && <ChevronRight size={14} />}
              </button>
              {captions.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCaptionIdx(i)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/8 transition-colors ${captionIdx === i ? "text-amber-400" : "text-white/80"}`}
                >
                  {c.language.toUpperCase()} — {i + 1}
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
