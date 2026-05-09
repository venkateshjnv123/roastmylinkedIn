import type { RoastData, RoastLevel } from "@/lib/schemas";
import ScoreCounter from "./ScoreCounter";

const LEVEL_META: Record<RoastLevel, { label: string; emoji: string }> = {
  mild: { label: "MILD", emoji: "😊" },
  medium: { label: "MEDIUM", emoji: "😏" },
  heavy: { label: "HEAVY", emoji: "🔥" },
  dhoni: { label: "DHONI MODE", emoji: "🧊" },
};

type Props = Pick<RoastData, "profileName" | "roastScore" | "category" | "level">;

export default function HeroCard({ profileName, roastScore, category, level }: Props) {
  const meta = LEVEL_META[level];

  return (
    <div className="relative rounded-3xl overflow-hidden bg-hero px-6 py-8 sm:px-10 sm:py-10">
      {/* Flame illustration */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-6xl sm:text-8xl select-none pointer-events-none">
        🔥
      </div>

      {/* Level badge */}
      <span className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
        {meta.emoji} {meta.label}
      </span>

      {/* Headline */}
      <h1 className="mt-5 text-3xl sm:text-5xl font-black text-white leading-tight pr-20 sm:pr-32">
        {profileName}, you&apos;re{" "}
        <span className="text-brand">cooked.</span>
      </h1>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {/* Score */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Roast Score
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-5xl sm:text-6xl font-black text-brand leading-none">
              <ScoreCounter target={roastScore} />
            </span>
            <span className="text-stone-500 text-sm">/100</span>
          </div>
          <div className="mt-2.5 h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${roastScore}%` }}
            />
          </div>
          <p className="text-xs text-stone-600 mt-1">Higher = more roastable</p>
        </div>

        {/* Level */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Level
          </p>
          <p className="text-white font-bold mt-2 text-sm sm:text-base">
            {meta.emoji} {meta.label}
          </p>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Category
          </p>
          <p className="text-brand font-bold mt-2 text-sm sm:text-base leading-tight">
            {category}
          </p>
        </div>
      </div>
    </div>
  );
}
