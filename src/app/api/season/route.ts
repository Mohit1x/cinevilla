import { NextRequest, NextResponse } from "next/server"
import { getTVSeason } from "@/lib/tmdb/endpoints"

export async function GET(req: NextRequest) {
  const tvId = Number(req.nextUrl.searchParams.get("tvId"))
  const season = Number(req.nextUrl.searchParams.get("season"))
  if (!tvId || !season) return NextResponse.json({ error: "Missing params" }, { status: 400 })
  try {
    const data = await getTVSeason(tvId, season)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
