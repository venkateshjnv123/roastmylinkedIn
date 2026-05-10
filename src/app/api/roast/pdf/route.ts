import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import pdfParse from "pdf-parse";
import { PdfRoastRequestSchema } from "@/lib/schemas";
import { roastProfileFromText, NotLinkedInError } from "@/lib/gemini";
import { saveRoast, normalizeName } from "@/lib/roastStore";
import redis from "@/lib/redis";

const pdfRatelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "1 d") })
  : null;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PdfRoastRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pdfBase64, level, profileName } = parsed.data;

  let rateLimitRemaining: number | null = null;

  if (pdfRatelimit) {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "anonymous";

    const norm = profileName ? normalizeName(profileName) : null;
    const identifier = norm ? `pdf:${norm}|${ip}` : `pdf:${ip}`;
    const { success, reset, remaining } = await pdfRatelimit.limit(identifier);
    if (!success) {
      const retryInHours = Math.ceil((reset - Date.now()) / 1000 / 3600);
      return NextResponse.json(
        { error: `PDF roast limit reached (2/day). Try again in ${retryInHours}h.`, retryInHours },
        { status: 429 }
      );
    }
    rateLimitRemaining = remaining;
  }

  let profileText: string;
  try {
    const buffer = Buffer.from(pdfBase64, "base64");
    const pdfData = await pdfParse(buffer);
    profileText = pdfData.text?.trim() ?? "";

    if (profileText.length < 100) {
      return NextResponse.json(
        { error: "Could not extract enough text from the PDF. Make sure it's a LinkedIn profile export." },
        { status: 422 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to read the PDF. Please try a different file." },
      { status: 422 }
    );
  }

  let roastData: Awaited<ReturnType<typeof roastProfileFromText>>;
  try {
    roastData = await roastProfileFromText(profileText, level, profileName);
  } catch (err) {
    if (err instanceof NotLinkedInError) {
      return NextResponse.json(
        { error: "This doesn't look like a LinkedIn profile PDF." },
        { status: 422 }
      );
    }
    console.error("[roast/pdf] error:", err);
    return NextResponse.json(
      { error: "Roast generation failed. Please try again." },
      { status: 500 }
    );
  }

  const roastId = crypto.randomUUID();
  const fullData = { ...roastData, roastId, level, source: "pdf" as const, createdAt: Date.now() };

  try {
    await saveRoast(fullData);
  } catch (err) {
    console.error("[roast/pdf] store error:", err);
  }

  const responseHeaders: Record<string, string> = {};
  if (rateLimitRemaining !== null) {
    responseHeaders["X-RateLimit-Remaining"] = String(rateLimitRemaining);
  }

  return NextResponse.json({ roastId, ...roastData }, { headers: responseHeaders });
}
