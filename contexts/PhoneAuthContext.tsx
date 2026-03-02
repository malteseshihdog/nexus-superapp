import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl, setQueryClientToken } from "@/lib/query-client";

const TOKEN_KEY = "nexus_auth_token";
const USER_KEY = "nexus_auth_user";

export interface NexusUser {
  id: number;
  phone: string;
  name: string;
  avatar_emoji: string;
  username: string | null;
  bio: string;
}

interface PhoneAuthContextValue {
  user: NexusUser | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ error: string | null; devCode?: string }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Pick<NexusUser, "name" | "username" | "bio" | "avatar_emoji">>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const PhoneAuthContext = createContext<PhoneAuthContextValue | null>(null);

async function storeToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  }
}

async function storeUser(user: NexusUser): Promise<void> {
  const json = JSON.stringify(user);
  if (Platform.OS === "web") {
    localStorage.setItem(USER_KEY, json);
  } else {
    await SecureStore.setItemAsync(USER_KEY, json);
  }
}

async function getStoredUser(): Promise<NexusUser | null> {
  try {
    let json: string | null;
    if (Platform.OS === "web") {
      json = localStorage.getItem(USER_KEY);
    } else {
      json = await SecureStore.getItemAsync(USER_KEY);
    }
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function PhoneAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NexusUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const storedToken = await getStoredToken();
      const storedUser = await getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setQueryClientToken(storedToken);
        try {
          const base = getApiUrl();
          const res = await fetch(new URL("/api/auth/me", base).toString(), {
            headers: { Authorization: `Bearer ${storedToken}` },
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const data = await res.json() as { user: NexusUser };
            setUser(data.user);
            await storeUser(data.user);
          } else {
            setQueryClientToken(null);
            await removeToken();
            setToken(null);
            setUser(null);
          }
        } catch {
          // keep stored user on network error
        }
      }
      setIsReady(true);
    })();
  }, []);

  const sendOtp = useCallback(async (phone: string): Promise<{ error: string | null; devCode?: string }> => {
    try {
      const base = getApiUrl();
      const res = await fetch(new URL("/api/auth/send-otp", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json() as { error?: string; dev_code?: string };
      if (!res.ok) return { error: data.error ?? "فشل إرسال الكود" };
      return { error: null, devCode: data.dev_code };
    } catch {
      return { error: "تحقق من اتصالك بالإنترنت" };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string): Promise<{ error: string | null }> => {
    try {
      const base = getApiUrl();
      const res = await fetch(new URL("/api/auth/verify-otp", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, name }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json() as { error?: string; token?: string; user?: NexusUser };
      if (!res.ok) return { error: data.error ?? "كود خاطئ" };
      if (data.token && data.user) {
        await storeToken(data.token);
        await storeUser(data.user);
        setQueryClientToken(data.token);
        setToken(data.token);
        setUser(data.user);
      }
      return { error: null };
    } catch {
      return { error: "تحقق من اتصالك بالإنترنت" };
    }
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<Pick<NexusUser, "name" | "username" | "bio" | "avatar_emoji">>
  ): Promise<{ error: string | null }> => {
    if (!token) return { error: "غير مسجل الدخول" };
    try {
      const base = getApiUrl();
      const res = await fetch(new URL("/api/auth/update-profile", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json() as { error?: string; user?: NexusUser };
      if (!res.ok) return { error: data.error ?? "فشل التحديث" };
      if (data.user) {
        setUser(data.user);
        await storeUser(data.user);
      }
      return { error: null };
    } catch {
      return { error: "تحقق من اتصالك بالإنترنت" };
    }
  }, [token]);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        const base = getApiUrl();
        await fetch(new URL("/api/auth/logout", base).toString(), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
      } catch {}
    }
    await removeToken();
    setQueryClientToken(null);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo<PhoneAuthContextValue>(() => ({
    user,
    token,
    isReady,
    isAuthenticated: !!token && !!user,
    sendOtp,
    verifyOtp,
    updateProfile,
    signOut,
  }), [user, token, isReady, sendOtp, verifyOtp, updateProfile, signOut]);

  return (
    <PhoneAuthContext.Provider value={value}>
      {children}
    </PhoneAuthContext.Provider>
  );
}

export function usePhoneAuth(): PhoneAuthContextValue {
  const ctx = useContext(PhoneAuthContext);
  if (!ctx) throw new Error("usePhoneAuth must be used within PhoneAuthProvider");
  return ctx;
}
