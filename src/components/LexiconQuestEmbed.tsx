"use client";

import { useRef, useEffect } from "react";

// Wordslay's React UI is designed against a fixed 800×600 "design" canvas.
// The game's own App.tsx scales itself via CSS container queries (100cqw/cqh)
// anchored to #root. The embed's only job is to provide that sized container:
// a responsive wrapper that preserves 4:3 and caps at 800px wide on desktop.
//
// IMPORTANT: do NOT add an extra transform: scale() here. The game's internal
// scaling already fits to #root. Adding a second scale caused double-shrinking
// on mobile (iPhone 14 rendered the game at ~190px inside 390px of viewport).

const DESIGN_WIDTH = 800;
const DESIGN_HEIGHT = 600;

export default function LexiconQuestEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Cache-busting: filenames have no content hash, so add build version
    const buildVer = "20260421a";

    // Load the CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/wordslay/assets/wordslay.css?v=${buildVer}`;
    document.head.appendChild(link);

    // Load the React+Phaser bundle — mounts to #root
    const script = document.createElement("script");
    script.type = "module";
    script.src = `/wordslay/assets/wordslay.js?v=${buildVer}`;
    document.body.appendChild(script);

    return () => {
      script.remove();
      link.remove();
    };
  }, []);

  // The wrapper sets size + container-type. #root is sized 100% of the wrapper
  // and declared as a query container (inherited from the game's own index.html
  // pattern); App.tsx's own 100cqw/cqh math takes it from there.
  return (
    <div
      className="w-full max-w-[800px] mx-auto"
      style={{
        aspectRatio: `${DESIGN_WIDTH}/${DESIGN_HEIGHT}`,
      }}
    >
      <div
        id="root"
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          containerType: "size",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
