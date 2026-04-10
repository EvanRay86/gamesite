"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  decodeAndAnalyze,
  extractSoundCloudWaveform,
  smoothAmplitudes,
  detectBeats,
  type WaveRiderAudioData,
} from "@/lib/wave-rider/audio-analysis";
import {
  generateTerrainPoints,
  getWorldWidth,
  placeObstacles,
  placeCollectibles,
  type TerrainPoint,
  type Obstacle,
  type Collectible,
} from "@/lib/wave-rider/terrain";

// ── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

type GameScreen = "menu" | "analyzing" | "playing" | "paused" | "gameover";

// SoundCloud Widget API types
interface SCWidget {
  bind(event: string, callback: (...args: unknown[]) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  getDuration(callback: (dur: number) => void): void;
}

interface SCWidgetStatic {
  (iframe: HTMLIFrameElement): SCWidget;
  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    PLAY_PROGRESS: string;
    FINISH: string;
  };
}

// Window.SC is already declared globally in HeardleGame.tsx

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 400;
const GRAVITY = 0.38;
const JUMP_FORCE = -9.5;
const PLAYER_SIZE = 12;
const MAX_LIVES = 5;
const INVINCIBLE_FRAMES = 120;
const SAVE_KEY = "wave-rider-best";
const HIT_SHRINK = 4; // pixels to shrink collision box (forgiving hitbox)

// Synthwave palette
const BG_TOP = "#0a0a2e";
const BG_BOT = "#1a1a4e";
const NEON_CYAN = "#00f5d4";
const NEON_PINK = "#ff006e";
const NEON_PURPLE = "#9b5de5";
const NEON_AMBER = "#f7b731";
const NEON_RED = "#ff4444";

