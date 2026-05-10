"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/roastStore";
import Link from "next/link";

const LEVEL_LABELS: Record<string, string> = {
  mild: "Mild 😊",
  medium: "Medium 😏",
  heavy: "Heavy 🔥",
  dhoni: "Dhoni Mode 🧊",
};

const RANK_COLORS = ["text-yellow-500", "text-stone-400", "text-amber-700"];

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

type Props = { initialEntries: LeaderboardEntry[] };

export default function LeaderboardClient({ initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-stone-400">
        <p className="text-4xl mb-3">🦗</p>
        <p className="font-semibold">No roasts yet. Be the first.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-brand hover:underline"
        >
          Get roasted →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs text-stone-400 mb-1">
        Names shown as first name + last initial only.
      </p>
      {entries.map((entry, i) => (
        <div
          key={entry.roastId}
          className="flex items-start gap-4 bg-white rounded-2xl border border-stone-200 px-5 py-4"
        >
          {/* Rank */}
          <span
            className={`text-2xl font-black w-8 shrink-0 text-center ${
              RANK_COLORS[i] ?? "text-stone-300"
            }`}
          >
            {i + 1}
          </span>

          {/* Score */}
          <div className="shrink-0 text-center w-16">
            <span className="text-3xl font-black text-brand leading-none">
              {entry.roastScore}
            </span>
            <span className="block text-xs text-stone-400">/100</span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-bold text-stone-800 text-sm">
                {entry.profileName ? maskName(entry.profileName) : "LinkedIn User"}
              </span>
              <span className="text-xs font-bold bg-brand text-white px-2.5 py-0.5 rounded-full">
                {entry.category}
              </span>
              <span className="text-xs text-stone-400">
                {LEVEL_LABELS[entry.level] ?? entry.level}
              </span>
              {entry.source && (
                <span className="text-xs text-stone-400">
                  {entry.source === "pdf" ? "📄" : "📸"}
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 line-clamp-2 italic">
              &ldquo;
              {entry.verdict.length > 140
                ? entry.verdict.slice(0, 137) + "..."
                : entry.verdict}
              &rdquo;
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
