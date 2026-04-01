"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createSupabaseBrowser } from "@/lib/supabase-auth";
import type { User, SupabaseClient } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  stripe_customer_id: string | null;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isSubscriber: boolean;
  credits: number;
  loading: boolean;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowser());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (prof) {
        setProfile(prof as Profile);

        // Check for active subscription
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", userId)
          .in("status", ["active", "trialing"])
          .limit(1)
          .single();

        setIsSubscriber(!!sub || prof.is_admin === true);
      }
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
        setIsSubscriber(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsSubscriber(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isSubscriber,
        credits: profile?.credits ?? 0,
        loading,
        supabase,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
