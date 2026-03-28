"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginDay {
  login_date: string;
  credits_awarded: number;
  streak_day: number;
  streak_bonus: number;
}

interface StreakInfo {
  current_streak: number;
  claimed_today: boolean;
  total_days: number;
  recent_logins: LoginDay[];
}

const STREAK_MILESTONES = [
  { day: 3, bonus: 5, label: "3 days" },
  { day: 7, bonus: 15, label: "7 days" },
  { day: 14, bonus: 30, label: "14 days" },
  { day: 30, bonus: 50, label: "30 days" },
];

export default function DailyLoginDashboard() {
  const { user, refreshProfile } = useAuth();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    credits_awarded: number;
    streak_bonus: number;
    current_streak: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStreak = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/credits/daily-login");
      if (res.ok) {
        const data = await res.json();
        setStreakInfo(data);
      }
    } catch {
      // Silently fail on fetch
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/daily-login", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to claim");
        return;
      }
      if (data.claimed) {
        setClaimResult({
          credits_awarded: data.credits_awarded,
          streak_bonus: data.streak_bonus,
          current_streak: data.current_streak,
        });
        await refreshProfile();
        await fetchStreak();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  if (!user || !streakInfo) return null;

  const loginDates = new Set(streakInfo.recent_logins.map((l) => l.login_date));

  // Build last 14 days for the mini calendar
  const calendarDays: { date: string; label: string; isToday: boolean; loggedIn: boolean }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    calendarDays.push({
      date: dateStr,
      label: i === 0 ? "Today" : d.getDate().toString(),
      isToday: i === 0,
      loggedIn: loginDates.has(dateStr),
    });
  }

  // Find next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > streakInfo.current_streak);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-display text-lg">Daily Login Rewards</h2>
        <div className="flex items-center gap-1.5 text-amber text-sm font-semibold">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="8" />
          </svg>
          10/day
        </div>
      </div>

      {/* Claim Button or Claimed Status */}
      {!streakInfo.claimed_today && !claimResult ? (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full rounded-xl bg-gradient-to-r from-amber to-coral px-6 py-3 text-white font-bold text-sm
                     hover:opacity-90 transition-opacity disabled:opacity-50 mb-4"
        >
          {claiming ? "Claiming..." : "Claim 10 Free Credits"}
        </button>
      ) : (
        <div className="rounded-xl bg-green/10 border border-green/20 px-4 py-3 mb-4 text-center">
          {claimResult ? (
            <div>
              <span className="text-green font-bold text-sm">
                +{claimResult.credits_awarded} credits claimed!
              </span>
              {claimResult.streak_bonus > 0 && (
                <span className="text-amber font-bold text-sm ml-2">
                  +{claimResult.streak_bonus} streak bonus!
                </span>
              )}
            </div>
          ) : (
            <span className="text-green font-semibold text-sm">
              Today&apos;s credits claimed
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="text-coral text-sm text-center mb-4">{error}</div>
      )}

      {/* Streak Counter */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10">
            <span className="text-lg">🔥</span>
          </div>
          <div>
            <div className="text-text-primary font-bold text-xl leading-tight">
              {streakInfo.current_streak}
            </div>
            <div className="text-text-muted text-xs">
              day streak
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div>
          <div className="text-text-primary font-bold text-xl leading-tight">
            {streakInfo.total_days}
          </div>
          <div className="text-text-muted text-xs">
            total logins
          </div>
        </div>

        {nextMilestone && (
          <>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-amber font-bold text-sm leading-tight">
                +{nextMilestone.bonus} bonus
              </div>
              <div className="text-text-muted text-xs">
                at {nextMilestone.label}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini Calendar — Last 14 Days */}
      <div className="mb-5">
        <div className="text-text-muted text-xs uppercase tracking-wide mb-2">Last 14 Days</div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                day.isToday
                  ? day.loggedIn
                    ? "bg-green text-white"
                    : "bg-amber/20 text-amber ring-2 ring-amber/40"
                  : day.loggedIn
                    ? "bg-green/15 text-green"
                    : "bg-surface-hover text-text-dim"
              }`}
              title={day.date}
            >
              {day.label}
            </div>
          ))}
        </div>
      </div>

      {/* Streak Milestones */}
      <div>
        <div className="text-text-muted text-xs uppercase tracking-wide mb-2">Streak Bonuses</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STREAK_MILESTONES.map((milestone) => {
            const reached = streakInfo.current_streak >= milestone.day;
            return (
              <div
                key={milestone.day}
                className={`rounded-lg border px-3 py-2 text-center transition-colors ${
                  reached
                    ? "border-green/30 bg-green/5"
                    : "border-border bg-surface-hover"
                }`}
              >
                <div className={`text-xs font-bold ${reached ? "text-green" : "text-text-dim"}`}>
                  {milestone.label}
                </div>
                <div className={`text-sm font-bold ${reached ? "text-green" : "text-text-muted"}`}>
                  +{milestone.bonus}
                </div>
                {reached && <div className="text-[10px] text-green">Reached</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
