"use client"

import { useState, useEffect, useCallback } from "react"

export interface WatchlistItem {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  rating: number
  releaseDate: string
  mediaType: "movie" | "tv"
}

const STORAGE_KEY = "cinevilla_watchlist"

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setWatchlist(JSON.parse(stored))
    } catch {}
  }, [])

  const save = (items: WatchlistItem[]) => {
    setWatchlist(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }

  const addToWatchlist = useCallback(
    (item: WatchlistItem) => {
      setWatchlist((prev) => {
        if (prev.find((i) => i.id === item.id && i.mediaType === item.mediaType)) return prev
        const next = [item, ...prev]
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    },
    []
  )

  const removeFromWatchlist = useCallback(
    (id: number, mediaType: "movie" | "tv") => {
      setWatchlist((prev) => {
        const next = prev.filter((i) => !(i.id === id && i.mediaType === mediaType))
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    },
    []
  )

  const isInWatchlist = useCallback(
    (id: number, mediaType: "movie" | "tv") =>
      watchlist.some((i) => i.id === id && i.mediaType === mediaType),
    [watchlist]
  )

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, save }
}
