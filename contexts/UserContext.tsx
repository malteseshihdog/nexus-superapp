import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "nexus_user_id";
const USER_NAME_KEY = "nexus_user_name";
const GHOST_USERNAME_KEY = "nexus_ghost_username";
const GHOST_MODE_KEY = "nexus_ghost_mode";
const GHOST_BIO_KEY = "nexus_ghost_bio";
const AVATAR_URI_KEY = "nexus_avatar_uri";
const AVATAR_EMOJI_KEY = "nexus_avatar_emoji";

function generateUserId(): string {
  return (
    "user_" +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
}

interface UserContextValue {
  userId: string;
  userName: string;
  ghostUsername: string;
  ghostBio: string;
  isGhostMode: boolean;
  isReady: boolean;
  avatarUri: string | null;
  avatarEmoji: string;
  setGhostUsername: (name: string) => Promise<void>;
  setGhostBio: (bio: string) => Promise<void>;
  setIsGhostMode: (val: boolean) => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
  setAvatarEmoji: (emoji: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Me");
  const [ghostUsername, setGhostUsernameState] = useState("Nexus_User");
  const [ghostBio, setGhostBioState] = useState("");
  const [isGhostMode, setIsGhostModeState] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [avatarEmoji, setAvatarEmojiState] = useState("👻");

  useEffect(() => {
    async function loadOrCreateUser() {
      try {
        let id = await AsyncStorage.getItem(USER_ID_KEY);
        if (!id) {
          id = generateUserId();
          await AsyncStorage.setItem(USER_ID_KEY, id);
        }
        const name = await AsyncStorage.getItem(USER_NAME_KEY);
        const ghost = await AsyncStorage.getItem(GHOST_USERNAME_KEY);
        const ghostMode = await AsyncStorage.getItem(GHOST_MODE_KEY);
        const bio = await AsyncStorage.getItem(GHOST_BIO_KEY);
        const uri = await AsyncStorage.getItem(AVATAR_URI_KEY);
        const emoji = await AsyncStorage.getItem(AVATAR_EMOJI_KEY);
        setUserId(id);
        setUserName(name ?? "Me");
        setGhostUsernameState(ghost ?? "Nexus_User");
        setGhostBioState(bio ?? "");
        setIsGhostModeState(ghostMode !== "false");
        setAvatarUriState(uri ?? null);
        setAvatarEmojiState(emoji ?? "👻");
      } catch {
        setUserId(generateUserId());
        setUserName("Me");
      } finally {
        setIsReady(true);
      }
    }
    loadOrCreateUser();
  }, []);

  const setGhostUsername = useCallback(async (name: string) => {
    const clean = name.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "").slice(0, 30);
    setGhostUsernameState(clean);
    await AsyncStorage.setItem(GHOST_USERNAME_KEY, clean);
    await AsyncStorage.setItem(USER_NAME_KEY, clean);
  }, []);

  const setGhostBio = useCallback(async (bio: string) => {
    setGhostBioState(bio);
    await AsyncStorage.setItem(GHOST_BIO_KEY, bio);
  }, []);

  const setIsGhostMode = useCallback(async (val: boolean) => {
    setIsGhostModeState(val);
    await AsyncStorage.setItem(GHOST_MODE_KEY, val ? "true" : "false");
  }, []);

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) {
      await AsyncStorage.setItem(AVATAR_URI_KEY, uri);
    } else {
      await AsyncStorage.removeItem(AVATAR_URI_KEY);
    }
  }, []);

  const setAvatarEmoji = useCallback(async (emoji: string) => {
    setAvatarEmojiState(emoji);
    await AsyncStorage.setItem(AVATAR_EMOJI_KEY, emoji);
  }, []);

  const value = useMemo(
    () => ({
      userId,
      userName,
      ghostUsername,
      ghostBio,
      isGhostMode,
      isReady,
      avatarUri,
      avatarEmoji,
      setGhostUsername,
      setGhostBio,
      setIsGhostMode,
      setAvatarUri,
      setAvatarEmoji,
    }),
    [userId, userName, ghostUsername, ghostBio, isGhostMode, isReady, avatarUri, avatarEmoji, setGhostUsername, setGhostBio, setIsGhostMode, setAvatarUri, setAvatarEmoji]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider");
  return ctx;
}
