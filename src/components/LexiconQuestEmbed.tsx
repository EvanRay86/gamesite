"use client";

import { useRef, useEffect, useState } from "react";

// Wordslay's React UI is designed against a fixed 800×600 "design" canvas
// (button widths, rack padding, HUD offsets all assume that size). On a
// desktop browser the embed is already 800 wide so everything renders at
// native scale. On narrow viewports (e.g. iPhone 14 @ 390px wide) the UI
// would otherwise overflow — buttons clip, the rack panel pushes past the
// edge, etc. Rather than rewriting every measurement responsively, we wrap
// the game in an outer viewport-responsive frame and keep an inner element
// fixed at 800×600, CSS-scaling the inner to fit the outer. At ≥800px outer
// width the scale is 1 (bit-identical to before the wrapper existed); below
// that we shrink the whole game uniformly. Touch input works unchanged
// because the browser translates pointer coordinates through CSS transforms.

const DESIGN_WIDTH = 800;
const DESIGN_HEIGHT = 600;

export default function LexiconQuestEmbed() {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const [scale, setScale] = useState(1);

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

  // Observe the outer frame's rendered width and scale the inner design
  // surface down to fit. Capped at 1 so desktop stays untouched.
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const update = () => {
      const w = outer.getBoundingClientRect().width;
      if (w <= 0) return;
      setScale(Math.min(1, w / DESIGN_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="w-full max-w-[800px] mx-auto overflow-hidden"
      style={{ aspectRatio: `${DESIGN_WIDTH}/${DESIGN_HEIGHT}` }}
    >
      <div
        id="root"
        ref={containerRef}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
