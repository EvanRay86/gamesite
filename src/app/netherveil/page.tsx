import NetherveilGame from "@/components/netherveil/NetherveilGame";

export const metadata = {
  title: "Netherveil: Echoes of the Deep — Roguelike Deckbuilder",
  description:
    "A tactical roguelike deckbuilder with grid combat, four unique classes, and persistent progression. Descend into the Netherveil and conquer the deep.",
};

export default function NetherveilPage() {
  return (
    <main>
      <NetherveilGame />
    </main>
  );
}
