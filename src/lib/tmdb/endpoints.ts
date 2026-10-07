import { tmdbClient } from "./client"
import type {
  TMDBMedia,
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCredits,
  TMDBVideosResponse,
  TMDBPaginatedResponse,
  TMDBDiscoverParams,
  TMDBGenre,
  TMDBWatchProvider,
} from "./types"

export async function getTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "week"
): Promise<TMDBMedia[]> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMedia>>(
    `/trending/${mediaType}/${timeWindow}`
  )
  return data.results
}

export async function getPopularMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>("/movie/popular", {
    params: { page },
  })
  return data
}

export async function getPopularTV(page = 1): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>("/tv/popular", {
    params: { page },
  })
  return data
}

export async function getTopRatedMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>("/movie/top_rated", {
    params: { page },
  })
  return data
}

export async function getTopRatedTV(page = 1): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>("/tv/top_rated", {
    params: { page },
  })
  return data
}

export async function getNowPlaying(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>("/movie/now_playing", {
    params: { page },
  })
  return data
}

export async function getUpcoming(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>("/movie/upcoming", {
    params: { page },
  })
  return data
}

export async function getAiringToday(page = 1): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>("/tv/airing_today", {
    params: { page },
  })
  return data
}

export async function getOnTheAir(page = 1): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>("/tv/on_the_air", {
    params: { page },
  })
  return data
}

export async function getMovieDetails(id: number): Promise<TMDBMovieDetails> {
  const { data } = await tmdbClient.get<TMDBMovieDetails>(`/movie/${id}`)
  return data
}

export async function getTVDetails(id: number): Promise<TMDBTVDetails> {
  const { data } = await tmdbClient.get<TMDBTVDetails>(`/tv/${id}`)
  return data
}

export async function getMovieCredits(id: number): Promise<TMDBCredits> {
  const { data } = await tmdbClient.get<TMDBCredits>(`/movie/${id}/credits`)
  return data
}

export async function getTVCredits(id: number): Promise<TMDBCredits> {
  const { data } = await tmdbClient.get<TMDBCredits>(`/tv/${id}/credits`)
  return data
}

export async function getMovieVideos(id: number): Promise<TMDBVideosResponse> {
  const { data } = await tmdbClient.get<TMDBVideosResponse>(`/movie/${id}/videos`)
  return data
}

export async function getTVVideos(id: number): Promise<TMDBVideosResponse> {
  const { data } = await tmdbClient.get<TMDBVideosResponse>(`/tv/${id}/videos`)
  return data
}

export async function getMovieRecommendations(id: number): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
    `/movie/${id}/recommendations`
  )
  return data
}

export async function getTVRecommendations(id: number): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>(
    `/tv/${id}/recommendations`
  )
  return data
}

export async function searchMulti(
  query: string,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMedia>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMedia>>("/search/multi", {
    params: { query, page, include_adult: false },
  })
  return data
}

export async function discoverMovies(
  params: TMDBDiscoverParams = {}
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>("/discover/movie", {
    params,
  })
  return data
}

export async function discoverTV(
  params: TMDBDiscoverParams = {}
): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  const { data } = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>("/discover/tv", {
    params,
  })
  return data
}

export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const { data } = await tmdbClient.get<{ genres: TMDBGenre[] }>("/genre/movie/list")
  return data.genres
}

export async function getTVGenres(): Promise<TMDBGenre[]> {
  const { data } = await tmdbClient.get<{ genres: TMDBGenre[] }>("/genre/tv/list")
  return data.genres
}

export async function getWatchProviders(region = "US"): Promise<TMDBWatchProvider[]> {
  const { data } = await tmdbClient.get<{ results: TMDBWatchProvider[] }>("/watch/providers/movie", {
    params: { language: "en-US", watch_region: region },
  })
  return data.results
}
