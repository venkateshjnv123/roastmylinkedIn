import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { normalizeName } from "@/lib/roastStore";

export async function DELETE(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 503 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!redis) {
    return NextResponse.json({ error: "Redis not available." }, { status: 503 });
  }

  let name: string | null = req.nextUrl.searchParams.get("name");
  if (!name) {
    try {
      const body = await req.json();
      name = body?.name ?? null;
    } catch { /* ok */ }
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing name." }, { status: 400 });
  }

  const norm = normalizeName(name);

  // Get all roastIds for this name
  const roastIds = await redis.smembers(`name_roasts:${norm}`) as string[];

  let roastsDeleted = 0;
  if (roastIds.length > 0) {
    const pipeline = redis.pipeline();
    for (const id of roastIds) {
      pipeline.del(`roast:${norm}:${id}`);
      pipeline.del(`roast_id:${id}`);
      pipeline.zrem("leaderboard", id);
      pipeline.srem("reports", id);
    }
    await pipeline.exec();
    roastsDeleted = roastIds.length;
  }

  await redis.del(`name_roasts:${norm}`);

  // Scan and delete Upstash rate limit keys for this name
  let rateLimitKeysDeleted = 0;
  const rlPattern = `@upstash/ratelimit:${norm}|*`;
  let cursor: string | number = "0";

  do {
    const [next, keys] = await redis.scan(cursor, { match: rlPattern, count: 100 }) as [string, string[]];
    cursor = next;
    if (keys.length > 0) {
      await redis.del(...(keys as [string, ...string[]]));
      rateLimitKeysDeleted += keys.length;
    }
  } while (cursor !== "0");

  return NextResponse.json({ deleted: { roasts: roastsDeleted, rateLimitKeys: rateLimitKeysDeleted } });
}
