import {
  getPopularTV,
  getTopRatedTV,
  getAiringToday,
  getOnTheAir,
} from "@/lib/tmdb/endpoints"
import SectionCarousel from "@/components/ui/SectionCarousel"

export const revalidate = 3600

export default async function TVPage() {
  const [popular, topRated, airingToday, onTheAir] = await Promise.allSettled([
    getPopularTV(),
    getTopRatedTV(),
    getAiringToday(),
    getOnTheAir(),
  ])

  const toCards = (items: { id: number; name: string; poster_path: string | null; backdrop_path: string | null; vote_average: number; first_air_date: string }[]) =>
    items.map((s) => ({
      id: s.id,
      title: s.name,
      posterPath: s.poster_path,
      backdropPath: s.backdrop_path,
      rating: s.vote_average,
      releaseDate: s.first_air_date,
      mediaType: "tv" as const,
    }))

  return (
    <main className="bg-[#0a0a0f] min-h-screen pt-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mb-10">
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">TV Shows</h1>
        <p className="text-white/40 text-sm">Discover the best television has to offer</p>
      </div>

      <div className="space-y-14 pb-14">
        {popular.status === "fulfilled" && (
          <SectionCarousel
            title="Popular TV Shows"
            items={toCards(popular.value.results)}
            defaultMediaType="tv"
          />
        )}
        {topRated.status === "fulfilled" && (
          <SectionCarousel
            title="Top Rated"
            subtitle="The highest rated series of all time"
            items={toCards(topRated.value.results)}
            defaultMediaType="tv"
          />
        )}
        {airingToday.status === "fulfilled" && (
          <SectionCarousel
            title="Airing Today"
            subtitle="New episodes dropping today"
            items={toCards(airingToday.value.results)}
            defaultMediaType="tv"
          />
        )}
        {onTheAir.status === "fulfilled" && (
          <SectionCarousel
            title="Currently Airing"
            subtitle="Series with new episodes this week"
            items={toCards(onTheAir.value.results)}
            defaultMediaType="tv"
          />
        )}
      </div>
    </main>
  )
}
