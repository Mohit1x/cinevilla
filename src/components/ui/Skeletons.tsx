export function SkeletonCard() {
  return (
    <div className="shrink-0 w-[160px] sm:w-[180px] lg:w-[200px] animate-pulse">
      <div className="aspect-[2/3] rounded-xl bg-white/5" />
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative w-full h-[85vh] min-h-[560px] bg-[#0d0d14] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d14] via-[#0d0d14]/60 to-transparent" />
      <div className="absolute bottom-16 left-10 lg:left-20 space-y-4 w-full max-w-lg">
        <div className="h-4 bg-white/5 rounded w-32" />
        <div className="h-12 bg-white/5 rounded w-80" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="flex gap-3 mt-6">
          <div className="h-12 bg-white/5 rounded-xl w-36" />
          <div className="h-12 bg-white/5 rounded-xl w-32" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonDetails() {
  return (
    <div className="animate-pulse">
      <div className="h-[60vh] bg-white/5" />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-6">
        <div className="h-8 bg-white/5 rounded w-64" />
        <div className="h-4 bg-white/5 rounded w-48" />
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-white/5 rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}
