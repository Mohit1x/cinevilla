import { NextRequest, NextResponse } from "next/server"

function srtToVtt(srt: string): string {
  const normalized = srt
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
  const converted = normalized
    .replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .replace(/^\d+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return `WEBVTT\n\n${converted}\n`
}

export async function GET(req: NextRequest) {
  // Use req.nextUrl.searchParams — Next.js decodes exactly once, which is correct
  const targetUrl = req.nextUrl.searchParams.get("url")
  if (!targetUrl) return new NextResponse("Missing url", { status: 400 })
  console.log("[captions] fetching:", targetUrl)

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Referer": targetUrl.includes("movenerds") ? "https://api.movenerds.space/" : "https://dulo.mov/",
        "Origin": targetUrl.includes("movenerds") ? "https://api.movenerds.space" : "https://dulo.mov",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    })

    console.log("[captions] upstream status:", res.status, "content-type:", res.headers.get("content-type"))

    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    console.log("[captions] byteLength:", buf.byteLength)

    let text: string
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    } catch {
      text = new TextDecoder("windows-1252").decode(bytes)
    }

    console.log("[captions] first 80 chars:", text.substring(0, 80))

    // Catch error responses disguised as WEBVTT
    if (text.includes("\"error\"") && text.includes("CORS")) {
      console.error("[captions] upstream returned CORS error:", text.substring(0, 200))
      return new NextResponse("Upstream blocked request", { status: 502 })
    }

    const trimmed = text.trimStart()
    if (!trimmed.startsWith("WEBVTT")) {
      // Check if it's already VTT-formatted (timestamps use . not ,)
      if (/\d{2}:\d{2}:\d{2}\.\d{3}/.test(trimmed)) {
        // Already VTT cues, just prepend the header
        text = `WEBVTT\n\n${trimmed}`
      } else {
        text = srtToVtt(text)
      }
    } else {
      text = trimmed
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("[captions] fetch failed:", e)
    return new NextResponse("Failed to fetch captions", { status: 502 })
  }
}
