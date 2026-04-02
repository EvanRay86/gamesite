"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">:(</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-text-muted mb-6 max-w-md">
        An unexpected error occurred. Try again or head back to the homepage.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-coral text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:bg-coral-dark transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full px-5 py-2.5 text-sm font-semibold bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors no-underline"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
