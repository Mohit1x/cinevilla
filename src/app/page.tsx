import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getNowPlaying,
  getUpcoming,
} from "@/lib/tmdb/endpoints"
import { getMediaTitle, getMediaDate } from "@/lib/utils"
import HeroCarousel from "@/components/hero/HeroCarousel"
import SectionCarousel from "@/components/ui/SectionCarousel"
import StreamingProviders from "@/components/ui/StreamingProviders"
import type { TMDBMedia } from "@/lib/tmdb/types"

export const revalidate = 3600

function toCardProps(items: TMDBMedia[], fallbackType: "movie" | "tv" = "movie") {
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

export default async function HomePage() {
  const [trending, popularMovies, popularTV, topRated, nowPlaying, upcoming] =
    await Promise.allSettled([
      getTrending("all", "week"),
      getPopularMovies(),
      getPopularTV(),
      getTopRatedMovies(),
      getNowPlaying(),
      getUpcoming(),
    ])

  const trendingItems =
    trending.status === "fulfilled" ? trending.value.slice(0, 5) : []
  const popularMovieItems =
    popularMovies.status === "fulfilled" ? popularMovies.value.results : []
  const popularTVItems =
    popularTV.status === "fulfilled" ? popularTV.value.results : []
  const topRatedItems =
    topRated.status === "fulfilled" ? topRated.value.results : []
  const nowPlayingItems =
    nowPlaying.status === "fulfilled" ? nowPlaying.value.results : []
  const upcomingItems =
    upcoming.status === "fulfilled" ? upcoming.value.results : []

  return (
    <main className="bg-[#0a0a0f] min-h-screen">
      {/* Hero */}
      <HeroCarousel items={trendingItems as TMDBMedia[]} />

      {/* Sections */}
      <div className="space-y-14 py-14">
        <StreamingProviders />
        <SectionCarousel
          title="Popular Movies"
          items={toCardProps(popularMovieItems as TMDBMedia[], "movie")}
          defaultMediaType="movie"
        />

        <SectionCarousel
          title="Popular TV Shows"
          items={toCardProps(popularTVItems as TMDBMedia[], "tv")}
          defaultMediaType="tv"
        />

        <SectionCarousel
          title="Top Rated"
          subtitle="The highest rated films of all time"
          items={toCardProps(topRatedItems as TMDBMedia[], "movie")}
          defaultMediaType="movie"
        />

        <SectionCarousel
          title="Now Playing"
          subtitle="In cinemas right now"
          items={toCardProps(nowPlayingItems as TMDBMedia[], "movie")}
          defaultMediaType="movie"
        />

        <SectionCarousel
          title="Coming Soon"
          subtitle="Upcoming releases to look forward to"
          items={toCardProps(upcomingItems as TMDBMedia[], "movie")}
          defaultMediaType="movie"
        />
      </div>
    </main>
  )
}
