import redis from "./redis";
import type { RoastData } from "./schemas";

const ROAST_TTL = 60 * 60 * 24 * 30; // 30 days

// In-memory fallback for local dev — pinned to global to survive Next.js hot reloads
const g = global as typeof global & { __devStore?: Map<string, RoastData> };
if (!g.__devStore) g.__devStore = new Map();
const devStore = g.__devStore;

export function normalizeName(name: string): string {
  const clean = name.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").slice(0, 80);
  return clean || "unknown";
}

export type LeaderboardEntry = {
  roastId: string;
  profileName: string;
  roastScore: number;
  category: string;
  level: string;
  verdict: string;
  createdAt: number;
  source?: string;
};

export async function saveRoast(data: RoastData): Promise<void> {
  if (redis) {
    const norm = normalizeName(data.profileName);
    await Promise.all([
      redis.setex(`roast:${norm}:${data.roastId}`, ROAST_TTL, JSON.stringify(data)),
      redis.setex(`roast_id:${data.roastId}`, ROAST_TTL, norm),
      redis.zadd("leaderboard", { score: data.roastScore, member: data.roastId }),
      redis.sadd(`name_roasts:${norm}`, data.roastId),
    ]);
    await redis.zremrangebyrank("leaderboard", 0, -101);
  } else {
    devStore.set(data.roastId, data);
  }
}

export async function getRoast(id: string): Promise<RoastData | null> {
  if (redis) {
    // Try old key format first for backwards compat
    const oldRaw = await redis.get(`roast:${id}`);
    if (oldRaw) return (typeof oldRaw === "string" ? JSON.parse(oldRaw) : oldRaw) as RoastData;
    // New format: look up norm via reverse index
    const norm = await redis.get(`roast_id:${id}`);
    if (!norm) return null;
    const raw = await redis.get(`roast:${norm}:${id}`);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as RoastData;
  }
  return devStore.get(id) ?? null;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (redis) {
    const ids = await redis.zrange<string[]>("leaderboard", 0, 9, { rev: true });
    if (!ids || ids.length === 0) return [];
    const roasts = await Promise.all(ids.map((id) => getRoast(id)));
    return roasts
      .filter((r): r is RoastData => r !== null)
      .map(({ roastId, profileName, roastScore, category, level, verdict, createdAt, source }) => ({
        roastId, profileName, roastScore, category, level, verdict, createdAt, source,
      }));
  }
  return [...devStore.values()]
    .sort((a, b) => b.roastScore - a.roastScore)
    .slice(0, 10)
    .map(({ roastId, profileName, roastScore, category, level, verdict, createdAt }) => ({
      roastId, profileName, roastScore, category, level, verdict, createdAt,
    }));
}

export async function reportRoast(roastId: string): Promise<void> {
  if (redis) {
    await redis.sadd("reports", roastId);
  }
}
