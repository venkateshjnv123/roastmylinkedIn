"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import LoadingState from "./LoadingState";

type RoastLevel = "mild" | "medium" | "heavy" | "dhoni";
type ErrorType = "not_linkedin" | "rate_limit" | "generic" | null;

const LEVELS: { id: RoastLevel; emoji: string; label: string }[] = [
  { id: "mild", emoji: "😊", label: "Mild" },
  { id: "medium", emoji: "😏", label: "Medium" },
  { id: "heavy", emoji: "🔥", label: "Heavy" },
  { id: "dhoni", emoji: "🧊", label: "Dhoni Mode" },
];

const MAX_FILE_SIZE_MB = 5;

function formatBytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [level, setLevel] = useState<RoastLevel>("medium");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [profileName, setProfileName] = useState("");
  const [roastsRemaining, setRoastsRemaining] = useState<number | null>(null);

  const clearError = () => {
    setError(null);
    setErrorType(null);
  };

  const processFile = useCallback(async (raw: File) => {
    clearError();
    if (!raw.type.startsWith("image/")) {
      setError("Only PNG and JPG files accepted.");
      setErrorType("generic");
      return;
    }
    if (raw.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      setErrorType("generic");
      return;
    }
    const compressed = await imageCompression(raw, {
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) processFile(dropped);
    },
    [processFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile]
  );

  const handleSubmit = async () => {
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    clearError();

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          level,
          mimeType: file.type,
          profileName: profileName.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 422) {
          setErrorType("not_linkedin");
          setError("That doesn't look like a LinkedIn profile screenshot. Please upload a full-page screenshot of a LinkedIn profile.");
        } else if (res.status === 429) {
          setErrorType("rate_limit");
          const retryHours = (data as { retryInHours?: number }).retryInHours;
          setError(retryHours ? `Daily limit reached (5/5 used). Resets in ${retryHours}h.` : "Daily limit reached. You get 5 roasts per day.");
          setRoastsRemaining(0);
        } else {
          setErrorType("generic");
          setError((data as { error?: string }).error ?? `Something went wrong (${res.status}).`);
        }
        setIsSubmitting(false);
        return;
      }

      const remaining = res.headers.get("X-RateLimit-Remaining");
      if (remaining !== null) setRoastsRemaining(Number(remaining));

      router.push(`/result/${(data as { roastId: string }).roastId}`);
    } catch {
      setErrorType("generic");
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    clearError();
    if (inputRef.current) inputRef.current.value = "";
  };

  // While submitting — show loading state instead of the form
  if (isSubmitting) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-white border border-stone-200">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Upload zone */}
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-colors",
          file
            ? "border-brand bg-orange-50 cursor-default"
            : isDragOver
            ? "border-brand bg-orange-50 cursor-copy"
            : "border-stone-300 bg-white hover:border-brand hover:bg-orange-50/40 cursor-pointer",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={handleInputChange}
        />

        {preview && file ? (
          <div className="p-4 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Profile preview"
              className="max-h-64 rounded-xl object-contain"
            />
            <div className="flex items-center gap-3 text-sm text-stone-500">
              <span>{file.name}</span>
              <span>·</span>
              <span>{formatBytes(file.size)}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-sm text-stone-500 hover:text-stone-900 underline underline-offset-2 transition-colors"
            >
              Change image
            </button>
          </div>
        ) : (
          <div className="py-14 px-6 flex flex-col items-center gap-3 text-center select-none">
            <div className="text-4xl">📸</div>
            <div>
              <p className="font-semibold text-stone-800">
                Drop your LinkedIn screenshot here
              </p>
              <p className="text-sm text-stone-500 mt-1">
                or click to browse · PNG / JPG · max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Name input */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">
          Whose profile is this? <span className="normal-case font-normal">(optional)</span>
        </p>
        <input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          maxLength={100}
          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 text-sm focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Level selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
          Choose roast level
        </p>
        <div className="grid grid-cols-4 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={[
                "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all",
                level === l.id
                  ? "border-brand bg-brand text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-brand hover:text-brand",
              ].join(" ")}
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="text-xs">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Errors */}
      {error && errorType === "rate_limit" && (
        <div className="flex gap-3 items-start bg-purple-50 border border-purple-200 rounded-xl px-4 py-3.5">
          <span className="text-xl shrink-0">⏳</span>
          <div>
            <p className="font-bold text-purple-800 text-sm">Daily limit reached</p>
            <p className="text-purple-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
      {error && errorType === "not_linkedin" && (
        <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
          <span className="text-xl shrink-0">🔍</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Not a LinkedIn screenshot</p>
            <p className="text-amber-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
      {error && errorType === "generic" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file}
        className={[
          "w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all",
          file
            ? "bg-brand text-white hover:bg-brand-hover active:scale-[0.98]"
            : "bg-stone-200 text-stone-400 cursor-not-allowed",
        ].join(" ")}
      >
        🔥 Roast Me
      </button>

      {/* Rate limit remaining */}
      {roastsRemaining !== null && roastsRemaining < 5 && (
        <p className="text-center text-xs text-stone-400">
          {roastsRemaining === 0
            ? "No roasts left today. Resets in 24h."
            : `${roastsRemaining} roast${roastsRemaining === 1 ? "" : "s"} remaining today`}
        </p>
      )}
    </div>
  );
}
