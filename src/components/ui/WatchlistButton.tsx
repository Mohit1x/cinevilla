"use client"

import { Bookmark, BookmarkCheck } from "lucide-react"
import { useWatchlist, type WatchlistItem } from "@/hooks/useWatchlist"

interface WatchlistButtonProps {
  item: WatchlistItem
}

export default function WatchlistButton({ item }: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  const saved = isInWatchlist(item.id, item.mediaType)

  const toggle = () => {
    if (saved) removeFromWatchlist(item.id, item.mediaType)
    else addToWatchlist(item)
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2.5 px-6 py-3 border font-semibold text-sm rounded-xl transition-all ${
        saved
          ? "bg-amber-400/15 border-amber-400/40 text-amber-400 hover:bg-amber-400/20"
          : "bg-white/8 border-white/10 text-white hover:bg-white/15 hover:border-white/20"
      }`}
    >
      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      {saved ? "Saved" : "Watchlist"}
    </button>
  )
}
