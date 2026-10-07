export type MediaType = "movie" | "tv"

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  adult: boolean
  original_language: string
  video: boolean
  media_type?: MediaType
}

export interface TMDBTVShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  original_language: string
  origin_country: string[]
  media_type?: MediaType
}

export type TMDBMedia = (TMDBMovie | TMDBTVShow) & { media_type: MediaType }

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBProductionCompany {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export interface TMDBMovieDetails extends TMDBMovie {
  tagline: string
  runtime: number
  genres: TMDBGenre[]
  status: string
  budget: number
  revenue: number
  homepage: string
  imdb_id: string
  production_companies: TMDBProductionCompany[]
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[]
}

export interface TMDBTVDetails extends TMDBTVShow {
  tagline: string
  genres: TMDBGenre[]
  status: string
  number_of_seasons: number
  number_of_episodes: number
  episode_run_time: number[]
  homepage: string
  production_companies: TMDBProductionCompany[]
  networks: { id: number; name: string; logo_path: string | null }[]
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[]
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  known_for_department: string
}

export interface TMDBCredits {
  id: number
  cast: TMDBCastMember[]
  crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[]
}

export interface TMDBVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBVideosResponse {
  id: number
  results: TMDBVideo[]
}

export interface TMDBPaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TMDBDiscoverParams {
  page?: number
  sort_by?: string
  with_genres?: string
  primary_release_year?: number
  "vote_average.gte"?: number
  "vote_average.lte"?: number
  with_original_language?: string
  with_watch_providers?: string
  watch_region?: string
}

export interface TMDBWatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}
