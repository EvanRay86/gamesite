import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-coral mb-4">404</h1>
      <p className="text-xl text-text-secondary mb-2">
        This page doesn&apos;t exist (yet).
      </p>
      <p className="text-text-muted mb-8">
        Maybe the puzzle you&apos;re looking for is on the home page?
      </p>
      <div className="flex gap-4">
        <Link
          href="/daily"
          className="px-6 py-3 bg-coral text-white rounded-full font-semibold hover:bg-coral-dark transition-colors no-underline"
        >
          Daily Puzzles
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-border-light rounded-full font-semibold text-text-secondary hover:bg-surface transition-colors no-underline"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
