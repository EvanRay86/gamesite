"use client";

import type { MetaProgress, ClassId } from "@/types/netherveil";
import { CLASS_COLORS } from "@/types/netherveil";
import { getClassDef, getAvailableClasses } from "@/lib/netherveil/classes";

interface MenuScreenProps {
  meta: MetaProgress;
  onStartRun: (classId: ClassId) => void;
  onStartDaily: (classId: ClassId) => void;
}

export default function MenuScreen({
  meta,
  onStartRun,
  onStartDaily,
}: MenuScreenProps) {
  const classes = getAvailableClasses(meta.unlockedClasses);

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
          <span className="text-purple-400">NETHER</span>
          <span className="text-slate-200">VEIL</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Echoes of the Deep</p>
      </div>

      {/* Animated void orb */}
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-purple-500/30 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          🔮
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex gap-6 text-center text-xs text-slate-400">
        <div>
          <div className="text-lg font-bold text-white">{meta.totalRuns}</div>
          <div>Runs</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-400">{meta.totalVictories}</div>
          <div>Victories</div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-400">{meta.bestScore}</div>
          <div>Best Score</div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-400">{meta.voidEssence}</div>
          <div>Void Essence</div>
        </div>
      </div>

      {/* Class Selection */}
      <div className="w-full max-w-lg">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 text-center uppercase tracking-wider">
          Choose Your Class
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {classes.map((cls) => {
            const classStats = meta.classStats[cls.id];
            return (
              <button
                key={cls.id}
                onClick={() => onStartRun(cls.id)}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all"
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at center, ${cls.color}15, transparent 70%)`,
                  }}
                />
                <span className="text-3xl relative">{cls.emoji}</span>
                <span
                  className="text-sm font-semibold relative"
                  style={{ color: cls.color }}
                >
                  {cls.name}
                </span>
                <span className="text-[10px] text-slate-400 text-center leading-tight relative">
                  {cls.description}
                </span>
                {classStats && classStats.runs > 0 && (
                  <span className="text-[9px] text-slate-500 relative">
                    {classStats.wins}W / {classStats.runs}R — Best: {classStats.bestScore}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Locked classes teaser */}
        {meta.unlockedClasses.length < 4 && (
          <div className="mt-3 flex gap-3">
            {!meta.unlockedClasses.includes("weavekeeper") && (
              <div className="flex-1 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-center opacity-50">
                <span className="text-lg">🔒</span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Weavekeeper — Complete 3 runs
                </p>
              </div>
            )}
            {!meta.unlockedClasses.includes("shadowblade") && (
              <div className="flex-1 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-center opacity-50">
                <span className="text-lg">🔒</span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Shadowblade — Win 1 run
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily run button */}
      <button
        onClick={() => onStartDaily(meta.unlockedClasses[0] as ClassId)}
        className="px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
      >
        ⚡ Daily Descent
      </button>
    </div>
  );
}
