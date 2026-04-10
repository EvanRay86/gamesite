"use client";

import { useState } from "react";
import { shareOrCopy } from "@/lib/share";
import XShareButton from "@/components/XShareButton";
import type { Echo } from "@/types/echo";

interface EchoResultsProps {
  echoCount: number;
  totalTurns: number;
  tier: number;
  echoes: Echo[];
  getShareText: () => string;
  onPlayAgain: () => void;
}

export default function EchoResults({
  echoCount,
  totalTurns,
  tier,
  echoes,
  getShareText,
  onPlayAgain,
}: EchoResultsProps) {
  const [copied, setCopied] = useState(false);

  const tierNames: Record<number, string> = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
    4: "Nightmare",
  };

  const handleCopy = async () => {
    const ok = await shareOrCopy(getShareText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-green-400">Dungeon Cleared!</p>
        <p className="text-lg text-gray-300">
          {tierNames[tier]} - {echoCount} {echoCount === 1 ? "echo" : "echoes"} ({totalTurns} turns)
        </p>
      </div>

      {/* Echo summary */}
      <div className="w-full space-y-1.5 bg-gray-800/50 rounded-lg p-3">
        {echoes.map((echo, i) => (
          <div
            key={echo.id}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: echo.color, opacity: echo.alive ? 1 : 0.4 }}
            />
            <span className="text-gray-300">
              Echo {i + 1}: {echo.actions.length} steps
              {!echo.alive && " (fallen)"}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full inline-block flex-shrink-0 bg-white" />
          <span className="text-gray-300">Me: Walked to freedom</span>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
        >
          {copied ? "Copied!" : "Copy Results"}
        </button>
        <XShareButton getText={getShareText} />
      </div>

      <button
        onClick={onPlayAgain}
        className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        Play Again
      </button>
    </div>
  );
}
