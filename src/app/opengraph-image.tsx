import { ImageResponse } from "next/og";

export const alt = "gamesite.app — Daily puzzles, trivia, and arcade games";
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
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Scrabble tile */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 16,
              background: "#FF6B6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: 10,
                background: "#FF8E8E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                  fontFamily: "Georgia, serif",
                }}
              >
                G
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 8,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "Georgia, serif",
                }}
              >
                2
              </span>
            </div>
          </div>

          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 88,
                fontWeight: 800,
                color: "#1a1a2e",
                letterSpacing: -2,
              }}
            >
              gamesite
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#FF6B6B",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              .app
            </span>
          </div>
        </div>

        {/* Tagline */}
        <span
          style={{
            fontSize: 32,
            color: "#6a6a7a",
            fontWeight: 500,
            maxWidth: 750,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Daily puzzles, trivia, and arcade games — free in your browser.
        </span>
      </div>
    ),
    { ...size },
  );
}
