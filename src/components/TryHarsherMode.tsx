"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoastLevel } from "@/lib/schemas";

const NEXT_LEVEL: Partial<Record<RoastLevel, RoastLevel>> = {
  mild: "medium",
  medium: "heavy",
  heavy: "samay",
};

const BUTTON_LABEL: Partial<Record<RoastLevel, string>> = {
  medium: "😏 Try Medium Mode",
  heavy: "🔥 Try Heavy Mode",
  samay: "🎤 Try Samay Mode",
};

export default function TryHarsherMode({ level }: { level: RoastLevel }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextLevel = NEXT_LEVEL[level];
  if (!nextLevel) return null;

  const handleClick = async () => {
    const image = sessionStorage.getItem("pendingRoastImage");
    const mimeType = sessionStorage.getItem("pendingRoastMimeType") ?? "image/jpeg";

    if (!image) {
      setError("Original screenshot not available. Re-upload to try a new level.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType, level: nextLevel }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Roast failed.");
        return;
      }
      sessionStorage.setItem("pendingRoastImage", image);
      sessionStorage.setItem("pendingRoastMimeType", mimeType);
      router.push(`/result/${(data as { roastId: string }).roastId}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-stone-900 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {loading ? "⏳ Roasting..." : BUTTON_LABEL[nextLevel]}
      </button>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
