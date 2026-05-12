"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0E8] text-stone-800">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <button
          onClick={reset}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-[#EA6C0A] transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
