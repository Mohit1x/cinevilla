import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, Clock, Calendar, Globe, Play, ChevronLeft } from "lucide-react"
import {
  getTVDetails,
  getTVCredits,
  getTVRecommendations,
  getTVVideos,
} from "@/lib/tmdb/endpoints"
import { getTmdbImage, getTmdbBackdrop } from "@/lib/tmdb/image"
import { formatDate, formatRating } from "@/lib/utils"
import SectionCarousel from "@/components/ui/SectionCarousel"
import CastCarousel from "@/components/ui/CastCarousel"
import WatchlistButton from "@/components/ui/WatchlistButton"

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

export default async function TVPage({ params }: Props) {
  const { id } = await params
  const tvId = parseInt(id)

  if (isNaN(tvId)) notFound()

  const [show, credits, recommendations, videos] = await Promise.allSettled([
    getTVDetails(tvId),
    getTVCredits(tvId),
    getTVRecommendations(tvId),
    getTVVideos(tvId),
  ])

  if (show.status === "rejected") notFound()

  const data = show.value
  const cast = credits.status === "fulfilled" ? credits.value.cast.slice(0, 15) : []
  const similar =
    recommendations.status === "fulfilled" ? recommendations.value.results.slice(0, 15) : []
  const trailer =
    videos.status === "fulfilled"
      ? videos.value.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
        ) ?? videos.value.results.find((v) => v.type === "Trailer" && v.site === "YouTube")
      : null

  const backdrop = getTmdbBackdrop(data.backdrop_path)
  const poster = getTmdbImage(data.poster_path, "w500")
  const runtime = data.episode_run_time?.[0]

  return (
    <main className="bg-[#0a0a0f] min-h-screen">
      {/* Backdrop Hero */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-hidden">
        <Image
          src={backdrop}
          alt={data.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/60 to-transparent" />

        <Link
          href="/tv"
          className="absolute top-24 left-4 sm:left-6 lg:left-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft size={18} />
          Back
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 -mt-32 lg:-mt-48 relative z-10">
          {/* Poster */}
          <div className="shrink-0 w-40 sm:w-52 lg:w-64 mx-auto lg:mx-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Image
                src={poster}
                alt={data.name}
                fill
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 208px, 256px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-0 lg:pt-36">
            {/* Genres */}
            {data.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {data.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-white/8 border border-white/10 text-white/60"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2">
              {data.name}
            </h1>

            {data.tagline && (
              <p className="text-white/40 text-base italic mb-4">&ldquo;{data.tagline}&rdquo;</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              {data.vote_average > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <span className="text-white font-semibold">{formatRating(data.vote_average)}</span>
                  <span className="text-white/30">/ 10</span>
                </div>
              )}
              {data.first_air_date && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Calendar size={14} />
                  <span>{formatDate(data.first_air_date)}</span>
                </div>
              )}
              {runtime && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Clock size={14} />
                  <span>{runtime}m / ep</span>
                </div>
              )}
              {data.number_of_seasons > 0 && (
                <span className="text-white/50">
                  {data.number_of_seasons} Season{data.number_of_seasons !== 1 ? "s" : ""}
                </span>
              )}
              {data.original_language && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Globe size={14} />
                  <span className="uppercase">{data.original_language}</span>
                </div>
              )}
            </div>

            {/* Overview */}
            {data.overview && (
              <p className="text-white/70 text-base leading-relaxed mb-8 max-w-2xl">
                {data.overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled
                className="flex items-center gap-2.5 px-6 py-3 bg-amber-400/20 border border-amber-400/30 text-amber-400/60 font-bold text-sm rounded-xl cursor-not-allowed"
                title="Streaming coming soon"
              >
                <Play size={16} />
                Watch Now — Coming Soon
              </button>

              <WatchlistButton
                item={{
                  id: data.id,
                  title: data.name,
                  posterPath: data.poster_path,
                  backdropPath: data.backdrop_path,
                  rating: data.vote_average,
                  releaseDate: data.first_air_date,
                  mediaType: "tv",
                }}
              />

              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-6 py-3 bg-white/8 border border-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/15 hover:border-white/20 transition-all"
                >
                  <Play size={16} />
                  Trailer
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-16">
            <CastCarousel cast={cast} />
          </div>
        )}

        {/* Recommendations */}
        {similar.length > 0 && (
          <div className="mt-16 mb-10">
            <SectionCarousel
              title="You May Also Like"
              items={similar.map((s) => ({
                id: s.id,
                title: s.name,
                posterPath: s.poster_path,
                backdropPath: s.backdrop_path,
                rating: s.vote_average,
                releaseDate: s.first_air_date,
                mediaType: "tv" as const,
              }))}
              defaultMediaType="tv"
            />
          </div>
        )}
      </div>
    </main>
  )
}
