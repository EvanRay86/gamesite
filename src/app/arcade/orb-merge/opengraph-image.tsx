import { ImageResponse } from "next/og";

export const alt = "Orb Merge — Drop, match, and merge glowing orbs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  // Orb definitions matching the game tiers
  const orbs = [
    { x: 180, y: 340, r: 52, color: "#a855f7", glow: "rgba(168,85,247,0.5)" },
    { x: 330, y: 280, r: 42, color: "#0abde3", glow: "rgba(10,189,227,0.5)" },
    { x: 500, y: 370, r: 64, color: "#ff6b9d", glow: "rgba(255,107,157,0.5)" },
    { x: 700, y: 300, r: 34, color: "#feca57", glow: "rgba(254,202,87,0.5)" },
    { x: 850, y: 360, r: 26, color: "#48dbfb", glow: "rgba(72,219,251,0.5)" },
    { x: 1000, y: 320, r: 20, color: "#ff9f43", glow: "rgba(255,159,67,0.5)" },
    { x: 420, y: 450, r: 14, color: "#ff6b6b", glow: "rgba(255,107,107,0.5)" },
    { x: 600, y: 200, r: 78, color: "#00d2d3", glow: "rgba(0,210,211,0.5)" },
    { x: 900, y: 450, r: 34, color: "#feca57", glow: "rgba(254,202,87,0.5)" },
    { x: 150, y: 480, r: 20, color: "#ff9f43", glow: "rgba(255,159,67,0.5)" },
  ];

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
          background: "linear-gradient(180deg, #080515 0%, #0f0a1e 50%, #1a1035 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background orbs with glow */}
        {orbs.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x - orb.r,
              top: orb.y - orb.r,
              width: orb.r * 2,
              height: orb.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${orb.color}, ${orb.color}aa 60%, ${orb.color}44 100%)`,
              boxShadow: `0 0 ${orb.r}px ${orb.glow}, 0 0 ${orb.r * 2}px ${orb.glow}`,
              opacity: 0.7,
              display: "flex",
            }}
          />
        ))}

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -2,
              textShadow: "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.25)",
            }}
          >
            Orb Merge
          </span>
          <span
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              textShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            Drop, match, and merge your way to the top tier
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#a855f7",
              letterSpacing: 4,
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            gamesite.app
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
