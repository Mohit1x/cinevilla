import { Suspense } from "react"
import SearchClient from "@/components/ui/SearchClient"

export default function SearchPage() {
  return (
    <main className="bg-[#0a0a0f] min-h-screen pt-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <Suspense fallback={<div className="text-white/40 text-sm py-10">Loading...</div>}>
          <SearchClient />
        </Suspense>
      </div>
    </main>
  )
}
