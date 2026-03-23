import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-coral/15 rounded-full blur-[100px] animate-[glow-pulse_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-teal/15 rounded-full blur-[100px] animate-[glow-pulse_4s_ease-in-out_1s_infinite]" />

      {/* Header */}
      <div className="text-center mb-14 animate-[fade-up_0.6s_ease_forwards]">
        <h1 className="font-body text-6xl sm:text-7xl font-extrabold text-text-primary tracking-tight mb-4 leading-none">
          <span className="bg-gradient-to-r from-coral via-amber to-teal bg-clip-text text-transparent">
            Gamesite
          </span>
        </h1>
        <p className="text-text-muted text-lg font-medium animate-[fade-up_0.6s_ease_0.15s_forwards] opacity-0">
          Pick a game. Start playing.
        </p>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-[860px]">
        {/* Linked */}
        <Link
          href="/linked"
          className="group relative block bg-surface/80 backdrop-blur-sm
                     border border-border-light rounded-2xl p-6 pb-5
                     hover:border-coral/50 hover:bg-coral/[0.07]
                     hover:shadow-[0_0_40px_rgba(255,107,107,0.12)]
                     transition-all duration-300 no-underline cursor-pointer
                     animate-[fade-up_0.5s_ease_0.2s_forwards] opacity-0"
        >
          {/* Mini game preview */}
          <div className="grid grid-cols-4 gap-1 mb-5 group-hover:animate-[grid-shuffle_0.6s_ease]">
            {["bg-coral", "bg-teal", "bg-sky", "bg-amber",
              "bg-amber", "bg-coral", "bg-teal", "bg-sky",
              "bg-sky", "bg-amber", "bg-coral", "bg-teal",
              "bg-teal", "bg-sky", "bg-amber", "bg-coral"].map((c, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md ${c} opacity-70 group-hover:opacity-90 transition-opacity duration-300`}
              />
            ))}
          </div>

          <h2 className="font-body text-xl font-bold text-text-primary group-hover:text-coral transition-colors duration-200">
            Linked
          </h2>
          <p className="text-text-dim text-sm mt-1">Find the hidden connections</p>

          {/* Tag */}
          <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider
                          text-coral/80 bg-coral/10 rounded-full px-2.5 py-0.5">
            Daily puzzle
          </span>
        </Link>

        {/* Slime Volleyball */}
        <Link
          href="/slime"
          className="group relative block bg-surface/80 backdrop-blur-sm
                     border border-border-light rounded-2xl p-6 pb-5
                     hover:border-teal/50 hover:bg-teal/[0.07]
                     hover:shadow-[0_0_40px_rgba(78,205,196,0.12)]
                     transition-all duration-300 no-underline cursor-pointer
                     animate-[fade-up_0.5s_ease_0.3s_forwards] opacity-0"
        >
          {/* Mini game preview - slime scene */}
          <div className="relative h-[76px] mb-5 flex items-end justify-center gap-6 overflow-hidden">
            {/* Net */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-8 bg-text-dim/30 rounded-t-full" />

            {/* Left slime */}
            <div className="relative z-10 group-hover:animate-[slime-hop_0.8s_ease_infinite]">
              <div className="w-10 h-5 rounded-t-full bg-coral opacity-90" />
              <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-white">
                <div className="absolute top-0.5 right-0 w-1 h-1 rounded-full bg-dark" />
              </div>
            </div>

            {/* Ball */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 group-hover:animate-[ball-bounce_0.6s_ease_infinite]">
              <div className="w-3.5 h-3.5 rounded-full bg-text-primary/80" />
            </div>

            {/* Right slime */}
            <div className="relative z-10 group-hover:animate-[slime-hop_0.8s_ease_0.2s_infinite]">
              <div className="w-10 h-5 rounded-t-full bg-teal opacity-90" />
              <div className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-white">
                <div className="absolute top-0.5 left-0 w-1 h-1 rounded-full bg-dark" />
              </div>
            </div>

            {/* Ground line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-text-dim/20" />
          </div>

          <h2 className="font-body text-xl font-bold text-text-primary group-hover:text-teal transition-colors duration-200">
            Slime Volleyball
          </h2>
          <p className="text-text-dim text-sm mt-1">Challenge players online</p>

          {/* Tag */}
          <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider
                          text-teal/80 bg-teal/10 rounded-full px-2.5 py-0.5">
            Multiplayer
          </span>
        </Link>

        {/* Daily Trivia */}
        <Link
          href="/trivia"
          className="group relative block bg-surface/80 backdrop-blur-sm
                     border border-border-light rounded-2xl p-6 pb-5
                     hover:border-sky/50 hover:bg-sky/[0.07]
                     hover:shadow-[0_0_40px_rgba(69,183,209,0.12)]
                     transition-all duration-300 no-underline cursor-pointer
                     animate-[fade-up_0.5s_ease_0.4s_forwards] opacity-0"
        >
          {/* Mini preview - question marks */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {["Science", "History", "Geography", "Art", "Music", "Nature", "Literature", "Technology"].map((cat, i) => {
              const colors: Record<string, string> = {
                Science: "bg-teal", History: "bg-coral", Geography: "bg-sky",
                Art: "bg-amber", Music: "bg-amber", Nature: "bg-teal",
                Literature: "bg-coral", Technology: "bg-sky",
              };
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg ${colors[cat]} opacity-60 group-hover:opacity-90
                             flex items-center justify-center text-white/80 text-xs font-bold
                             transition-opacity duration-300`}
                >
                  ?
                </div>
              );
            })}
          </div>

          <h2 className="font-body text-xl font-bold text-text-primary group-hover:text-sky transition-colors duration-200">
            Daily Trivia
          </h2>
          <p className="text-text-dim text-sm mt-1">Test your knowledge daily</p>

          {/* Tag */}
          <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider
                          text-sky/80 bg-sky/10 rounded-full px-2.5 py-0.5">
            Daily puzzle
          </span>
        </Link>
      </div>

      {/* Footer hint */}
      <p className="text-text-dim text-xs mt-10 animate-[fade-up_0.5s_ease_0.6s_forwards] opacity-0">
        More games coming soon
      </p>
    </main>
  );
}
