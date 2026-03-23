import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <h1 className="font-display text-5xl text-text-primary tracking-tight mb-3 animate-[fade-up_0.5s_ease_forwards]">
        Gamesite
      </h1>
      <p className="text-text-muted text-base mb-12 animate-[fade-up_0.5s_ease_0.1s_forwards] opacity-0">
        Pick a game and play.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[520px]">
        {/* Linked */}
        <Link
          href="/linked"
          className="group block bg-surface border-2 border-border rounded-2xl p-6
                     hover:bg-surface-hover hover:border-coral/40
                     transition-all duration-200 no-underline
                     animate-[fade-up_0.5s_ease_0.2s_forwards] opacity-0"
        >
          <div className="grid grid-cols-2 gap-1 mb-4 w-fit">
            {["bg-coral", "bg-teal", "bg-sky", "bg-amber"].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-md ${c} opacity-80`} />
            ))}
          </div>
          <h2 className="font-display text-xl text-text-primary group-hover:text-coral transition-colors">
            Linked
          </h2>
          <p className="text-text-dim text-xs mt-1">Daily word puzzle</p>
        </Link>

        {/* Slime Volleyball */}
        <Link
          href="/slime"
          className="group block bg-surface border-2 border-border rounded-2xl p-6
                     hover:bg-surface-hover hover:border-teal/40
                     transition-all duration-200 no-underline
                     animate-[fade-up_0.5s_ease_0.3s_forwards] opacity-0"
        >
          <div className="flex gap-2 mb-4">
            <div className="w-8 h-4 rounded-t-full bg-coral opacity-80" />
            <div className="w-3 h-3 rounded-full bg-text-primary opacity-60 self-end" />
            <div className="w-8 h-4 rounded-t-full bg-teal opacity-80" />
          </div>
          <h2 className="font-display text-xl text-text-primary group-hover:text-teal transition-colors">
            Slime Volleyball
          </h2>
          <p className="text-text-dim text-xs mt-1">Online multiplayer</p>
        </Link>
      </div>
    </main>
  );
}
