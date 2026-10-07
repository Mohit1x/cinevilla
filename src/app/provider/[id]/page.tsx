import { discoverMovies, discoverTV } from "@/lib/tmdb/endpoints"
import { getMediaTitle, getMediaDate } from "@/lib/utils"
import SectionCarousel from "@/components/ui/SectionCarousel"
import type { TMDBMedia } from "@/lib/tmdb/types"

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ name?: string }>
}

function toCardProps(items: TMDBMedia[], fallbackType: "movie" | "tv") {
  return items.map((item) => ({
    id: item.id,
    title: getMediaTitle(item),
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    rating: item.vote_average,
    releaseDate: getMediaDate(item),
    mediaType: (item.media_type ?? fallbackType) as "movie" | "tv",
  }))
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { name = "Provider" } = await searchParams

  const providerParams = {
    with_watch_providers: id,
    watch_region: "US",
    sort_by: "popularity.desc",
  }

  const [movies, tv] = await Promise.allSettled([
    discoverMovies(providerParams),
    discoverTV(providerParams),
  ])

  const movieItems = movies.status === "fulfilled" ? movies.value.results : []
  const tvItems = tv.status === "fulfilled" ? tv.value.results : []

  return (
    <main className="bg-[#0a0a0f] min-h-screen pt-28">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-10 mb-12">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Streaming</p>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">{name}</h1>
          <p className="text-white/40 mt-2 text-sm">Movies and shows available on {name}</p>
        </div>

        <div className="space-y-14 pb-14">
          {movieItems.length > 0 && (
            <SectionCarousel
              title="Movies"
              subtitle={`Popular movies on ${name}`}
              items={toCardProps(movieItems as TMDBMedia[], "movie")}
              defaultMediaType="movie"
            />
          )}

          {tvItems.length > 0 && (
            <SectionCarousel
              title="TV Shows"
              subtitle={`Popular series on ${name}`}
              items={toCardProps(tvItems as TMDBMedia[], "tv")}
              defaultMediaType="tv"
            />
          )}

          {movieItems.length === 0 && tvItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-white/40 text-lg font-medium">No content found for {name}</p>
              <p className="text-white/20 text-sm mt-2">This provider may not be available in your region</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
