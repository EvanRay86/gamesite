import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const colorMap: Record<string, { bg: string; accent: string; light: string }> = {
  coral:  { bg: "#FF6B6B", accent: "#FF8E8E", light: "#FFF0F0" },
  teal:   { bg: "#4ECDC4", accent: "#7EDBD4", light: "#EDFAF8" },
  sky:    { bg: "#45B7D1", accent: "#72C9DD", light: "#EBF6FA" },
  amber:  { bg: "#F7B731", accent: "#F9CA60", light: "#FFF8E8" },
  purple: { bg: "#A855F7", accent: "#BE7FFA", light: "#F5EEFE" },
  green:  { bg: "#22C55E", accent: "#4ED47B", light: "#EDFCF2" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Gamesite";
  const description = searchParams.get("description") ?? "";
  const color = searchParams.get("color") ?? "coral";
  const { bg, accent, light } = colorMap[color] ?? colorMap.coral;

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
          background: `linear-gradient(135deg, ${light} 0%, #ffffff 50%, ${light} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
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
            background: `linear-gradient(90deg, ${bg}, ${accent})`,
            display: "flex",
          }}
        />

        {/* Decorative corner shapes */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: 100,
            background: bg,
            opacity: 0.08,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            background: bg,
            opacity: 0.06,
            display: "flex",
          }}
        />

        {/* Game tile icon */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${bg}, ${accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: `0 8px 30px ${bg}44`,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              lineHeight: 1,
              fontFamily: "Georgia, serif",
            }}
          >
            g.
          </span>
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: 68,
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
              fontSize: 26,
              color: "#6a6a7a",
              fontWeight: 500,
              maxWidth: 700,
              textAlign: "center",
              lineHeight: 1.4,
              marginTop: 16,
            }}
          >
            {description}
          </span>
        )}

        {/* Bottom bar with branding */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: bg,
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
