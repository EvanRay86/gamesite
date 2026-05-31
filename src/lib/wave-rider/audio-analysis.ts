// ── Audio analysis for Wave Rider ────────────────────────────────────────────
// Turns audio into two things the game needs:
//   • amplitudes — a smooth 0-1 envelope used to draw the rolling terrain
//   • beats      — onset indices (energy spikes) where we drop obstacles
//
// Both uploaded files and tracks pulled through the audio proxy are decoded with
// Web Audio for true PCM analysis (see decodeAndAnalyzeBuffer).

export interface WaveRiderAudioData {
  amplitudes: number[]; // normalized 0-1, one per time-window (terrain envelope)
  beats: number[];      // indices into amplitudes where beats land
  duration: number;     // seconds
  audioBuffer?: AudioBuffer; // decoded PCM, for Web Audio playback
}

const WINDOW_MS = 50; // 50ms windows for amplitude sampling of uploaded files

interface BeatOptions {
  windowMs: number;      // ms each envelope sample represents
  sensitivity?: number;  // higher = fewer, stronger beats
  minGapMs?: number;     // minimum time between detected onsets
  minEnergy?: number;    // ignore onsets in quiet passages (0-1)
  graceMs?: number;      // skip the very start so the player can settle in
}

/** Decode an uploaded audio file and extract amplitude + beat data. */
export async function decodeAndAnalyze(file: File): Promise<WaveRiderAudioData> {
  return decodeAndAnalyzeBuffer(await file.arrayBuffer());
}

/**
 * Decode raw audio bytes (an uploaded file, or a track pulled through the audio
 * proxy) and extract amplitude + beat data via true Web Audio PCM analysis.
 */
export async function decodeAndAnalyzeBuffer(
  arrayBuf: ArrayBuffer
): Promise<WaveRiderAudioData> {
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuf);
  ctx.close();

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.max(1, Math.floor(sampleRate * (WINDOW_MS / 1000)));

  // Extract RMS amplitude per window — this is the raw energy envelope.
  const rawAmps: number[] = [];
  for (let i = 0; i < channelData.length; i += windowSize) {
    const end = Math.min(i + windowSize, channelData.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += channelData[j] * channelData[j];
    rawAmps.push(Math.sqrt(sum / Math.max(1, end - i)));
  }

  // Normalize to 0-1.
  const maxAmp = Math.max(...rawAmps, 0.0001);
  const normalized = rawAmps.map((a) => a / maxAmp);

  return finishAnalysis(normalized, audioBuffer.duration, {
    windowMs: WINDOW_MS,
    terrainSmoothing: 7,
    audioBuffer,
  });
}

/** Shared tail: smooth for terrain, detect beats on the sharp envelope. */
function finishAnalysis(
  normalized: number[],
  duration: number,
  opts: { windowMs: number; terrainSmoothing: number; audioBuffer?: AudioBuffer }
): WaveRiderAudioData {
  // Terrain uses a smoothed envelope so hills roll instead of jittering.
  const amplitudes = smoothAmplitudes(normalized, opts.terrainSmoothing);

  // Beats are detected on a only-lightly-smoothed signal so transients survive.
  const onsetSignal = smoothAmplitudes(normalized, 1);
  const beats = detectBeats(onsetSignal, {
    windowMs: opts.windowMs,
    sensitivity: 1.35,
    minGapMs: 360,
    minEnergy: 0.12,
    graceMs: 2200,
  });

  return {
    amplitudes,
    beats,
    duration,
    ...(opts.audioBuffer ? { audioBuffer: opts.audioBuffer } : {}),
  };
}

/** Moving-average filter. windowSize 1 = no smoothing. */
export function smoothAmplitudes(amps: number[], windowSize = 5): number[] {
  if (windowSize <= 1) return amps.slice();
  const half = Math.floor(windowSize / 2);
  return amps.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < amps.length) {
        sum += amps[j];
        count++;
      }
    }
    return sum / count;
  });
}

/**
 * Energy-flux onset detection. Looks for sharp *rises* in energy (where new sounds
 * hit) rather than just loud moments, using an adaptive local threshold. This is far
 * more reliable than thresholding a heavily-smoothed signal, which flattens transients.
 */
export function detectBeats(envelope: number[], options: BeatOptions): number[] {
  const { windowMs } = options;
  const sensitivity = options.sensitivity ?? 1.4;
  const minEnergy = options.minEnergy ?? 0.12;
  const minGap = Math.max(1, Math.round((options.minGapMs ?? 300) / windowMs));
  const startIdx = Math.max(1, Math.round((options.graceMs ?? 2000) / windowMs));
  // ~half-second adaptive window on each side.
  const localWindow = Math.max(4, Math.round(500 / windowMs));

  // Positive energy flux (rectified first difference).
  const flux: number[] = new Array(envelope.length).fill(0);
  for (let i = 1; i < envelope.length; i++) {
    flux[i] = Math.max(0, envelope[i] - envelope[i - 1]);
  }

  const beats: number[] = [];
  let lastBeat = -Infinity;

  for (let i = startIdx; i < envelope.length - 1; i++) {
    // Local mean flux as the adaptive floor.
    let sum = 0;
    let count = 0;
    for (let j = i - localWindow; j <= i + localWindow; j++) {
      if (j >= 0 && j < flux.length) {
        sum += flux[j];
        count++;
      }
    }
    const localAvg = sum / Math.max(1, count);
    const threshold = localAvg * sensitivity + 0.008;

    const isLocalPeak = flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1];

    if (
      flux[i] > threshold &&
      isLocalPeak &&
      envelope[i] > minEnergy &&
      i - lastBeat >= minGap
    ) {
      beats.push(i);
      lastBeat = i;
    }
  }

  return beats;
}
