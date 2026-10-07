"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Search, Film, Tv, X, Star, Play } from "lucide-react"
import { searchMulti } from "@/lib/tmdb/endpoints"
import { getTmdbImage } from "@/lib/tmdb/image"
import { formatDate, formatRating, getMediaTitle, getMediaDate } from "@/lib/utils"
import type { TMDBMedia } from "@/lib/tmdb/types"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") ?? ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<TMDBMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchMulti(q)
      setResults(data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv"))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query)
      if (query.trim()) {
        router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, doSearch, router])

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, []) // eslint-disable-line

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Search input */}
      <motion.div
        className="relative max-w-2xl mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, TV shows..."
          autoFocus
          className="w-full bg-white/6 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-white/30 text-base outline-none focus:border-amber-400/40 focus:bg-white/8 transition-all duration-300"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => { setQuery(""); setResults([]); setSearched(false) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading skeletons */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="animate-pulse"
              >
                <div className="aspect-[2/3] rounded-xl bg-white/5" />
                <div className="mt-2 h-3 bg-white/5 rounded w-3/4" />
                <div className="mt-1.5 h-3 bg-white/5 rounded w-1/2" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!loading && searched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5"
            >
              <Search size={28} className="text-white/20" />
            </motion.div>
            <p className="text-white/50 text-lg font-medium mb-2">No results found</p>
            <p className="text-white/30 text-sm">Try a different title or keyword</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state */}
      <AnimatePresence>
        {!loading && !searched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5"
            >
              <Search size={28} className="text-white/20" />
            </motion.div>
            <p className="text-white/50 text-lg font-medium mb-2">Search CineVilla</p>
            <p className="text-white/30 text-sm">Find movies and TV shows from around the world</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/40 text-sm mb-6"
            >
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </motion.p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {results.map((item, i) => {
                const title = getMediaTitle(item)
                const year = formatDate(getMediaDate(item))
                const rating = formatRating(item.vote_average)
                const href = `/${item.media_type}/${item.id}`

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
                    whileHover={{ y: -6, scale: 1.03 }}
                  >
                    <Link href={href} className="group block">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-lg">
                        {item.poster_path ? (
                          <Image
                            src={getTmdbImage(item.poster_path, "w342")}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {item.media_type === "tv" ? (
                              <Tv size={28} className="text-white/15" />
                            ) : (
                              <Film size={28} className="text-white/15" />
                            )}
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <Play size={18} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70">
                            {item.media_type === "tv" ? "TV" : "Film"}
                          </span>
                        </div>

                        {/* Rating badge */}
                        {rating !== "N/A" && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-semibold text-white">{rating}</span>
                          </div>
                        )}
                      </div>

                      <p className="mt-2.5 text-white/90 text-sm font-medium line-clamp-2 leading-tight group-hover:text-white transition-colors">
                        {title}
                      </p>
                      {year !== "N/A" && (
                        <p className="text-white/40 text-xs mt-1">{year}</p>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
