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
          borderRadius: 40,
          background: "linear-gradient(135deg, #FF6B6B 0%, #F7B731 50%, #4ECDC4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: "white",
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size },
  );
}
