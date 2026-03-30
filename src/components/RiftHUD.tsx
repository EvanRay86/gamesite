"use client";

import type { RiftPlayer, Faction, RiftEvent } from "@/types/rift";
import { FACTION_COLORS, FACTION_NAMES } from "@/types/rift";
import { getEloTier, getEloTierColor } from "@/lib/rift-elo";

interface RiftHUDProps {
  player: RiftPlayer;
  factionCounts: Record<Faction, number>;
  events: RiftEvent[];
  seasonNumber: number;
}

export default function RiftHUD({
  player,
  factionCounts,
  events,
  seasonNumber,
}: RiftHUDProps) {
  const tier = getEloTier(player.elo);
  const tierColor = getEloTierColor(tier);
  const totalHexes = factionCounts.crimson + factionCounts.verdant + factionCounts.azure;

  return (
    <div className="space-y-4">
      {/* Season & Faction Header */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Season {seasonNumber}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: FACTION_COLORS[player.faction] + "20",
              color: FACTION_COLORS[player.faction],
            }}
          >
            {FACTION_NAMES[player.faction]}
          </span>
        </div>

        {/* ELO Badge */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: tierColor }}
          >
            {player.elo}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: tierColor }}>
              {tier}
            </div>
            <div className="text-xs text-text-muted">
              {player.wins}W / {player.losses}L
            </div>
          </div>
        </div>

        {/* Attack Tokens */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Attacks:</span>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs
                  ${i < player.attackTokens
                    ? "bg-coral text-white font-bold"
                    : "bg-surface text-text-dim"
                  }`}
              >
                {i < player.attackTokens ? "\u2694" : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Territory Overview */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
          Territory
        </h3>
        <div className="space-y-2">
          {(["crimson", "verdant", "azure"] as Faction[]).map((f) => {
            const count = factionCounts[f];
            const pct = totalHexes > 0 ? (count / totalHexes) * 100 : 0;
            return (
              <div key={f} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: FACTION_COLORS[f] }}
                />
                <span className="text-xs font-medium flex-1 capitalize">{f}</span>
                <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: FACTION_COLORS[f],
                    }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Stats */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
          Your Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-coral">{player.hexesCaptured}</div>
            <div className="text-xs text-text-muted">Captured</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal">{player.hexesDefended}</div>
            <div className="text-xs text-text-muted">Defended</div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
          Activity
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.length === 0 && (
            <p className="text-xs text-text-dim italic">No activity yet</p>
          )}
          {events.slice(0, 10).map((event) => (
            <div key={event.id} className="text-xs text-text-secondary">
              {event.eventType === "capture" && (
                <span>
                  <span
                    className="font-bold"
                    style={{ color: FACTION_COLORS[event.data.faction as Faction] }}
                  >
                    {event.data.playerName}
                  </span>
                  {" captured "}
                  <span className="font-mono">
                    ({event.data.hex?.q},{event.data.hex?.r})
                  </span>
                  {event.data.defenderFaction && (
                    <span>
                      {" from "}
                      <span
                        className="font-bold capitalize"
                        style={{ color: FACTION_COLORS[event.data.defenderFaction] }}
                      >
                        {event.data.defenderFaction}
                      </span>
                    </span>
                  )}
                </span>
              )}
              {event.eventType === "defend" && (
                <span>
                  <span
                    className="font-bold"
                    style={{ color: FACTION_COLORS[event.data.faction as Faction] }}
                  >
                    {event.data.playerName}
                  </span>
                  {" defended "}
                  <span className="font-mono">
                    ({event.data.hex?.q},{event.data.hex?.r})
                  </span>
                </span>
              )}
              <span className="text-text-dim ml-1">
                {formatTimeAgo(event.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
