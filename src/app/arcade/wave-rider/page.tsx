import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import WaveRider from "@/components/WaveRider";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Wave Rider — Surf the Music",
  description:
    "Upload a song or paste a SoundCloud link. Ride the waveform, dodge obstacles, and collect orbs in this music-powered arcade game.",
  path: "arcade/wave-rider",
  color: "purple",
});

export default function WaveRiderPage() {
  return (
    <main>
      <GameJsonLd
        name="Wave Rider"
        description="Upload a song or paste a SoundCloud link. Ride the waveform, dodge obstacles, and collect orbs."
        path="arcade/wave-rider"
        category="arcade"
      />
      <WaveRider />
      <MoreArcadeGames currentSlug="wave-rider" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Wave Rider?
        </h2>
        <p>
          Wave Rider turns your music into a playable arcade course. Upload a song
          or paste a SoundCloud link and the game generates a waveform track from
          the audio. Ride the peaks and valleys, dodge obstacles that sync to the
          beat, and collect orbs as you surf through your favorite tracks.
        </p>
        <p>
          Play Wave Rider free on Gamesite — every song creates a unique level, so
          the game is different every time. No two runs are alike.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Upload an audio file from your device or paste a SoundCloud link to generate your track.</li>
          <li>Your rider moves forward automatically — use the up and down keys (or tap) to change lanes.</li>
          <li>Dodge red obstacles that appear in time with the music&apos;s rhythm.</li>
          <li>Collect glowing orbs for bonus points — they often appear on the beat drops.</li>
          <li>Survive until the song ends to see your final score and accuracy rating.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Choose songs with a clear, consistent beat — the game generates better levels from well-defined rhythms.</li>
          <li>Listen to the music and anticipate obstacles; they spawn on beat, so your ears are your best guide.</li>
          <li>Start with slower songs to learn the mechanics, then work up to faster tracks.</li>
          <li>Focus on dodging obstacles first, collecting orbs second — staying alive is always the priority.</li>
          <li>Replay the same song to memorize its obstacle pattern and perfect your score.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Wave Rider free to play?", answer: "Yes! Wave Rider is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Wave Rider on my phone?", answer: "Absolutely. Wave Rider works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "Does Wave Rider save my progress?", answer: "Each song creates a unique level, so there is no persistent progress. Your scores for individual songs are tracked so you can try to beat your best on your favorite tracks." },
        { question: "What audio formats does Wave Rider support?", answer: "You can upload most common audio formats from your device or paste a SoundCloud link. The game analyzes the audio waveform to generate the track, so songs with clear rhythms create the best levels." },
        { question: "Does every song create a different level?", answer: "Yes! Wave Rider analyzes the waveform and rhythm of each song to generate a unique obstacle course. Different tempos, beats, and dynamics create entirely different gameplay experiences." },
      ]} />
    </main>
  );
}
