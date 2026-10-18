import { NextRequest, NextResponse } from "next/server"

const SERVER_NAMES: [RegExp, string][] = [
  [/luna/i, "Luna"],
  [/orion/i, "Orion"],
  [/atlas/i, "Atlas"],
  [/dcloud/i, "DCloud"],
  [/vidzee/i, "Vidzee"],
  [/vidrock/i, "VidRock"],
]

function brandLabel(name: string, idx: number): string {
  for (const [re, server] of SERVER_NAMES) {
    if (re.test(name)) return `CineVilla - ${server}`
  }
  return `CineVilla - Server ${idx + 1}`
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

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const tmdbId = sp.get("tmdbId")
  const title = sp.get("title")
  const year = sp.get("year")
  const season = sp.get("seasonId")
  const episode = sp.get("episodeId")

  if (!tmdbId || !title || !year || !season || !episode) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  try {
    const url = new URL("https://api.movenerds.space/api/stream")
    url.searchParams.set("tmdbId", tmdbId)
    url.searchParams.set("type", "tv")
    url.searchParams.set("title", title)
    url.searchParams.set("year", year)
    url.searchParams.set("season", season)
    url.searchParams.set("episode", episode)
    url.searchParams.set("language", "en")

    const res = await fetch(url.toString(), { cache: "no-store" })
    const data: MovernerdsResponse = await res.json()

    if (!data.success || !data.primarySources?.length) {
      return NextResponse.json({ found: false })
    }

    const base = req.nextUrl.origin
    const sources = data.primarySources.map((s, i) => {
      const res = s.quality?.match(/\d{3,4}p/)?.[0] ?? ""
      return {
        label: brandLabel(s.name, i) + (res ? ` • ${res}` : ""),
        url: `${base}/api/stream?url=${encodeURIComponent(s.url)}`,
        captions: [],
      }
    })

    return NextResponse.json({ found: true, sources })
  } catch (e) {
    console.error("[tv-sources] error:", e)
    return NextResponse.json({ found: false })
  }
}
