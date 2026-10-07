import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#080810] border-t border-white/5 mt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-black tracking-tight text-white">CINE</span>
              <span className="text-2xl font-black tracking-tight text-amber-400">VILLA</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Discover the world&apos;s finest films and television. Your premium destination for cinematic exploration.
            </p>
            <p className="text-white/25 text-xs mt-4">
              Movie data provided by{" "}
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/60 hover:text-amber-400 transition-colors"
              >
                The Movie Database (TMDB)
              </a>
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/movies", label: "Movies" },
                { href: "/tv", label: "TV Shows" },
                { href: "/watchlist", label: "Watchlist" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
              Info
            </h4>
            <ul className="space-y-2">
              {["About", "Contact", "Privacy", "Terms"].map((item) => (
                <li key={item}>
                  <span className="text-white/40 text-sm cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} CineVilla. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  )
}
