import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getUpcoming,
  getMovieGenres,
} from "@/lib/tmdb/endpoints"
import SectionCarousel from "@/components/ui/SectionCarousel"
import MoviesFilter from "@/components/ui/MoviesFilter"

export const revalidate = 3600

export default async function MoviesPage() {
  const [popular, topRated, nowPlaying, upcoming, genres] = await Promise.allSettled([
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlaying(),
    getUpcoming(),
    getMovieGenres(),
  ])

  const toCards = (items: { id: number; title: string; poster_path: string | null; backdrop_path: string | null; vote_average: number; release_date: string }[]) =>
    items.map((m) => ({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path,
      backdropPath: m.backdrop_path,
      rating: m.vote_average,
      releaseDate: m.release_date,
      mediaType: "movie" as const,
    }))

  return (
    <main className="bg-[#0a0a0f] min-h-screen pt-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mb-10">
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">Movies</h1>
        <p className="text-white/40 text-sm">Explore the world&apos;s finest cinema</p>
      </div>

      {/* Filter + Discover */}
      <MoviesFilter genres={genres.status === "fulfilled" ? genres.value : []} />

      <div className="space-y-14 py-10">
        {popular.status === "fulfilled" && (
          <SectionCarousel
            title="Popular Movies"
            items={toCards(popular.value.results)}
            defaultMediaType="movie"
          />
        )}
        {topRated.status === "fulfilled" && (
          <SectionCarousel
            title="Top Rated"
            subtitle="The highest rated films of all time"
            items={toCards(topRated.value.results)}
            defaultMediaType="movie"
          />
        )}
        {nowPlaying.status === "fulfilled" && (
          <SectionCarousel
            title="Now Playing"
            subtitle="In cinemas right now"
            items={toCards(nowPlaying.value.results)}
            defaultMediaType="movie"
          />
        )}
        {upcoming.status === "fulfilled" && (
          <SectionCarousel
            title="Coming Soon"
            subtitle="Upcoming releases"
            items={toCards(upcoming.value.results)}
            defaultMediaType="movie"
          />
        )}
      </div>
    </main>
  )
}
