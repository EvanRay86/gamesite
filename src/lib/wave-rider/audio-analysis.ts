// ── Audio analysis for Wave Rider ────────────────────────────────────────────
// Decodes uploaded audio files and extracts amplitude + beat data for terrain generation.

export interface WaveRiderAudioData {
  amplitudes: number[]; // normalized 0-1, one per time-window
  beats: number[];      // indices into amplitudes where beats land
  duration: number;     // seconds
  source: "file" | "soundcloud";
  audioBuffer?: AudioBuffer; // only present for file uploads
}

const WINDOW_MS = 50; // 50ms windows for amplitude sampling

/** Decode an uploaded audio file and extract amplitude + beat data. */
export async function decodeAndAnalyze(file: File): Promise<WaveRiderAudioData> {
  const arrayBuf = await file.arrayBuffer();
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuf);
  ctx.close();

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * (WINDOW_MS / 1000));

  // Extract RMS amplitude per window
  const rawAmps: number[] = [];
  for (let i = 0; i < channelData.length; i += windowSize) {
    const end = Math.min(i + windowSize, channelData.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    rawAmps.push(Math.sqrt(sum / (end - i)));
  }

  // Normalize to 0-1
  const maxAmp = Math.max(...rawAmps, 0.001);
  const amplitudes = rawAmps.map((a) => a / maxAmp);

  // Smooth to avoid spiky terrain
  const smoothed = smoothAmplitudes(amplitudes, 5);

  // Detect beats
  const beats = detectBeats(smoothed, 1.4);

  return {
    amplitudes: smoothed,
    beats,
    duration: audioBuffer.duration,
    source: "file",
    audioBuffer,
  };
}

/** Moving average filter for smoother terrain. */
export function smoothAmplitudes(amps: number[], windowSize = 5): number[] {
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

/** Energy-based onset detection — returns indices where energy exceeds local average. */
export function detectBeats(amplitudes: number[], sensitivity = 1.4): number[] {
  const beats: number[] = [];
  const localWindow = 20;
  const minSpacing = Math.floor(200 / WINDOW_MS); // 200ms min between beats

  for (let i = localWindow; i < amplitudes.length - localWindow; i++) {
    // Local average energy
    let localSum = 0;
    for (let j = i - localWindow; j < i + localWindow; j++) {
      localSum += amplitudes[j];
    }
    const localAvg = localSum / (localWindow * 2);

    if (amplitudes[i] > localAvg * sensitivity && amplitudes[i] > 0.15) {
      if (beats.length === 0 || i - beats[beats.length - 1] >= minSpacing) {
        beats.push(i);
      }
    }
  }

  return beats;
}

/** Extract amplitude data from a SoundCloud waveform PNG URL. */
export async function extractSoundCloudWaveform(
  waveformUrl: string
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // For each column, find the highest non-transparent pixel
      const amplitudes: number[] = [];
      for (let x = 0; x < canvas.width; x++) {
        let topY = canvas.height;
        for (let y = 0; y < canvas.height; y++) {
          const idx = (y * canvas.width + x) * 4;
          const alpha = imageData.data[idx + 3];
          if (alpha > 30) {
            topY = y;
            break;
          }
        }
        // Normalize: higher bar = lower topY = higher amplitude
        amplitudes.push(1 - topY / canvas.height);
      }
      resolve(amplitudes);
    };
    img.onerror = () => reject(new Error("Failed to load waveform image"));
    img.src = waveformUrl;
  });
}
