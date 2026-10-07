import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "N/A"
  return new Date(dateStr).getFullYear().toString()
}

export function formatRating(rating: number | undefined): string {
  if (!rating) return "N/A"
  return rating.toFixed(1)
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function getMediaTitle(item: { title?: string; name?: string }): string {
  return item.title || item.name || "Unknown"
}

export function getMediaDate(item: { release_date?: string; first_air_date?: string }): string {
  return item.release_date || item.first_air_date || ""
}
