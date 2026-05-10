import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getRoast } from "@/lib/roastStore";

function HomepageOGImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(140deg, #1A1208 0%, #0A0603 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#78716C", marginBottom: 16 }}>
          🔥 roastmylinkedin.venkyverse.space
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, fontWeight: 900, color: "#F5F0E8", lineHeight: 1.1, marginBottom: 24 }}>
          <span>Is your LinkedIn</span>
          <span style={{ color: "#F97316" }}>&nbsp;cooked?</span>
        </div>
        <span style={{ fontSize: 28, color: "#A8A29E", lineHeight: 1.5, marginBottom: 40 }}>
          Upload your profile screenshot. Get brutally roasted by AI.
        </span>
        <div style={{ display: "flex", gap: "16px" }}>
          {["Thought Leader Cosplay", "Buzzword Salad", "Genuine Professional"].map((label) => (
            <span
              key={label}
              style={{
                background: "#1C1108",
                border: "1px solid #44403C",
                color: "#A8A29E",
                padding: "8px 18px",
                borderRadius: 100,
                fontSize: 17,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ color: "#44403C", fontSize: 18 }}>venkyverse.space</span>
      </div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  try {
    const roastId = req.nextUrl.searchParams.get("roastId");

    if (!roastId) {
      const response = new ImageResponse(<HomepageOGImage />, { width: 1200, height: 630 });
      response.headers.set("Cache-Control", "public, max-age=86400");
      return response;
    }

    const roast = await getRoast(roastId);
    if (!roast) {
      return new Response("Roast not found", { status: 404 });
    }

    const { profileName: rawName, roastScore, category, verdict, roastPoints } = roast;
    const profileName = rawName || "";
    const shortVerdict =
      verdict.length > 160 ? verdict.slice(0, 157) + "..." : verdict;

    const response = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(140deg, #1A1208 0%, #0A0603 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "56px 64px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Top row: score + branding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* Score */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 112,
                  fontWeight: 700,
                  color: "#F97316",
                  lineHeight: 1,
                }}
              >
                {roastScore}
              </span>
              <span style={{ fontSize: 22, color: "#78716C", marginTop: 4 }}>
                /100 roasted
              </span>
            </div>

            {/* App name + category */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#F5F0E8",
                  letterSpacing: "-0.5px",
                }}
              >
                🔥 Roast My LinkedIn
              </span>
              <span
                style={{
                  background: "#F97316",
                  color: "white",
                  padding: "6px 20px",
                  borderRadius: 100,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {category}
              </span>
            </div>
          </div>

          {/* Name headline */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 28,
              fontSize: 40,
              fontWeight: 700,
              color: "#F5F0E8",
              lineHeight: 1.2,
            }}
          >
            <span>{profileName ? `${profileName}, you're` : "You're"}&nbsp;</span>
            <span style={{ color: "#F97316" }}>cooked.</span>
          </div>

          {/* Verdict */}
          <div
            style={{
              display: "flex",
              marginTop: 24,
              borderLeft: "4px solid #F97316",
              paddingLeft: 20,
              fontSize: 22,
              color: "#D6D3D1",
              lineHeight: 1.5,
            }}
          >
            <span>&quot;{shortVerdict}&quot;</span>
          </div>

          {/* Top 3 roast points */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: 28,
              flex: 1,
            }}
          >
            {roastPoints.slice(0, 3).map((point, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
              >
                <span style={{ fontSize: 18 }}>🔥</span>
                <span
                  style={{
                    color: "#A8A29E",
                    fontSize: 18,
                    lineHeight: 1.4,
                  }}
                >
                  {point.length > 110 ? point.slice(0, 107) + "..." : point}
                </span>
              </div>
            ))}
          </div>

          {/* Watermark */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ color: "#44403C", fontSize: 18 }}>
              venkyverse.space
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return response;
  } catch (err) {
    console.error("[og] render error:", err);
    return new Response("Failed to generate image.", { status: 500 });
  }
}
