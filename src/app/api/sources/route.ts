import { NextRequest, NextResponse } from "next/server"

const SERVER_NAMES: [RegExp, string][] = [
  [/luna/i, "Luna"],
  [/orion/i, "Orion"],
  [/atlas/i, "Atlas"],
  [/dcloud/i, "DCloud"],
  [/1080/i, "Orion"],
  [/720/i, "Luna"],
  [/480/i, "Atlas"],
]

function brandLabel(label: string, idx: number): string {
  const res = label.match(/\d{3,4}p/)?.[0] ?? ""
  for (const [re, server] of SERVER_NAMES) {
    if (re.test(label)) return `CineVilla - ${server}` + (res ? ` • ${res}` : "")
  }
  return `CineVilla - Server ${idx + 1}` + (res ? ` • ${res}` : "")
}

type RawCaption = { id: string; language: string; url: string; format: string }
type RawSource = { url: string; label: string; captions: RawCaption[] }

function proxySources(sources: RawSource[]) {
  return sources.map((s, i) => ({
    ...s,
    label: brandLabel(s.label, i),
    url: `/api/stream?url=${encodeURIComponent(s.url)}`,
    captions: s.captions?.map(c => ({
      ...c,
      url: `/api/captions?url=${encodeURIComponent(c.url)}`,
    })) ?? [],
  }))
}

interface MovernerdsSource {
  url: string
  name: string
  type: string
  quality?: string
}

interface MovernerdsResponse {
  success: boolean
  primarySources?: MovernerdsSource[]
}

async function fetchMovenerds(
  tmdbId: string,
  title: string,
  year: string,
  mediaType: string,
  season: string | null,
  episode: string | null,
): Promise<RawSource[] | null> {
  try {
    const url = new URL("https://api.movenerds.space/api/stream")
    url.searchParams.set("tmdbId", tmdbId)
    url.searchParams.set("type", mediaType)
    url.searchParams.set("title", title)
    url.searchParams.set("year", year)
    url.searchParams.set("language", "en")
    if (season) url.searchParams.set("season", season)
    if (episode) url.searchParams.set("episode", episode)
    console.log("[movenerds] fetching:", url.toString())
    const res = await fetch(url.toString(), { cache: "no-store" })
    const data: MovernerdsResponse = await res.json()
    console.log("[movenerds] success:", data.success, "sources:", data.primarySources?.length)
    if (!data.success || !data.primarySources?.length) return null
    return data.primarySources.map((s, i) => {
      const q = s.quality?.match(/\d{3,4}p/)?.[0] ?? ""
      return {
        url: s.url,
        label: (s.name ?? `Server ${i + 1}`) + (q ? ` ${q}` : ""),
        captions: [],
      }
    })
  } catch (e) { console.error("[movenerds] error:", e) }
  return null
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://dulo.mov/",
  "Origin": "https://dulo.mov",
  "Content-Type": "application/json",
}

async function fetchAdditional(
  tmdbId: string,
  title: string,
  year: string,
  runtime: string,
  mediaType: string,
  season: string | null,
  episode: string | null,
): Promise<RawSource[] | null> {
  try {
    const url = new URL("https://dulo.mov/api/sources/additional")
    url.searchParams.set("tmdbId", tmdbId)
    url.searchParams.set("type", mediaType)
    url.searchParams.set("progressive", "true")
    url.searchParams.set("title", title)
    url.searchParams.set("year", year)
    url.searchParams.set("runtime", runtime)
    if (season) url.searchParams.set("seasonId", season)
    if (episode) url.searchParams.set("episodeId", episode)
    console.log("[additional] fetching:", url.toString())
    const res = await fetch(url.toString(), { headers: HEADERS, cache: "no-store" })
    console.log("[additional] status:", res.status, "content-type:", res.headers.get("content-type"))
    const text = await res.text()
    console.log("[additional] raw text (500 chars):", text.slice(0, 500))
    let data: { found?: boolean; pending?: boolean; sources?: RawSource[] }
    try { data = JSON.parse(text) } catch { console.error("[additional] not JSON"); return null }
    console.log("[additional] found:", data.found, "pending:", data.pending, "sources:", data.sources?.length)
    if (data.found && data.sources?.length) return data.sources
  } catch (e) { console.error("[additional] error:", e) }
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
    console.log("[browser] seed:", seed)

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
    console.log("[browser] vortex url:", payloadUrl.toString())

    const payloadRes = await fetch(payloadUrl.toString(), { headers: HEADERS, cache: "no-store" })
    const vortex = await payloadRes.json()
    console.log("[browser] vortex error:", vortex.error)
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
    console.log("[browser] POST body (no vortex):", JSON.stringify({ ...body, vortex: "..." }))

    const browserRes = await fetch("https://dulo.mov/api/sources/browser", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await browserRes.json()
    console.log("[browser] response sources count:", data.sources?.length, "labels:", data.sources?.map((s: RawSource) => s.label))
    if (data.sources?.length) return data.sources
  } catch (e) { console.error("[browser] error:", e) }
  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const tmdbId = sp.get("tmdbId") ?? ""
  const title = sp.get("title") ?? ""
  const year = sp.get("year") ?? ""
  const runtime = sp.get("runtime") ?? "45"
  const mediaType = sp.get("type") ?? "movie"
  const season = sp.get("seasonId")
  const episode = sp.get("episodeId")
  const imdbId = sp.get("imdbId") ?? ""

  try {
    // Try movenerds first, fall back to dulo sources
    const movenerds = await fetchMovenerds(tmdbId, title, year, mediaType, season, episode)
    if (movenerds) {
      console.log("[sources] movenerds won:", movenerds.length)
      return NextResponse.json({ found: true, sources: proxySources(movenerds) })
    }

    // Race dulo sources as fallback
    const result = await Promise.any([
      fetchAdditional(tmdbId, title, year, runtime, mediaType, season, episode).then(s => { if (!s) throw new Error("no sources"); return s }),
      fetchBrowser(tmdbId, title, year, runtime, mediaType, season, episode, imdbId)
        .then(s => { if (!s) throw new Error("no sources"); return s }),
    ])
    console.log("[sources] dulo winner sources count:", result.length)
    return NextResponse.json({ found: true, sources: proxySources(result) })
  } catch (e) {
    console.error("[sources] all failed:", e)
    return NextResponse.json({ found: false, pending: true })
  }
}
