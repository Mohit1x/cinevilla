"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Search, Film, Tv, X } from "lucide-react"
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

  // Debounce
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
    <div>
      {/* Search input */}
      <div className="relative max-w-2xl mb-10">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, TV shows..."
          autoFocus
          className="w-full bg-white/6 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-white/30 text-base outline-none focus:border-amber-400/40 focus:bg-white/8 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setSearched(false) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-xl bg-white/5" />
              <div className="mt-2 h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search size={24} className="text-white/20" />
          </div>
          <p className="text-white/50 text-lg font-medium mb-2">No results found</p>
          <p className="text-white/30 text-sm">Try a different title or keyword</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search size={24} className="text-white/20" />
          </div>
          <p className="text-white/50 text-lg font-medium mb-2">Search CineVilla</p>
          <p className="text-white/30 text-sm">Find movies and TV shows from around the world</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <p className="text-white/40 text-sm mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {results.map((item, i) => {
                const title = getMediaTitle(item)
                const year = formatDate(getMediaDate(item))
                const rating = formatRating(item.vote_average)
                const href = `/${item.media_type}/${item.id}`

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  >
                    <Link href={href} className="group block">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2">
                        {item.poster_path ? (
                          <Image
                            src={getTmdbImage(item.poster_path, "w342")}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70">
                            {item.media_type === "tv" ? "TV" : "Film"}
                          </span>
                        </div>
                      </div>
                      <p className="text-white/90 text-sm font-medium line-clamp-2 leading-tight group-hover:text-white transition-colors">
                        {title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {year !== "N/A" && <span className="text-white/40 text-xs">{year}</span>}
                        {rating !== "N/A" && (
                          <span className="text-amber-400/70 text-xs">★ {rating}</span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
