const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export type ImageSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "original"

export function getTmdbImage(path: string | null | undefined, size: ImageSize = "w500"): string {
  if (!path) return "/placeholder-poster.jpg"
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getTmdbBackdrop(path: string | null | undefined): string {
  if (!path) return "/placeholder-backdrop.jpg"
  return `${TMDB_IMAGE_BASE}/original${path}`
}
