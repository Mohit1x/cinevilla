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
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { "Referer": "https://dulo.mov/", "Origin": "https://dulo.mov" },
      cache: "no-store",
    })

    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    console.log("[captions] buf byteLength:", buf.byteLength, "first special bytes:", Array.from(bytes.slice(40, 55)).map(b => b.toString(16).padStart(2,'0')).join(' '))

    // Detect encoding: if file has bytes > 0x7F that form invalid UTF-8 sequences,
    // it's latin1/windows-1252. We check by attempting strict UTF-8 decode.
    let text: string
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
      console.log("[captions] decoded as utf-8, sample:", text.substring(40, 80))
    } catch {
      // Invalid UTF-8 — decode as windows-1252
      text = new TextDecoder("windows-1252").decode(bytes)
      console.log("[captions] decoded as windows-1252, sample:", text.substring(40, 80))
    }

    if (!text.trimStart().startsWith("WEBVTT")) text = srtToVtt(text)

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        // No Content-Disposition — browser rejects <track> loads with attachment header
      },
    })
  } catch {
    return new NextResponse("Failed to fetch captions", { status: 502 })
  }
}
