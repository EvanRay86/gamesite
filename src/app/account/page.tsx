"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DailyLoginDashboard from "@/components/DailyLoginDashboard";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  // Display name state
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading…</div>
      </main>
    );
  }

  // Calculate cooldown for display name
  const canChangeName = (() => {
    if (!profile?.display_name_updated_at) return true;
    const last = new Date(profile.display_name_updated_at).getTime();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    return Date.now() - last >= twoWeeks;
  })();

  const nextNameChangeDate = profile?.display_name_updated_at
    ? new Date(new Date(profile.display_name_updated_at).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

  const handleNameSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === profile?.display_name) {
      setEditingName(false);
      return;
    }

    setNameSaving(true);
    setNameError("");
    setNameSuccess(false);

    try {
      const res = await fetch("/api/profile/display-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNameError(data.error);
        return;
      }

      setNameSuccess(true);
      setEditingName(false);
      await refreshProfile();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      setNameError("Something went wrong");
    } finally {
      setNameSaving(false);
    }
  };

  const resizeImage = (file: File, maxSize: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down to fit within maxSize x maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to resize image"));
          },
          "image/webp",
          0.8,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Resize to 256x256 max and convert to WebP
      const resized = await resizeImage(file, 256);
      const resizedFile = new File([resized], "avatar.webp", { type: "image/webp" });

      const formData = new FormData();
      formData.append("avatar", resizedFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setAvatarError(data.error);
        return;
      }

      await refreshProfile();
    } catch {
      setAvatarError("Upload failed");
    } finally {
      setAvatarUploading(false);
      // Reset file input so re-selecting the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const avatarUrl = profile?.avatar_url;
  const initial = (profile?.display_name || user.email)?.[0]?.toUpperCase() ?? "U";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-text-primary mb-8">Account</h1>

        {/* Daily Login Rewards */}
        <DailyLoginDashboard />

        {/* Profile picture & display name */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="relative group rounded-full overflow-hidden w-24 h-24 bg-teal/10 flex items-center justify-center mb-3 hover:ring-2 hover:ring-teal/40 transition-all disabled:opacity-50"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-teal">{initial}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="text-xs text-text-dim">Tap to change photo</span>
            {avatarError && <span className="text-xs text-coral mt-1">{avatarError}</span>}
          </div>

          {/* Display name */}
          <div className="mb-4">
            <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Display Name</div>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={24}
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-teal/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setDisplayName(profile?.display_name || "");
                    }
                  }}
                />
                <button
                  onClick={handleNameSave}
                  disabled={nameSaving}
                  className="rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90 transition-colors disabled:opacity-50"
                >
                  {nameSaving ? "…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setDisplayName(profile?.display_name || "");
                    setNameError("");
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-semibold">
                  {profile?.display_name || "Not set"}
                </span>
                {canChangeName ? (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-teal text-xs font-semibold hover:underline"
                  >
                    Edit
                  </button>
                ) : nextNameChangeDate && (
                  <span className="text-text-dim text-xs">
                    Can change {nextNameChangeDate.toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            {nameError && <div className="text-coral text-xs mt-1">{nameError}</div>}
            {nameSuccess && <div className="text-green text-xs mt-1">Display name updated!</div>}
          </div>

          {/* Email */}
          <div>
            <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Email</div>
            <div className="text-text-primary font-semibold">{user.email}</div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="w-full rounded-full border border-border py-3 text-sm font-semibold text-text-muted
                     hover:bg-surface-hover hover:text-coral transition-colors"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
