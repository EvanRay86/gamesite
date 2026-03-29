"use client";

interface Props {
  onClick: () => void;
}

/** Small chart-icon button placed in game headers to open the stats modal. */
export default function StatsButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="View stats"
      title="Stats"
      className="w-9 h-9 flex items-center justify-center rounded-full
                 text-text-dim hover:text-text-primary hover:bg-white/10
                 transition-colors"
    >
      {/* Bar chart icon (SVG) */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="6" width="4" height="14" rx="1" />
        <rect x="16" y="2" width="4" height="18" rx="1" />
      </svg>
    </button>
  );
}
