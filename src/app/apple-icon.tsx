import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "#FF6B6B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 156,
            height: 156,
            borderRadius: 26,
            background: "#FF8E8E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 100,
              fontWeight: 800,
              color: "white",
              lineHeight: 1,
              fontFamily: "Georgia, serif",
            }}
          >
            G
          </span>
          {/* Point value like a Scrabble tile */}
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 14,
              fontSize: 28,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Georgia, serif",
            }}
          >
            2
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
