import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import HeroCard from "@/components/HeroCard";
import RoastPanel from "@/components/RoastPanel";
import CringePanel from "@/components/CringePanel";
import ShareBar from "@/components/ShareBar";
import ReportButton from "@/components/ReportButton";
// import TryHarsherMode from "@/components/TryHarsherMode"; // disabled — needs sessionStorage re-upload fix
import { getRoast } from "@/lib/roastStore";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) return {};

  const ogUrl = `/api/og?roastId=${id}`;
  const displayName = roast.profileName || "Your LinkedIn";
  const title = `${displayName} got roasted — ${roast.roastScore}/100`;
  const description = roast.verdict;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const roast = await getRoast(id);

  if (!roast) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <HeroCard
            profileName={roast.profileName}
            roastScore={roast.roastScore}
            category={roast.category}
            level={roast.level}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <RoastPanel
              roastPoints={roast.roastPoints}
              bannerRoast={roast.bannerRoast}
              bannerLabel={roast.source === "pdf" ? "Writing Style Roast" : "Photo & Banner Roast"}
            />
            <CringePanel patterns={roast.cringePatterns} />
          </div>

          {/* Full-width verdict card */}
          <div className="rounded-3xl bg-hero px-6 py-8 sm:px-10 sm:py-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
              Final Verdict 🎯
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-snug">
              &ldquo;{roast.verdict}&rdquo;
            </p>
          </div>

          <ShareBar
            roastId={id}
            profileName={roast.profileName}
            roastScore={roast.roastScore}
            category={roast.category}
            verdict={roast.verdict}
          />

          <div className="text-center flex flex-col items-center gap-3 pb-4">
            {/* <TryHarsherMode level={roast.level} /> */}
            <a
              href="/"
              className="inline-block bg-brand text-white font-black px-8 py-3.5 rounded-2xl hover:bg-brand-hover transition-colors"
            >
              🔥 Roast another
            </a>
            <ReportButton roastId={id} />
          </div>
        </div>
      </main>
    </>
  );
}
