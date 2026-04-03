"use client";

import { shareToX } from "@/lib/share";

interface XShareButtonProps {
  getText: () => string;
  className?: string;
}

export default function XShareButton({ getText, className }: XShareButtonProps) {
  return (
    <button
      onClick={() => shareToX(getText())}
      aria-label="Share to X"
      className={
        className ??
        "bg-black text-white rounded-full w-11 h-11 flex items-center justify-center hover:bg-gray-800 transition-colors"
      }
    >
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </button>
  );
}
