import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Sky token (matches the game's registry color).
const BG = "#45B7D1";
const ACCENT = "#72C9DD";
const LIGHT = "#EBF6FA";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = (searchParams.get("name") ?? "Someone").slice(0, 20);
  const scoreRaw = parseInt(searchParams.get("score") ?? "0", 10);
  const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(9999, scoreRaw)) : 0;

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
          background: `linear-gradient(135deg, ${LIGHT} 0%, #ffffff 50%, ${LIGHT} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: `linear-gradient(90deg, ${BG}, ${ACCENT})`,
            display: "flex",
          }}
        />

        {/* Decorative shapes */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            background: BG,
            opacity: 0.08,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            background: BG,
            opacity: 0.06,
            display: "flex",
          }}
        />

        {/* Wordmark */}
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: BG,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Outrank
        </span>

        {/* Challenge line */}
        <span
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#6a6a7a",
            textAlign: "center",
          }}
        >
          {name} got a streak of
        </span>

        {/* Big score */}
        <span
          style={{
            fontSize: 200,
            fontWeight: 800,
            color: "#1a1a2e",
            lineHeight: 1,
            letterSpacing: -4,
            margin: "8px 0",
          }}
        >
          {score}
        </span>

        {/* Call to action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${BG}, ${ACCENT})`,
            color: "white",
            fontSize: 40,
            fontWeight: 800,
            padding: "16px 44px",
            borderRadius: 999,
            marginTop: 12,
            boxShadow: `0 8px 30px ${BG}55`,
          }}
        >
          Can you beat it?
        </div>

        {/* Bottom brand bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "white",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            gamesite.app
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
