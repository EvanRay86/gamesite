import { getVocabVaultArchiveDates, getTodayDate } from "@/lib/vocab-vault-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Vocab Vault Archive — Gamesite",
  description: "Play past Vocab Vault puzzles.",
};

export default async function VocabVaultArchivePage() {
  let dates = await getVocabVaultArchiveDates();
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
    <ArchivePaywall dates={dates} todayDate={getTodayDate()} gameName="Vocab Vault" gameSlug="vocab-vault" gameColor="text-purple" todayHref="/daily/vocab-vault" isSubscriber={subscribed} />
  );
}
