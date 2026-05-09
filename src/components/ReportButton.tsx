"use client";

import { useState } from "react";

type Props = { roastId: string };

export default function ReportButton({ roastId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleReport = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roastId }),
      });
    } finally {
      setState("done");
    }
  };

  return (
    <button
      onClick={handleReport}
      disabled={state !== "idle"}
      className="text-xs text-stone-400 hover:text-stone-600 disabled:cursor-default transition-colors underline underline-offset-2"
    >
      {state === "done" ? "✓ Reported" : state === "loading" ? "Reporting..." : "🚩 Report this roast"}
    </button>
  );
}
