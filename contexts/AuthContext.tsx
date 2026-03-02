/**
 * NEXUS Ghost Protocol Auth Context
 * ===================================
 * بروتوكول الشبح — Anonymous-First Identity
 *
 * Design principles:
 * 1. No phone number, no email required — Supabase anonymous auth only
 * 2. Identity = @peep_username stored in `profiles` table
 * 3. Ghost Mode = is_ghost flag + VPN tunnel placeholder
 * 4. Full graceful degradation when Supabase is not configured
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import {
  signInAnonymously,
  getSession,
  onAuthStateChange,
  fetchProfile,
  upsertProfile,
  type Profile,
} from "@/lib/supabase";
import { useAppConfig } from "@/contexts/AppConfigContext";

// ============================================================
// GHOST TUNNEL — VPN / Onion Routing Placeholder
// Swap internals for a real WireGuard/Tor integration later
// ============================================================
export class GhostTunnel {
  private static _active = false;
  private static _hops: string[] = ["NL Amsterdam", "CH Zurich", "SE Stockholm", "US New York"];
  private static _fakeIp = "10.0.0.1";

  static get isActive(): boolean { return GhostTunnel._active; }
  static get hops(): string[] { return GhostTunnel._hops; }
  static get maskedIp(): string { return GhostTunnel._fakeIp; }

  /** Connect to the ghost tunnel (stub — wire real VPN SDK here) */
  static async connect(): Promise<void> {
    GhostTunnel._active = true;
    GhostTunnel._fakeIp = generateFakeIp();
    // TODO: initiate WireGuard/Obfs4 tunnel
    // TODO: start DNS-over-HTTPS to prevent leaks
    // TODO: enable kill-switch (block all traffic if tunnel drops)
    console.log("[GhostTunnel] Connected →", GhostTunnel._fakeIp);
  }

  /** Disconnect and revert to real IP */
  static async disconnect(): Promise<void> {
    GhostTunnel._active = false;
    // TODO: tear down WireGuard tunnel
    // TODO: disable kill-switch
    console.log("[GhostTunnel] Disconnected");
  }

  /** Obfuscate outbound headers (DPI bypass placeholder) */
  static obfuscateHeaders(headers: Record<string, string>): Record<string, string> {
    // TODO: add Obfs4 / domain-fronting headers here
    return { ...headers, "X-Ghost-Mode": "1" };
  }

  /** Rotate the fake IP every N seconds (called by context on interval) */
  static rotate(): void {
    if (GhostTunnel._active) {
      GhostTunnel._fakeIp = generateFakeIp();
    }
  }
}

function generateFakeIp(): string {
  const blocks = [
    [45, 65, 91, 104, 128, 185, 212],
    [0, 10, 20, 50, 80, 100, 150, 200],
  ];
  const a = blocks[0][Math.floor(Math.random() * blocks[0].length)];
  const b = blocks[1][Math.floor(Math.random() * blocks[1].length)];
  const c = Math.floor(Math.random() * 255);
  const d = Math.floor(Math.random() * 254) + 1;
  return `${a}.${b}.${c}.${d}`;
}

// ============================================================
// CONTEXT TYPES
// ============================================================
interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isReady: boolean;
  isAnonymous: boolean;
  isGhostMode: boolean;
  maskedIp: string;
  tunnelHops: string[];

  /** Trigger anonymous sign-in + profile creation */
  signIn: (ghostUsername: string, avatarEmoji?: string, bio?: string) => Promise<{ error: string | null }>;

  /** Update @peep_username or bio */
  updateProfile: (updates: Partial<Pick<Profile, "peep_username" | "bio" | "avatar_emoji" | "is_ghost">>) => Promise<void>;

  /** Toggle VPN tunnel */
  toggleGhostTunnel: () => Promise<void>;

  /** Sign out and wipe session */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConfigured } = useAppConfig();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(true);
  const [maskedIp, setMaskedIp] = useState(GhostTunnel.maskedIp);

  // Rotate fake IP every 20 seconds while ghost mode is active
  useEffect(() => {
    if (!isGhostMode) return;
    const interval = setInterval(() => {
      GhostTunnel.rotate();
      setMaskedIp(GhostTunnel.maskedIp);
    }, 20_000);
    return () => clearInterval(interval);
  }, [isGhostMode]);

  // Bootstrap — load session on mount
  useEffect(() => {
    if (!isConfigured) {
      setIsReady(true);
      return;
    }

    let mounted = true;

    async function bootstrap() {
      const existingSession = await getSession();
      if (mounted && existingSession) {
        setSession(existingSession);
        const p = await fetchProfile(existingSession.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setIsReady(true);
    }

    bootstrap();

    const { data: listener } = onAuthStateChange(async (newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) {
        const p = await fetchProfile(newSession.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = useCallback(async (
    ghostUsername: string,
    avatarEmoji = "👻",
    bio = ""
  ): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: "Supabase not configured — add SUPABASE_URL and SUPABASE_ANON_KEY to secrets" };
    }

    const username = ghostUsername.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "").slice(0, 30);
    if (!username) return { error: "اسم المستخدم غير صالح" };

    const { user, error } = await signInAnonymously();
    if (error || !user) return { error: error?.message ?? "فشل تسجيل الدخول المجهول" };

    const savedProfile = await upsertProfile({
      id: user.id,
      peep_username: username,
      avatar_emoji: avatarEmoji,
      bio,
      is_ghost: true,
    });

    if (savedProfile) setProfile(savedProfile);
    return { error: null };
  }, [isConfigured]);

  const updateProfile = useCallback(async (
    updates: Partial<Pick<Profile, "peep_username" | "bio" | "avatar_emoji" | "is_ghost">>
  ) => {
    if (!session?.user?.id) return;
    const updated = await upsertProfile({ id: session.user.id, peep_username: profile?.peep_username ?? "ghost", ...updates });
    if (updated) setProfile(updated);
  }, [session, profile]);

  const toggleGhostTunnel = useCallback(async () => {
    if (GhostTunnel.isActive) {
      await GhostTunnel.disconnect();
      setIsGhostMode(false);
    } else {
      await GhostTunnel.connect();
      setMaskedIp(GhostTunnel.maskedIp);
      setIsGhostMode(true);
    }
  }, []);

  const signOut = useCallback(async () => {
    await GhostTunnel.disconnect();
    setIsGhostMode(false);
    setSession(null);
    setProfile(null);
    if (isConfigured) await import("@/lib/supabase").then(m => m.getSupabase().auth.signOut());
  }, [isConfigured]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    isReady,
    isAnonymous: session?.user?.is_anonymous ?? true,
    isGhostMode,
    maskedIp,
    tunnelHops: GhostTunnel.hops,
    signIn,
    updateProfile,
    toggleGhostTunnel,
    signOut,
  }), [session, profile, isReady, isGhostMode, maskedIp, signIn, updateProfile, toggleGhostTunnel, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// HOOKS
// ============================================================
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useProfile(): Profile | null {
  return useAuth().profile;
}

export function useIsGhostMode(): boolean {
  return useAuth().isGhostMode;
}
