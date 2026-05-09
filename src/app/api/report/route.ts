import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { reportRoast, getRoast } from "@/lib/roastStore";
import redis from "@/lib/redis";

const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 d") })
  : null;

export async function POST(req: NextRequest) {
  if (ratelimit) {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "anonymous";
    const { success } = await ratelimit.limit(`report:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many reports." }, { status: 429 });
    }
  }

  try {
    const body = await req.json();
    const { roastId } = body;

    if (!roastId || typeof roastId !== "string" || roastId.length > 64) {
      return NextResponse.json({ error: "Missing roastId" }, { status: 400 });
    }

    const roast = await getRoast(roastId);
    if (!roast) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    await reportRoast(roastId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
