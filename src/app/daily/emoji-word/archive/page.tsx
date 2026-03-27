import {
  getEmojiWordArchiveDates,
  getTodayDate,
} from "@/lib/emoji-word-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Emoji Decoder Archive — Gamesite",
  description: "Play past Emoji Decoder puzzles.",
};

export default async function EmojiWordArchivePage() {
  let dates = await getEmojiWordArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { puzzle_date: d.toISOString().split("T")[0] };
    });
  }

  const subscribed = await isUserSubscribed();

  return (
    <ArchivePaywall
      dates={dates}
      todayDate={getTodayDate()}
      gameName="Emoji Decoder"
      gameSlug="emoji-word"
      gameColor="text-amber"
      todayHref="/daily/emoji-word"
      isSubscriber={subscribed}
    />
  );
}
