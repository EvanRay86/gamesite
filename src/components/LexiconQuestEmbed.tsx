"use client";

import { useRef, useEffect } from "react";

// Wordslay's React UI is designed against a fixed 800×600 "design" canvas
// (button widths, rack padding, HUD offsets all assume that size). On a
// desktop browser the embed is already 800 wide so everything renders at
// native scale. On narrow viewports (e.g. iPhone 14 @ 390px wide) the UI
// would otherwise overflow. We wrap the game in an outer viewport-responsive
// frame, keep an inner element fixed at 800×600, and CSS-scale the inner
// uniformly so it matches the outer's rendered width — via container query
// units (cqw), so no JS / ResizeObserver and no first-paint flash on mobile.
// At ≥800px outer width the scale caps at 1 (desktop bit-identical). Touch
// input works unchanged because the browser translates pointer coordinates
// through the CSS transform.

const DESIGN_WIDTH = 800;
const DESIGN_HEIGHT = 600;

export default function LexiconQuestEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Cache-busting: filenames have no content hash, so add build version
    const buildVer = "20260417a";

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

  return (
    <div
      className="w-full max-w-[800px] mx-auto overflow-hidden"
      style={{
        aspectRatio: `${DESIGN_WIDTH}/${DESIGN_HEIGHT}`,
        containerType: "inline-size",
      }}
    >
      <div
        id="root"
        ref={containerRef}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(min(1, calc(100cqw / ${DESIGN_WIDTH}px)))`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
