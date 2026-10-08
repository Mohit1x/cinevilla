"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface GoogleAdProps {
  slot: string
  format?: "auto" | "rectangle" | "vertical" | "horizontal"
  className?: string
}

export default function GoogleAd({ slot, format = "auto", className }: GoogleAdProps) {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-5410643778743575"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
