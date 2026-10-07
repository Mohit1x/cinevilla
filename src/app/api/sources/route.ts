import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const url = new URL("https://dulo.mov/api/sources/additional")
  searchParams.forEach((v, k) => url.searchParams.set(k, v))

  try {
    const res = await fetch(url.toString(), { cache: "no-store" })
    const data = await res.json()
    if (data.sources?.length) {
      data.sources = data.sources.map((s: { url: string; label: string; captions: unknown[] }) => ({
        ...s,
        url: `/api/stream?url=${encodeURIComponent(s.url)}`,
      }))
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ found: false }, { status: 502 })
  }
}
