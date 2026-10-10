import { NextRequest, NextResponse } from "next/server"

type RawCaption = { id: string; language: string; url: string; format: string }
type RawSource = { url: string; label: string; captions: RawCaption[] }

function proxySources(sources: RawSource[]) {
  return sources.map(s => ({
    ...s,
    url: `/api/stream?url=${encodeURIComponent(s.url)}`,
    captions: s.captions?.map(c => ({
      ...c,
      url: `/api/captions?url=${encodeURIComponent(c.url)}`,
    })) ?? [],
  }))
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://dulo.mov/",
  "Origin": "https://dulo.mov",
  "Content-Type": "application/json",
}

async function fetchAdditional(sp: URLSearchParams): Promise<RawSource[] | null> {
  try {
    const url = new URL("https://dulo.mov/api/sources/additional")
    sp.forEach((v, k) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), { headers: HEADERS, cache: "no-store" })
    const data = await res.json()
    if (data.found && data.sources?.length && !data.pending) return data.sources
  } catch { /* ignore */ }
  return null
}

async function fetchBrowser(
  tmdbId: string,
  title: string,
  year: string,
  runtime: string,
  mediaType: string,
  season: string | null,
  episode: string | null,
  imdbId: string,
): Promise<RawSource[] | null> {
  try {
    // Step 1: seed
    const seedRes = await fetch(
      `https://api.wecollege.net/seed?mediaId=${tmdbId}`,
      { headers: HEADERS, cache: "no-store" }
    )
    const { seed } = await seedRes.json()

    // Step 2: vortex payload
    const payloadUrl = new URL("https://api.wecollege.net/paris/sources")
    payloadUrl.searchParams.set("tmdbId", tmdbId)
    payloadUrl.searchParams.set("title", title)
    payloadUrl.searchParams.set("year", year)
    payloadUrl.searchParams.set("mediaType", mediaType)
    payloadUrl.searchParams.set("totalSeasons", "0")
    payloadUrl.searchParams.set("enc", "2")
    payloadUrl.searchParams.set("seed", seed)
    if (mediaType === "tv" && season) payloadUrl.searchParams.set("seasonId", season)
    if (mediaType === "tv" && episode) payloadUrl.searchParams.set("episodeId", episode)
    if (imdbId) payloadUrl.searchParams.set("imdbId", imdbId)

    const payloadRes = await fetch(payloadUrl.toString(), { headers: HEADERS, cache: "no-store" })
    const vortex = await payloadRes.json()
    if (vortex.error) return null

    // Step 3: POST to browser
    const body: Record<string, unknown> = {
      tmdbId,
      title,
      year: Number(year),
      runtime: Number(runtime),
      mediaType,
      sources: [],
      vortex,
    }
    if (mediaType === "tv" && season) body.seasonId = Number(season)
    if (mediaType === "tv" && episode) body.episodeId = Number(episode)

    const browserRes = await fetch("https://dulo.mov/api/sources/browser", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await browserRes.json()
    if (data.sources?.length) return data.sources
  } catch { /* ignore */ }
  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const tmdbId = sp.get("tmdbId") ?? ""
  const title = sp.get("title") ?? ""
  const year = sp.get("year") ?? ""
  const runtime = sp.get("runtime") ?? "45"
  const mediaType = sp.get("type") ?? "movie"
  const season = sp.get("season")
  const episode = sp.get("episode")
  const imdbId = sp.get("imdbId") ?? ""

  try {
    // Race both sources — first one with results wins
    const result = await Promise.any([
      fetchAdditional(sp).then(s => { if (!s) throw new Error("no sources"); return s }),
      fetchBrowser(tmdbId, title, year, runtime, mediaType, season, episode, imdbId)
        .then(s => { if (!s) throw new Error("no sources"); return s }),
    ])

    return NextResponse.json({ found: true, sources: proxySources(result) })
  } catch {
    return NextResponse.json({ found: false, pending: true })
  }
}
