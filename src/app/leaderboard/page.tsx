import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { getLeaderboard } from "@/lib/roastStore";
import LeaderboardClient from "@/components/LeaderboardClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hall of Shame",
  description: "The most brutally roasted LinkedIn profiles. See who got cooked hardest by AI.",
};

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 mb-2">
              🏆 Hall of Shame
            </h1>
            <p className="text-stone-500 text-sm">
              Most roasted LinkedIn profiles this week · refreshes every 60s
            </p>
          </div>

          <LeaderboardClient initialEntries={entries} />
        </div>
      </main>
    </>
  );
}
