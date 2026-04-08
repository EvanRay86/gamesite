"use client";

import { useRef, useEffect, useState, useMemo } from "react";
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
  const [rawCountries, setRawCountries] = useState<GeoFeature[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Fetch GeoJSON country data
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        setRawCountries(
          data.features.filter(
            (f: GeoFeature) => f.properties.ISO_A2 !== "AQ",
          ),
        );
      })
      .catch((err) => console.error("Failed to fetch GeoJSON:", err));
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

  // Stamp each feature with computed color + altitude so react-globe.gl
  // sees new object references and re-renders when guesses change.
  const polygonsData = useMemo(() => {
    if (rawCountries.length === 0) return [];
    return rawCountries.map((feat: GeoFeature) => {
      const iso = feat.properties.ISO_A2;
      const info = guessMap.get(iso);

      let capColor: string;
      let sideColor: string;
      let altitude: number;

      if (!info) {
        capColor = "#556b5e";        // unguessed: visible gray-green land
        sideColor = "rgba(60,80,70,0.5)";
        altitude = 0.01;
      } else if (info.isTarget && won) {
        capColor = "#22c55e";        // correct: bright green
        sideColor = "rgba(34,197,94,0.8)";
        altitude = 0.05;
      } else {
        capColor = proximityColor(info.pct);
        sideColor = proximityColor(info.pct) + "cc";
        altitude = 0.03;
      }

      return {
        ...feat,
        _capColor: capColor,
        _sideColor: sideColor,
        _altitude: altitude,
      };
    });
  }, [rawCountries, guessMap, won]);

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

  // Set globe material color after mount (dark ocean blue)
  useEffect(() => {
    if (globeRef.current) {
      const globe = globeRef.current;
      // Use the three-globe API to set globe material
      try {
        const material = globe.globeMaterial();
        if (material) {
          material.color.set("#0a1628");
          material.emissive.set("#0a2040");
          material.emissiveIntensity = 0.1;
        }
      } catch {
        // fallback: ignore if API unavailable
      }
    }
  }, [rawCountries.length]); // run once globe + data loaded

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
          backgroundColor="rgba(0,0,0,0)"
          showGlobe={true}
          showAtmosphere={true}
          atmosphereColor="#4da6ff"
          atmosphereAltitude={0.15}
          polygonsData={polygonsData}
          polygonCapColor={(d: GeoFeature) => d._capColor}
          polygonSideColor={(d: GeoFeature) => d._sideColor}
          polygonStrokeColor={() => "#333"}
          polygonAltitude={(d: GeoFeature) => d._altitude}
          polygonsTransitionDuration={300}
          animateIn={true}
          enablePointerInteraction={false}
        />
      )}
    </div>
  );
}
