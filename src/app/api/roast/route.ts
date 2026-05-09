import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { RoastRequestSchema } from "@/lib/schemas";
import { roastProfile, NotLinkedInError } from "@/lib/gemini";
import { saveRoast } from "@/lib/roastStore";
import redis from "@/lib/redis";

const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 d") })
  : null;

export async function POST(req: NextRequest) {
  let rateLimitRemaining: number | null = null;

  if (ratelimit) {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "anonymous";

    const { success, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      const retryInHours = Math.ceil((reset - Date.now()) / 1000 / 3600);
      return NextResponse.json(
        {
          error: `You've used all 5 roasts for today. Try again in ${retryInHours}h.`,
          retryInHours,
        },
        { status: 429 }
      );
    }
    rateLimitRemaining = remaining;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RoastRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { image, mimeType, level, profileName } = parsed.data;

  let roastData: Awaited<ReturnType<typeof roastProfile>>;
  try {
    roastData = await roastProfile(image, mimeType, level, profileName);
  } catch (err) {
    if (err instanceof NotLinkedInError) {
      return NextResponse.json(
        { error: "That doesn't look like a LinkedIn profile screenshot." },
        { status: 422 }
      );
    }
    console.error("[roast] Groq error:", err);
    return NextResponse.json(
      { error: "Roast generation failed. Please try again." },
      { status: 500 }
    );
  }

  const roastId = crypto.randomUUID();
  const fullData = { ...roastData, roastId, level, createdAt: Date.now() };

  try {
    await saveRoast(fullData);
  } catch (err) {
    console.error("[roast] Store error:", err);
  }

  const responseHeaders: Record<string, string> = {};
  if (rateLimitRemaining !== null) {
    responseHeaders["X-RateLimit-Remaining"] = String(rateLimitRemaining);
  }

  return NextResponse.json({ roastId, ...roastData }, { headers: responseHeaders });
}
