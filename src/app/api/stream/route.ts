import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  const range = req.headers.get("range")

  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://dulo.mov/",
      "Origin": "https://dulo.mov",
      ...(range ? { "Range": range } : {}),
    },
    redirect: "follow",
  })

  const contentType = upstream.headers.get("content-type") ?? ""
  const isHLS = contentType.includes("mpegurl") || contentType.includes("x-mpegurl")

  const resHeaders = new Headers()
  ;["content-type", "content-length", "content-range", "accept-ranges"].forEach(h => {
    const v = upstream.headers.get(h)
    if (v) resHeaders.set(h, v)
  })
  resHeaders.set("Cache-Control", "no-store")
  resHeaders.set("Access-Control-Allow-Origin", "*")

  if (isHLS) {
    const text = await upstream.text()
    const base = req.nextUrl.origin
    const rewritten = text
      .replace(/^(https?:\/\/[^\s"]+)$/gm, m => `${base}/api/stream?url=${encodeURIComponent(m)}`)
      .replace(/URI="(https?:\/\/[^"]+)"/g, (_, u) => `URI="${base}/api/stream?url=${encodeURIComponent(u)}"`)
    resHeaders.set("Content-Type", "application/vnd.apple.mpegurl")
    resHeaders.delete("content-length")
    return new NextResponse(rewritten, { status: upstream.status, headers: resHeaders })
  }

  // Stream binary segments directly — no buffering
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders })
}
