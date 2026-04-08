"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GlobleCountry } from "@/data/globle-countries";
import { proximityColor, proximityPct } from "@/data/globle-countries";

// Dynamically import react-globe.gl (Three.js can't run server-side)
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Serve from same origin to avoid cross-origin blocks (iOS privacy protections)
const GEOJSON_URL = "/data/countries.geojson";

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

// Fix countries that have -99 as ISO_A2 in Natural Earth data.
// Map ADM0_A3 (3-letter) → correct ISO_A2 (2-letter).
const ISO_FIXES: Record<string, string> = {
  FRA: "FR", // France
  NOR: "NO", // Norway
  SOL: "SO", // Somaliland → Somalia
  CYN: "CY", // N. Cyprus → Cyprus
  KOS: "XK", // Kosovo
};

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

  // Fetch GeoJSON country data and fix broken ISO codes
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        const features = data.features
          .filter((f: GeoFeature) => f.properties.ISO_A2 !== "AQ")
          .map((f: GeoFeature) => {
            const iso = f.properties.ISO_A2;
            if (iso === "-99" || !iso || iso.length !== 2) {
              const adm = f.properties.ADM0_A3;
              const fix = ISO_FIXES[adm];
              if (fix) {
                return {
                  ...f,
                  properties: { ...f.properties, ISO_A2: fix },
                };
              }
            }
            return f;
          });
        setRawCountries(features);
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

  // Point markers for small countries missing from the 110m GeoJSON
  // (tiny islands, city-states like Maldives, Malta, Singapore, etc.)
  const pointsData = useMemo(() => {
    if (rawCountries.length === 0) return [];
    const geoIsos = new Set(
      rawCountries.map((f: GeoFeature) => f.properties.ISO_A2),
    );
    return guesses
      .filter((g) => !geoIsos.has(g.country.code.toUpperCase()))
      .map((g) => {
        const pct = proximityPct(g.distance);
        const isTarget = g.country.code === target.code;
        return {
          lat: g.country.lat,
          lng: g.country.lng,
          _color: isTarget && won ? "#22c55e" : proximityColor(pct),
          _radius: isTarget && won ? 0.8 : 0.5,
          _altitude: 0.05,
        };
      });
  }, [rawCountries, guesses, target, won]);

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
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-water.png"
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
          pointsData={pointsData}
          pointColor={(d: GeoFeature) => d._color}
          pointRadius={(d: GeoFeature) => d._radius}
          pointAltitude={(d: GeoFeature) => d._altitude}
          animateIn={true}
          enablePointerInteraction={false}
        />
      )}
    </div>
  );
}
