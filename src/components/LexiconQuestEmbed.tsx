"use client";

import { useRef, useEffect } from "react";

export default function LexiconQuestEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Cache-busting: filenames have no content hash, so add build version
    const buildVer = "20260415m";

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
      id="root"
      ref={containerRef}
      className="w-full max-w-[800px] mx-auto overflow-hidden"
      style={{ aspectRatio: "4/3" }}
    />
  );
}
