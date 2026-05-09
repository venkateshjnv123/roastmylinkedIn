import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="font-black text-sm sm:text-base tracking-tight text-stone-900 uppercase">
            Roast{" "}
            <span className="text-brand">My LinkedIn</span>
          </span>
        </Link>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors border border-stone-300 rounded-lg px-3 py-1.5"
        >
          <span>🏆</span>
          <span>Leaderboard</span>
        </Link>
      </div>
    </nav>
  );
}
