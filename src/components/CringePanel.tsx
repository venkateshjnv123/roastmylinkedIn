type CringePattern = {
  icon: string;
  title: string;
  description: string;
};

type Props = {
  patterns: CringePattern[];
};

export default function CringePanel({ patterns }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-6 flex flex-col gap-5">
      {/* Panel header */}
      <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
        🚩 What gave it away?
      </h2>

      {/* 3 cringe pattern cards */}
      <div className="flex flex-col gap-3">
        {patterns.map((pattern, i) => (
          <div
            key={i}
            className="bg-stone-50 border border-stone-100 rounded-xl p-4 flex gap-4 items-start"
          >
            <span className="text-2xl shrink-0 mt-0.5">{pattern.icon}</span>
            <div>
              <p className="font-bold text-stone-800 text-sm">{pattern.title}</p>
              <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                {pattern.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
