"use client";

import type { GameEvent } from "@/types/netherveil";

interface EventScreenProps {
  event: GameEvent;
  onSelectOption: (index: number) => void;
}

export default function EventScreen({ event, onSelectOption }: EventScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto">
      <div className="text-5xl">{event.emoji}</div>
      <h2
        className="text-xl font-bold text-white text-center"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        {event.title}
      </h2>
      <p className="text-sm text-slate-300 text-center leading-relaxed">
        {event.desc}
      </p>

      <div className="w-full flex flex-col gap-2">
        {event.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelectOption(i)}
            className="w-full p-3 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 transition-all text-left"
          >
            <div className="text-sm font-semibold text-white">
              {option.label}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {option.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
