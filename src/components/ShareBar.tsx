"use client";

import { useState } from "react";

type Props = {
  roastId: string;
  profileName: string;
  roastScore: number;
  category: string;
  verdict: string;
};

export default function ShareBar({ roastId, profileName, roastScore, verdict }: Props) {
  const [downloading, setDownloading] = useState(false);

  const ogUrl = `/api/og?roastId=${roastId}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const absoluteUrl = `${window.location.origin}${ogUrl}`;
      const res = await fetch(absoluteUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = profileName
        ? profileName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40)
        : "result";
      a.download = `roast-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[download] failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/result/${roastId}`
      : `/result/${roastId}`;
  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://venkyverse.space";
  const liSummary = `I got roasted on RoastMyLinkedIn 🔥 Score: ${roastScore}/100 — ${verdict} Try yours: ${appUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}&summary=${encodeURIComponent(liSummary)}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 text-center">
        Share the carnage
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl border-2 border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:border-brand hover:text-brand transition-all disabled:opacity-50"
        >
          <span>{downloading ? "⏳" : "⬇️"}</span>
          <span>{downloading ? "Downloading..." : "Download Result"}</span>
        </button>

        <a
          href={linkedInShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl border-2 border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:border-[#0A66C2] hover:text-[#0A66C2] transition-all"
        >
          <span>in</span>
          <span>Share on LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
