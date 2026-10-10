import { NextRequest, NextResponse } from "next/server"

type RawSub = { id: string; language: string; display: string; format: string; url: string; source: string; isHearingImpaired?: boolean }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const tmdbId = searchParams.get("tmdbId")
  const imdbId = searchParams.get("imdbId")
  if (!tmdbId || !imdbId) return NextResponse.json([], { status: 400 })

  try {
    const res = await fetch(
      `https://dulo.mov/api/subtitles/search?id=${tmdbId}&imdb=${imdbId}`,
      { cache: "no-store" }
    )
    const data: RawSub[] = await res.json()
    console.log("[/api/subtitles] raw response count:", data.length, "first:", data[0])

    // Deduplicate: one per language, prefer vtt over srt
    const map = new Map<string, RawSub>()
    for (const sub of data) {
      const existing = map.get(sub.language)
      if (!existing || (sub.format === "vtt" && existing.format !== "vtt")) {
        map.set(sub.language, sub)
      }
    }

    const subtitles = Array.from(map.values()).map(s => ({
      id: s.id,
      language: s.language,
      display: s.display,
      format: s.format,
      url: `/api/captions?url=${encodeURIComponent(s.url)}`,
    }))
    console.log("[/api/subtitles] deduplicated:", subtitles.map(s => ({ lang: s.language, display: s.display, format: s.format })))

    return NextResponse.json(subtitles)
  } catch {
    return NextResponse.json([])
  }
}
