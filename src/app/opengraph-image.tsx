import { ImageResponse } from "next/og";

export const alt = "Gamesite — Daily puzzles, trivia, and arcade games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background:
            "linear-gradient(135deg, #FF6B6B 0%, #F7B731 50%, #4ECDC4 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "white",
                lineHeight: 1,
              }}
            >
              G
            </span>
          </div>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              letterSpacing: -2,
            }}
          >
            Gamesite
          </span>
        </div>
        <span
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 500,
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          Daily puzzles, trivia, and arcade games — free in your browser.
        </span>
      </div>
    ),
    { ...size },
  );
}
