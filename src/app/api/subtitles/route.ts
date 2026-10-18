import { NextRequest, NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"

type MovenerdsSub = { id: string; language: string; label: string; url: string }

async function fetchTV(tmdbId: string, season: string, episode: string) {
  const res = await fetch(
    `https://api.movenerds.space/api/subtitles?tmdbId=${tmdbId}&type=tv&season=${season}&episode=${episode}`,
    { cache: "no-store" }
  )
  const data: { subtitles: MovenerdsSub[] } = await res.json()
  const subs = data.subtitles ?? []

  const map = new Map<string, MovenerdsSub>()
  for (const s of subs) {
    if (!map.has(s.language)) map.set(s.language, s)
  }

  return Array.from(map.values()).map(s => ({
    id: s.id,
    language: s.language,
    display: s.label,
    format: "vtt",
    url: `/api/captions?url=${encodeURIComponent(s.url)}`,
  }))
}

async function fetchMovie(tmdbId: string) {
  const res = await fetch(
    `https://api.movenerds.space/api/subtitles?tmdbId=${tmdbId}&type=movie`,
    { cache: "no-store" }
  )
  const data: { subtitles: MovenerdsSub[] } = await res.json()
  const subs = data.subtitles ?? []

  const map = new Map<string, MovenerdsSub>()
  for (const s of subs) {
    if (!map.has(s.language)) map.set(s.language, s)
  }

  return Array.from(map.values()).map(s => ({
    id: s.id,
    language: s.language,
    display: s.label,
    format: "vtt",
    url: `/api/captions?url=${encodeURIComponent(s.url)}`,
  }))
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const tmdbId = sp.get("tmdbId")
  if (!tmdbId) return NextResponse.json({ d: "" }, { status: 400 })

  const season = sp.get("season")
  const episode = sp.get("episode")
  const isTV = !!(season && episode)

  try {
    const subtitles = isTV
      ? await fetchTV(tmdbId, season, episode)
      : await fetchMovie(tmdbId)

    const encrypted = await encrypt(subtitles)
    return NextResponse.json({ d: encrypted })
  } catch {
    return NextResponse.json({ d: await encrypt([]) })
  }
}
