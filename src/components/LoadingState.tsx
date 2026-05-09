"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Verifying this is actually a LinkedIn profile... 🔍",
  "Analyzing your humble brags...",
  "Counting cringe hashtags...",
  "Measuring buzzword density...",
  "Detecting gurupanti levels...",
  "Calibrating the roast cannon...",
  "Cross-referencing peak cringe behavior...",
  "Consulting the LinkedIn cringe database...",
  "Generating your professional humiliation...",
  "Almost done cooking...",
];

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full py-16 flex flex-col items-center gap-5 text-center">
      <div className="text-6xl animate-bounce">🔥</div>

      <p
        className="font-black text-lg sm:text-xl text-stone-900 transition-opacity duration-300 max-w-xs"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {MESSAGES[msgIndex]}
      </p>

      <p className="text-sm text-stone-400">Usually takes 10–15 seconds</p>

      <div className="flex gap-2 mt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
