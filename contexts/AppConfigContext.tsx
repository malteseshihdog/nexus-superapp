import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { initSupabase, AppConfig } from "@/lib/supabase";
import { getApiUrl } from "@/lib/query-client";

interface AppConfigContextValue {
  config: AppConfig | null;
  isLoading: boolean;
  isConfigured: boolean;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

const DEFAULT_CONFIG: AppConfig = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  configured: false,
};

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const apiUrl = getApiUrl();
        const url = new URL("/api/config", apiUrl);
        const res = await fetch(url.toString(), { credentials: "include" });
        if (res.ok) {
          const data: AppConfig = await res.json();
          initSupabase(data);
          setConfig(data);
        } else {
          initSupabase(DEFAULT_CONFIG);
          setConfig(DEFAULT_CONFIG);
        }
      } catch {
        initSupabase(DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const value = useMemo(
    () => ({
      config,
      isLoading,
      isConfigured: config?.configured ?? false,
    }),
    [config, isLoading]
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppConfigProvider");
  return ctx;
}
