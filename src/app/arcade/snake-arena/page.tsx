import SnakeGame from "@/components/SnakeGame";

export const metadata = {
  title: "Snake Arena — Multiplayer Snake",
  description:
    "Eat, grow, and devour other players in this multiplayer snake battle.",
};

export default function SnakeArenaPage() {
  return (
    <main>
      <SnakeGame />
    </main>
  );
}
