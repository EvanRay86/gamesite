import type { GameColor } from "./game-registry";

export const colorBg: Record<GameColor, string> = {
  coral: "bg-coral", teal: "bg-teal", sky: "bg-sky",
  amber: "bg-amber", purple: "bg-purple", green: "bg-green",
};

export const colorText: Record<GameColor, string> = {
  coral: "text-coral", teal: "text-teal", sky: "text-sky",
  amber: "text-amber", purple: "text-purple", green: "text-green",
};

export const colorBgLight: Record<GameColor, string> = {
  coral: "bg-coral/10", teal: "bg-teal/10", sky: "bg-sky/10",
  amber: "bg-amber/10", purple: "bg-purple/10", green: "bg-green/10",
};

export const borderColor: Record<GameColor, string> = {
  coral: "border-coral/30", teal: "border-teal/30", sky: "border-sky/30",
  amber: "border-amber/30", purple: "border-purple/30", green: "border-green/30",
};

export const hoverBorder: Record<GameColor, string> = {
  coral: "hover:border-coral", teal: "hover:border-teal", sky: "hover:border-sky",
  amber: "hover:border-amber", purple: "hover:border-purple", green: "hover:border-green",
};

export const hoverBg: Record<GameColor, string> = {
  coral: "hover:bg-coral/5", teal: "hover:bg-coral/5", sky: "hover:bg-sky/5",
  amber: "hover:bg-amber/5", purple: "hover:bg-purple/5", green: "hover:bg-green/5",
};

export const hoverBgSubtle: Record<GameColor, string> = {
  coral: "hover:bg-[#fff5f5]", teal: "hover:bg-[#f0fdfb]", sky: "hover:bg-[#f0f9ff]",
  amber: "hover:bg-[#fffbeb]", purple: "hover:bg-[#faf5ff]", green: "hover:bg-[#f0fdf4]",
};

export const hoverText: Record<GameColor, string> = {
  coral: "group-hover:text-coral", teal: "group-hover:text-teal", sky: "group-hover:text-sky",
  amber: "group-hover:text-amber", purple: "group-hover:text-purple", green: "group-hover:text-green",
};
