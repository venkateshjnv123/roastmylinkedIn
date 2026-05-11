type Props = {
  roastPoints: string[];
  bannerRoast?: string;
  bannerLabel?: string;
};

export default function RoastPanel({ roastPoints, bannerRoast, bannerLabel }: Props) {
  return (
    <div className="relative rounded-2xl bg-white border border-stone-200 p-6 flex flex-col gap-5">
      {/* ROASTED stamp */}
      <div className="absolute top-4 right-4 rotate-12 border-2 border-red-500 text-red-500 px-2.5 py-0.5 text-xs font-black uppercase tracking-widest select-none">
        ROASTED
      </div>

      <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
        🔥 The Roast
      </h2>

      <div className="flex flex-col gap-3">
        {roastPoints.slice(0, 5).map((point, i) => (
          <div
            key={i}
            className="bg-stone-50 border border-stone-100 rounded-xl p-3.5 flex gap-3 items-start"
          >
            <span className="mt-0.5 shrink-0">🔥</span>
            <p className="text-stone-700 text-sm leading-relaxed">{point}</p>
          </div>
        ))}
      </div>

      {bannerRoast && (
        <div className="border-t border-stone-100 pt-4 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            {bannerLabel ?? "Photo & Banner Roast"}
          </p>
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5 flex gap-3 items-start">
            <span className="mt-0.5 shrink-0">🔥</span>
            <p className="text-stone-700 text-sm leading-relaxed">{bannerRoast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
