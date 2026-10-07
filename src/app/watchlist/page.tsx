"use client"

import Image from "next/image"
import Link from "next/link"
import { Bookmark, Trash2, Film, Tv } from "lucide-react"
import { useWatchlist } from "@/hooks/useWatchlist"
import { getTmdbImage } from "@/lib/tmdb/image"
import { formatDate, formatRating } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist()

  return (
    <main className="bg-[#0a0a0f] min-h-screen pt-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-10">
          <Bookmark size={24} className="text-amber-400" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Watchlist</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {watchlist.length} title{watchlist.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <Bookmark size={32} className="text-white/20" />
            </div>
            <p className="text-white/50 text-xl font-medium mb-2">Your watchlist is empty</p>
            <p className="text-white/30 text-sm mb-6">
              Save movies and TV shows to watch later
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-amber-400 text-black font-bold text-sm rounded-xl hover:bg-amber-300 transition-colors"
            >
              Discover Titles
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {watchlist.map((item, i) => (
                <motion.div
                  key={`${item.mediaType}-${item.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="group relative"
                >
                  <Link href={`/${item.mediaType}/${item.id}`} className="block">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2">
                      {item.posterPath ? (
                        <Image
                          src={getTmdbImage(item.posterPath, "w342")}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 50vw, 200px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.mediaType === "tv" ? (
                            <Tv size={28} className="text-white/15" />
                          ) : (
                            <Film size={28} className="text-white/15" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70">
                          {item.mediaType === "tv" ? "TV" : "Film"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromWatchlist(item.id, item.mediaType)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400/30 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 size={12} />
                  </button>

                  <p className="text-white/90 text-sm font-medium line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.releaseDate && (
                      <span className="text-white/40 text-xs">{formatDate(item.releaseDate)}</span>
                    )}
                    {item.rating > 0 && (
                      <span className="text-amber-400/70 text-xs">★ {formatRating(item.rating)}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </main>
  )
}
