import { getWatchProviders } from "@/lib/tmdb/endpoints"
import { getTmdbImage } from "@/lib/tmdb/image"
import StreamingProvidersClient from "./StreamingProvidersClient"

const FEATURED_IDS = [8, 9, 337, 15, 1899, 350, 531, 283, 386, 43, 73, 257, 99, 151, 430, 520]

export default async function StreamingProviders() {
  let providers: { id: number; name: string; logo: string }[] = []

  try {
    const all = await getWatchProviders("US")
    const map = new Map(all.map((p) => [p.provider_id, p]))
    providers = FEATURED_IDS
      .filter((id) => map.has(id))
      .map((id) => {
        const p = map.get(id)!
        return { id: p.provider_id, name: p.provider_name, logo: getTmdbImage(p.logo_path, "w92") }
      })
  } catch {
    // silently skip
  }

  if (!providers.length) return null

  return <StreamingProvidersClient providers={providers} />
}
