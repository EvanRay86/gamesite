"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GlobleCountry } from "@/data/globle-countries";
import { proximityColor, proximityPct } from "@/data/globle-countries";

// Dynamically import react-globe.gl (Three.js can't run server-side)
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

interface GlobeGuess {
  country: GlobleCountry;
  distance: number;
}

interface GlobleGlobeProps {
  guesses: GlobeGuess[];
  target: GlobleCountry;
  won: boolean;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoFeature = any;

export default function GlobleGlobe({
  guesses,
  target,
  won,
  className,
}: GlobleGlobeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(undefined);
  const [countries, setCountries] = useState<GeoFeature[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Fetch GeoJSON country data
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        setCountries(
          data.features.filter(
            (f: GeoFeature) => f.properties.ISO_A2 !== "AQ",
          ),
        );
      })
      .catch(() => {});
  }, []);

  // Measure container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build lookup: ISO_A2 (uppercase) → guess info
  const guessMap = useMemo(() => {
    const m = new Map<string, { pct: number; isTarget: boolean }>();
    for (const g of guesses) {
      const code = g.country.code.toUpperCase();
      const pct = proximityPct(g.distance);
      const isTarget = g.country.code === target.code;
      m.set(code, { pct, isTarget });
    }
    return m;
  }, [guesses, target]);

  // Center globe on latest guess
  useEffect(() => {
    if (guesses.length > 0 && globeRef.current) {
      const last = guesses[guesses.length - 1].country;
      globeRef.current.pointOfView(
        { lat: last.lat, lng: last.lng, altitude: 1.8 },
        600,
      );
    }
  }, [guesses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polygon color based on guess proximity
  const getCapColor = useCallback(
    (feat: GeoFeature) => {
      const iso = feat.properties.ISO_A2;
      const info = guessMap.get(iso);
      if (!info) return "rgba(30, 50, 40, 0.6)"; // unguessed: dark muted
      if (info.isTarget && won) return "#22c55e"; // correct: green
      return proximityColor(info.pct);
    },
    [guessMap, won],
  );

  const getSideColor = useCallback(
    (feat: GeoFeature) => {
      const iso = feat.properties.ISO_A2;
      const info = guessMap.get(iso);
      if (!info) return "rgba(20, 40, 30, 0.3)";
      if (info.isTarget && won) return "rgba(34,197,94,0.6)";
      const base = proximityColor(info.pct);
      return base + "99"; // add alpha
    },
    [guessMap, won],
  );

  const getAltitude = useCallback(
    (feat: GeoFeature) => {
      const iso = feat.properties.ISO_A2;
      const info = guessMap.get(iso);
      if (!info) return 0.005;
      if (info.isTarget && won) return 0.04;
      return 0.015;
    },
    [guessMap, won],
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ width: "100%", height: "100%" }}
    >
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          polygonsData={countries}
          polygonCapColor={getCapColor}
          polygonSideColor={getSideColor}
          polygonStrokeColor={() => "#333"}
          polygonAltitude={getAltitude}
          polygonsTransitionDuration={400}
          atmosphereColor="#4da6ff"
          atmosphereAltitude={0.15}
          animateIn={true}
          enablePointerInteraction={false}
        />
      )}
    </div>
  );
}
