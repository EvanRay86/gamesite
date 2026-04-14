"use client";

import { useRef, useEffect } from "react";

export default function LexiconQuestEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Find the built Phaser bundle in /lexicon-quest/assets/
    // The bundle auto-mounts to #game-container on load
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/lexicon-quest/assets/index-gCIqgAa7.js";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div
      id="game-container"
      ref={containerRef}
      className="w-full max-w-[800px] mx-auto"
      style={{ aspectRatio: "4/3", imageRendering: "pixelated" }}
    />
  );
}