const SC_WIDGET_API = "https://w.soundcloud.com/player/api.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Get terrain height at a given world-X by interpolating between points. */
function getTerrainHeightAt(terrain: TerrainPoint[], worldX: number): number {
  if (terrain.length === 0) return CANVAS_H * 0.7;
  const segW = terrain.length > 1 ? terrain[1].x - terrain[0].x : 6;
  const idx = worldX / segW;
  const i = Math.floor(idx);
  const t = idx - i;
  const a = terrain[clamp(i, 0, terrain.length - 1)];
  const b = terrain[clamp(i + 1, 0, terrain.length - 1)];
  return a.height * (1 - t) + b.height * t;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WaveRider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scUrl, setScUrl] = useState("");
  const [songName, setSongName] = useState("");

  // Refs for game loop (avoid re-renders in hot path)
  const screenRef = useRef(screen);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const animRef = useRef(0);
  const frameRef = useRef(0);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioStartTimeRef = useRef(0);
  const scWidgetRef = useRef<SCWidget | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement>(null);
  const scProgressRef = useRef(0); // 0-1 progress from SC widget
  const scDurationRef = useRef(0);
  const usingScRef = useRef(false);

  // Game world refs
  const terrainRef = useRef<TerrainPoint[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const worldWidthRef = useRef(0);
  const audioDataRef = useRef<WaveRiderAudioData | null>(null);

  // Player refs
  const playerRef = useRef({ x: 150, y: 200, vy: 0, isJumping: false });
  const invincibleRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const comboRef = useRef(0);

  // Load best
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // ── SoundCloud widget setup ──────────────────────────────────────────────

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector(`script[src="${SC_WIDGET_API}"]`)) return;
    const script = document.createElement("script");
    script.src = SC_WIDGET_API;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const initScWidget = useCallback(() => {
    const iframe = scIframeRef.current;
    if (!iframe || !window.SC?.Widget) return;

    const widget = window.SC.Widget(iframe);
    scWidgetRef.current = widget;

    widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, ((...args: unknown[]) => {
      const data = args[0] as { currentPosition: number; relativePosition: number };
      scProgressRef.current = data.relativePosition;
    }));

    widget.bind(window.SC.Widget.Events.READY, () => {
      widget.getDuration((dur: number) => {
        scDurationRef.current = dur / 1000;
      });
    });

    widget.bind(window.SC.Widget.Events.FINISH, () => {
      if (screenRef.current === "playing") {
        endGame();
      }
    });
  }, []);

  // ── Audio playback helpers ───────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    try { sourceNodeRef.current?.stop(); } catch { /* ignore */ }
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    sourceNodeRef.current = null;
    audioCtxRef.current = null;
    try { scWidgetRef.current?.pause(); } catch { /* ignore */ }
  }, []);

  const playFileAudio = useCallback(() => {
    if (!audioBufferRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    source.start();
    audioStartTimeRef.current = ctx.currentTime;
    sourceNodeRef.current = source;
    source.onended = () => {
      if (screenRef.current === "playing") {
        // Inline stop to avoid calling stopAudio on already-ended source
        try { audioCtxRef.current?.close(); } catch { /* ignore */ }
        sourceNodeRef.current = null;
        audioCtxRef.current = null;
        const final = scoreRef.current;
        const best = parseInt(localStorage.getItem(SAVE_KEY) || "0", 10);
        if (final > best) {
          localStorage.setItem(SAVE_KEY, String(final));
        }
        setScore(final);
        setBestScore(Math.max(final, best));
        setScreen("gameover");
      }
    };
  }, []);

  const getProgress = useCallback((): number => {
    if (usingScRef.current) {
      return scProgressRef.current;
    }
    if (audioCtxRef.current && audioDataRef.current) {
      const elapsed = audioCtxRef.current.currentTime - audioStartTimeRef.current;
      return clamp(elapsed / audioDataRef.current.duration, 0, 1);
    }
    return 0;
  }, []);

  // ── Analyze + Start ──────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    setScreen("analyzing");
    setErrorMsg("");
    setAnalyzeProgress("Decoding audio...");
    setSongName(file.name.replace(/\.[^.]+$/, ""));

    try {
      const data = await decodeAndAnalyze(file);

      // Keep the audio buffer for playback (returned by decodeAndAnalyze)
      audioBufferRef.current = data.audioBuffer ?? null;

      setAnalyzeProgress("Generating terrain...");
      usingScRef.current = false;
      audioDataRef.current = data;

      const terrain = generateTerrainPoints(data, CANVAS_H);
      terrainRef.current = terrain;
      obstaclesRef.current = placeObstacles(terrain);
      collectiblesRef.current = placeCollectibles(terrain);
      worldWidthRef.current = getWorldWidth(data.amplitudes.length);

      startGame();
    } catch (err) {
      setErrorMsg("Could not decode audio file. Try a different MP3 or WAV.");
      setScreen("menu");
      console.error(err);
    }
  }, []);

  const handleSoundCloudUrl = useCallback(async (url: string) => {
    if (!url.includes("soundcloud.com/")) {
      setErrorMsg("Please enter a valid SoundCloud URL.");
      return;
    }
    setScreen("analyzing");
    setErrorMsg("");
    setAnalyzeProgress("Fetching track info...");

    try {
      // Use oEmbed to get track info
      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
      const resp = await fetch(oembedUrl);
      if (!resp.ok) throw new Error("Could not fetch track info");
      const data = await resp.json();
      setSongName(data.title || "SoundCloud Track");

      // Try to extract waveform from the embed HTML
      // The thumbnail URL often contains the track artwork hash
      setAnalyzeProgress("Extracting waveform...");

      // Try fetching the waveform PNG via the track page
      // SoundCloud waveforms are at https://wave.sndcdn.com/HASH.png
      // We'll try to get it from the thumbnail or generate synthetic data
      let amplitudes: number[];

      try {
        // Extract the track path from the thumbnail URL or html
        const htmlStr = data.html as string;
        const trackMatch = htmlStr.match(/tracks%2F(\d+)/);
        if (trackMatch) {
          // Try the waveform endpoint
          const waveResp = await fetch(
            `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(url)}&format=json`
          );
          if (waveResp.ok) {
            const trackData = await waveResp.json();
            if (trackData.waveform_url) {
              amplitudes = await extractSoundCloudWaveform(
                trackData.waveform_url.replace(".json", ".png")
              );
            } else {
              throw new Error("No waveform URL");
            }
          } else {
            throw new Error("Could not resolve track");
          }
        } else {
          throw new Error("Could not extract track ID");
        }
      } catch {
        // Fallback: generate synthetic waveform from duration
        setAnalyzeProgress("Generating waveform from audio properties...");
        const duration = data.duration ? data.duration / 1000 : 180;
        const sampleCount = Math.floor(duration / 0.05);
        amplitudes = [];
        for (let i = 0; i < sampleCount; i++) {
          const t = i / sampleCount;
          // Generate a musically-plausible waveform with beats
          const base = 0.3 + 0.2 * Math.sin(t * Math.PI);
          const beat = Math.abs(Math.sin(t * Math.PI * 32)) * 0.3;
          const variation = Math.sin(t * Math.PI * 7) * 0.15;
          amplitudes.push(clamp(base + beat + variation + Math.random() * 0.1, 0, 1));
        }
        amplitudes = smoothAmplitudes(amplitudes, 3);
      }

      const beats = detectBeats(amplitudes, 1.4);
      const audioData: WaveRiderAudioData = {
        amplitudes,
        beats,
        duration: (data.duration || 180000) / 1000,
        source: "soundcloud",
      };

      usingScRef.current = true;
      audioDataRef.current = audioData;

      const terrain = generateTerrainPoints(audioData, CANVAS_H);
      terrainRef.current = terrain;
      obstaclesRef.current = placeObstacles(terrain);
      collectiblesRef.current = placeCollectibles(terrain);
      worldWidthRef.current = getWorldWidth(audioData.amplitudes.length);

      // Set iframe src to load the track
      if (scIframeRef.current) {
        const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&buying=false&liking=false&download=false&sharing=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false&hide_related=true&visual=false&start_track=0`;
        scIframeRef.current.src = embedUrl;
        // Wait for widget to be ready
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (window.SC?.Widget) {
              clearInterval(check);
              initScWidget();
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            resolve();
          }, 5000);
        });
      }

      startGame();
    } catch (err) {
      setErrorMsg("Could not load SoundCloud track. Check the URL and try again.");
      setScreen("menu");
      console.error(err);
    }
  }, [initScWidget]);

  // ── Game lifecycle ─────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    comboRef.current = 0;
    invincibleRef.current = 0;
    frameRef.current = 0;
    particlesRef.current = [];
    // Snap player to terrain height at start position
    const startTerrainY = getTerrainHeightAt(terrainRef.current, 150);
    playerRef.current = { x: 150, y: startTerrainY - PLAYER_SIZE, vy: 0, isJumping: false };

    // Reset obstacles/collectibles
    for (const o of obstaclesRef.current) o.hit = false;
    for (const c of collectiblesRef.current) c.collected = false;

    setScore(0);
    setLives(MAX_LIVES);
    setScreen("playing");

    // Start audio
    if (usingScRef.current) {
      setTimeout(() => scWidgetRef.current?.play(), 300);
    } else {
      playFileAudio();
    }
  }, [playFileAudio]);

  const endGame = useCallback(() => {
    stopAudio();
    const final = scoreRef.current;
    setScore(final);
    if (final > bestScore) {
      setBestScore(final);
      localStorage.setItem(SAVE_KEY, String(final));
    }
    setScreen("gameover");
  }, [bestScore, stopAudio]);

  // ── Input ──────────────────────────────────────────────────────────────────

  const jumpRef = useRef(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jumpRef.current = true;
      }
      if (e.code === "Escape" && screenRef.current === "playing") {
        stopAudio();
        setScreen("gameover");
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        jumpRef.current = false;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [stopAudio]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      jumpRef.current = true;
      setTimeout(() => { jumpRef.current = false; }, 200);
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouch);
  }, []);

  // ── Particle helper ────────────────────────────────────────────────────────

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = 0.5 + Math.random() * speed;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          life: 20 + Math.random() * 25,
          maxLife: 45,
          color,
          size: 1.5 + Math.random() * 3,
        });
      }
      // Cap particles
      if (particlesRef.current.length > 150) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
    }, []
  );

  // ── Game loop ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      if (screenRef.current !== "playing") return;
      frameRef.current++;

      // ── Progress & scroll ──
      const progress = getProgress();
      const worldW = worldWidthRef.current;
      const scrollX = progress * worldW;
      const terrain = terrainRef.current;
      const player = playerRef.current;

      // ── Player physics ──
      const terrainY = getTerrainHeightAt(terrain, scrollX + player.x);
      const landingY = terrainY - PLAYER_SIZE;

      if (jumpRef.current && !player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
      }

      if (player.isJumping) {
        // In air — apply gravity
        player.vy += GRAVITY;
        player.y += player.vy;

        // Land on terrain
        if (player.y >= landingY) {
          player.y = landingY;
          player.vy = 0;
          player.isJumping = false;
        }
      } else {
        // On terrain — smoothly follow the surface (lerp to avoid jarring snaps)
        const diff = landingY - player.y;
        if (Math.abs(diff) < 2) {
          player.y = landingY;
        } else {
          player.y += diff * 0.3;
        }
        player.vy = 0;
      }

      // Clamp to canvas
      player.y = clamp(player.y, 10, CANVAS_H - PLAYER_SIZE);

      // Invincibility countdown
      if (invincibleRef.current > 0) invincibleRef.current--;

      // ── Collision detection ──
      const playerWorldX = scrollX + player.x;
      const playerRect = {
        x: playerWorldX - PLAYER_SIZE / 2,
        y: player.y - PLAYER_SIZE / 2,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE,
      };

      // Obstacles — forgiving hitbox (shrunk by HIT_SHRINK on each side)
      for (const obs of obstaclesRef.current) {
        if (obs.hit) continue;
        const hs = HIT_SHRINK;
        if (
          obs.x + hs < playerWorldX + PLAYER_SIZE - hs &&
          obs.x + obs.width - hs > playerWorldX - PLAYER_SIZE + hs &&
          obs.y + hs < player.y + PLAYER_SIZE - hs &&
          obs.y + obs.height - hs > player.y - PLAYER_SIZE + hs
        ) {
          if (invincibleRef.current <= 0) {
            obs.hit = true;
            livesRef.current--;
            comboRef.current = 0;
            invincibleRef.current = INVINCIBLE_FRAMES;
            setLives(livesRef.current);
            spawnParticles(player.x, player.y, NEON_RED, 12, 4);
            if (livesRef.current <= 0) {
              endGame();
              return;
            }
          }
        }
      }

      // Collectibles
      for (const col of collectiblesRef.current) {
        if (col.collected) continue;
        const dx = col.x - playerWorldX;
        const dy = col.y - player.y;
        if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
          col.collected = true;
          comboRef.current++;
          const multiplier = 1 + Math.floor(comboRef.current / 5) * 0.5;
          scoreRef.current += Math.round(10 * multiplier);
          setScore(scoreRef.current);
          spawnParticles(
            col.x - scrollX,
            col.y,
            NEON_AMBER,
            8,
            2
          );
        }
      }

      // Time-based score
      if (frameRef.current % 60 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Player trail particles
      if (frameRef.current % 3 === 0) {
        particlesRef.current.push({
          x: player.x - 5 + Math.random() * 4,
          y: player.y + PLAYER_SIZE / 2 + Math.random() * 4,
          vx: -1 - Math.random(),
          vy: -0.5 + Math.random(),
          life: 15 + Math.random() * 10,
          maxLife: 25,
          color: NEON_CYAN,
          size: 1 + Math.random() * 2,
        });
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
      });

      // ── Render ──

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, BG_TOP);
      bgGrad.addColorStop(1, BG_BOT);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines (synthwave floor effect)
      ctx.strokeStyle = "rgba(155, 93, 229, 0.12)";
      ctx.lineWidth = 1;
      for (let gy = CANVAS_H * 0.4; gy < CANVAS_H; gy += 30) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }
      // Vertical grid lines (parallax)
      const gridOffset = (scrollX * 0.3) % 60;
      for (let gx = -gridOffset; gx < CANVAS_W + 60; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, CANVAS_H * 0.4);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }

      // Terrain
      ctx.save();
      ctx.beginPath();
      const viewStart = Math.max(0, Math.floor(scrollX / 6) - 2);
      const viewEnd = Math.min(terrain.length - 1, viewStart + Math.ceil(CANVAS_W / 6) + 4);

      if (terrain.length > 0) {
        ctx.moveTo(terrain[viewStart].x - scrollX, CANVAS_H);
        for (let i = viewStart; i <= viewEnd; i++) {
          ctx.lineTo(terrain[i].x - scrollX, terrain[i].height);
        }
        ctx.lineTo(terrain[viewEnd].x - scrollX, CANVAS_H);
        ctx.closePath();

        // Gradient fill
        const terrGrad = ctx.createLinearGradient(0, CANVAS_H * 0.2, 0, CANVAS_H);
        terrGrad.addColorStop(0, "rgba(0, 245, 212, 0.6)");
        terrGrad.addColorStop(0.5, "rgba(155, 93, 229, 0.4)");
        terrGrad.addColorStop(1, "rgba(155, 93, 229, 0.1)");
        ctx.fillStyle = terrGrad;
        ctx.fill();

        // Glowing top edge
        ctx.beginPath();
        for (let i = viewStart; i <= viewEnd; i++) {
          const sx = terrain[i].x - scrollX;
          if (i === viewStart) ctx.moveTo(sx, terrain[i].height);
          else ctx.lineTo(sx, terrain[i].height);
        }
        ctx.shadowBlur = 12;
        ctx.shadowColor = NEON_CYAN;
        ctx.strokeStyle = NEON_CYAN;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Obstacles
      for (const obs of obstaclesRef.current) {
        const ox = obs.x - scrollX;
        if (ox < -30 || ox > CANVAS_W + 30) continue;
        if (obs.hit) continue;

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = NEON_RED;
        ctx.fillStyle = NEON_RED;

        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(ox + obs.width / 2, obs.y);
        ctx.lineTo(ox + obs.width, obs.y + obs.height / 2);
        ctx.lineTo(ox + obs.width / 2, obs.y + obs.height);
        ctx.lineTo(ox, obs.y + obs.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Collectibles
      for (const col of collectiblesRef.current) {
        const cx = col.x - scrollX;
        if (cx < -20 || cx > CANVAS_W + 20) continue;
        if (col.collected) continue;

        const pulse = 1 + Math.sin(frameRef.current * 0.08) * 0.2;
        ctx.save();
        ctx.shadowBlur = 10 * pulse;
        ctx.shadowColor = NEON_AMBER;
        ctx.fillStyle = NEON_AMBER;
        ctx.beginPath();
        ctx.arc(cx, col.y, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      for (const p of particlesRef.current) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player
      const blink = invincibleRef.current > 0 && frameRef.current % 6 < 3;
      if (!blink) {
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = NEON_PINK;
        ctx.fillStyle = NEON_PINK;
        ctx.beginPath();
        // Triangle surfer
        ctx.moveTo(player.x + PLAYER_SIZE, player.y);
        ctx.lineTo(player.x - PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2);
        ctx.lineTo(player.x - PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // HUD on canvas
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      // Lives as hearts
      ctx.textAlign = "right";
      ctx.fillStyle = NEON_PINK;
      for (let i = 0; i < livesRef.current; i++) {
        ctx.fillText("\u2665", CANVAS_W - 12 - i * 22, 28);
      }

      // Combo indicator
      if (comboRef.current >= 5) {
        ctx.textAlign = "center";
        ctx.fillStyle = NEON_AMBER;
        ctx.font = "bold 14px 'Outfit', sans-serif";
        ctx.fillText(`${comboRef.current}x combo`, CANVAS_W / 2, 28);
      }

      // Progress bar at bottom
      ctx.fillStyle = "rgba(0, 245, 212, 0.3)";
      ctx.fillRect(0, CANVAS_H - 3, CANVAS_W, 3);
      ctx.fillStyle = NEON_CYAN;
      ctx.fillRect(0, CANVAS_H - 3, CANVAS_W * progress, 3);

      // Song name
      if (songName) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "11px 'Outfit', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(songName, CANVAS_W - 12, CANVAS_H - 10);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen, getProgress, spawnParticles, endGame, songName]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  // ── Render JSX ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-body text-2xl sm:text-3xl font-bold text-text-primary">
              Wave Rider
            </h1>
            <p className="mt-1 text-text-muted text-sm">
              Upload a song or paste a SoundCloud link. Surf the waveform.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-text-dim uppercase tracking-wider">Best</div>
              <div className="text-xl font-bold text-purple">{bestScore}</div>
            </div>
            {screen === "playing" && (
              <>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Score</div>
                  <div className="text-xl font-bold text-text-primary">{score}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-dim uppercase tracking-wider">Lives</div>
                  <div className="text-xl font-bold text-coral">
                    {Array.from({ length: lives }).map((_, i) => (
                      <span key={i}>{"\u2665"}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SoundCloud hidden iframe */}
      <iframe
        ref={scIframeRef}
        className="hidden"
        width="100%"
        height="0"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
      />

      {/* Menu */}
      {screen === "menu" && (
        <div className="bg-white rounded-2xl border border-border-light p-8 mb-6 shadow-sm text-center space-y-6">
          {errorMsg && (
            <p className="text-coral text-sm font-medium">{errorMsg}</p>
          )}

          <div className="space-y-3">
            <h2 className="font-body text-lg font-semibold text-text-primary">
              Upload an Audio File
            </h2>
            <p className="text-sm text-text-muted">MP3, WAV, or OGG</p>
            <label className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 rounded-xl bg-purple text-white font-semibold hover:opacity-90 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose File
              <input
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-text-dim">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-body text-lg font-semibold text-text-primary">
              Paste a SoundCloud URL
            </h2>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={scUrl}
                onChange={(e) => setScUrl(e.target.value)}
                placeholder="https://soundcloud.com/artist/track"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scUrl.trim()) handleSoundCloudUrl(scUrl.trim());
                }}
              />
              <button
                onClick={() => scUrl.trim() && handleSoundCloudUrl(scUrl.trim())}
                className="px-5 py-2.5 rounded-xl bg-purple text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {screen === "analyzing" && (
        <div className="bg-white rounded-2xl border border-border-light p-8 mb-6 shadow-sm text-center space-y-4">
          <div className="inline-block w-10 h-10 border-4 border-purple/30 border-t-purple rounded-full animate-spin" />
          <p className="text-text-muted text-sm">{analyzeProgress}</p>
        </div>
      )}

      {/* Canvas */}
      {(screen === "playing" || screen === "gameover") && (
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-2xl border-2 border-border-light shadow-lg max-w-full"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, width: "100%", maxWidth: CANVAS_W }}
          />
        </div>
      )}

      {/* Game Over overlay */}
      {screen === "gameover" && (
        <div className="mt-6 bg-white rounded-2xl border border-border-light p-8 shadow-sm text-center space-y-4">
          <h2 className="font-body text-2xl font-bold text-text-primary">
            {livesRef.current <= 0 ? "Game Over" : "Song Complete!"}
          </h2>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-xs text-text-dim uppercase tracking-wider">Score</div>
              <div className="text-3xl font-bold text-purple">{score}</div>
            </div>
            <div>
              <div className="text-xs text-text-dim uppercase tracking-wider">Best</div>
              <div className="text-3xl font-bold text-amber">{bestScore}</div>
            </div>
          </div>
          {songName && (
            <p className="text-sm text-text-muted">{songName}</p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // Reset and replay same song
                if (audioDataRef.current) {
                  const data = audioDataRef.current;
                  const terrain = generateTerrainPoints(data, CANVAS_H);
                  terrainRef.current = terrain;
                  obstaclesRef.current = placeObstacles(terrain);
                  collectiblesRef.current = placeCollectibles(terrain);
                  startGame();
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-purple text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Replay
            </button>
            <button
              onClick={() => {
                stopAudio();
                setScreen("menu");
                setScUrl("");
                setSongName("");
                setErrorMsg("");
              }}
              className="px-6 py-2.5 rounded-xl border border-border-light text-text-primary font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              New Song
            </button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="mt-4 text-center text-xs text-text-dim">
        <span className="hidden sm:inline">Space or &uarr; to jump &bull; Dodge red obstacles &bull; Collect golden orbs &bull; Escape to quit</span>
        <span className="sm:hidden">Tap to jump &bull; Dodge obstacles &bull; Collect orbs</span>
      </div>
    </div>
  );
}
