import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const colorMap: Record<string, { bg: string; accent: string }> = {
  coral: { bg: "#FF6B6B", accent: "#FF8E8E" },
  teal: { bg: "#4ECDC4", accent: "#7EDBD4" },
  sky: { bg: "#45B7D1", accent: "#72C9DD" },
  amber: { bg: "#F7B731", accent: "#F9CA60" },
  purple: { bg: "#A855F7", accent: "#BE7FFA" },
  green: { bg: "#22C55E", accent: "#4ED47B" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Gamesite";
  const description = searchParams.get("description") ?? "";
  const color = searchParams.get("color") ?? "coral";
  const { bg, accent } = colorMap[color] ?? colorMap.coral;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Colored accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: bg,
            display: "flex",
          }}
        />

        {/* Game tile icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 12,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "white",
                lineHeight: 1,
                fontFamily: "Georgia, serif",
              }}
            >
              G
            </span>
          </div>
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#1a1a2e",
            letterSpacing: -2,
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {title}
        </span>

        {/* Description */}
        {description && (
          <span
            style={{
              fontSize: 28,
              color: "#6a6a7a",
              fontWeight: 500,
              maxWidth: 750,
              textAlign: "center",
              lineHeight: 1.4,
              marginTop: 16,
            }}
          >
            {description}
          </span>
        )}

        {/* Site branding */}
        <span
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 22,
            fontWeight: 700,
            color: bg,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          gamesite.app
        </span>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
