import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient, RealtimeChannel, Session, User } from "@supabase/supabase-js";
import { Platform } from "react-native";

// ============================================================
// CLIENT INITIALIZATION
// ============================================================
export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  configured: boolean;
}

let _supabase: SupabaseClient | null = null;
let _currentUrl = "";

export function initSupabase(config: AppConfig): SupabaseClient {
  const url = config.configured ? config.supabaseUrl : "https://placeholder.supabase.co";
  const key = config.configured ? config.supabaseAnonKey : "placeholder";

  // Avoid creating a duplicate client if URL hasn't changed
  if (_supabase && _currentUrl === url) return _supabase;

  _currentUrl = url;
  _supabase = createClient(url, key, {
    auth: {
      storage: Platform.OS !== "web" ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _supabase;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _currentUrl = "https://placeholder.supabase.co";
    _supabase = createClient(_currentUrl, "placeholder");
  }
  return _supabase;
}

// ============================================================
// TYPES — مطابق للـ schema.sql
// ============================================================
export interface Profile {
  id: string;
  peep_username: string;
  avatar_url: string | null;
  avatar_emoji: string;
  bio: string | null;
  is_verified: boolean;
  is_ghost: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  message_type: "text" | "image" | "video" | "audio" | "file";
  read_at: string | null;
  created_at: string;
}

export interface PeepPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | "4k" | null;
  language: string;
  is_live: boolean;
  stream_url: string | null;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  created_at: string;
  profiles?: Pick<Profile, "peep_username" | "avatar_emoji" | "is_verified">;
}

// ============================================================
// AUTH — Anonymous Ghost Sign-In
// ============================================================
export async function signInAnonymously(): Promise<{ session: Session | null; user: User | null; error: Error | null }> {
  try {
    const { data, error } = await getSupabase().auth.signInAnonymously();
    if (error) return { session: null, user: null, error };
    return { session: data.session, user: data.user, error: null };
  } catch (err) {
    return { session: null, user: null, error: err as Error };
  }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
}

// ============================================================
// PROFILES — الهوية السيادية
// ============================================================
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertProfile(profile: {
  id: string;
  peep_username: string;
  avatar_emoji?: string;
  bio?: string | null;
  is_ghost?: boolean;
}): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    console.error("upsertProfile error:", error.message);
    return null;
  }
  return data;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("peep_username", username)
    .single();
  return data ?? null;
}

// ============================================================
// PRIVATE MESSAGES — رسائل مشفرة بين مستخدمين
// ============================================================
export async function fetchMessages(
  myId: string,
  otherId: string,
  limit = 50
): Promise<PrivateMessage[]> {
  const { data, error } = await getSupabase()
    .from("private_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("fetchMessages error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  messageType: PrivateMessage["message_type"] = "text"
): Promise<PrivateMessage | null> {
  const { data, error } = await getSupabase()
    .from("private_messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content, message_type: messageType })
    .select()
    .single();
  if (error) {
    console.error("sendMessage error:", error.message);
    return null;
  }
  return data;
}

export async function markAsRead(myId: string, senderId: string): Promise<void> {
  await getSupabase()
    .from("private_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", myId)
    .eq("sender_id", senderId)
    .is("read_at", null);
}

export function subscribeToMessages(
  myId: string,
  otherId: string,
  onMessage: (msg: PrivateMessage) => void
): RealtimeChannel {
  const roomId = [myId, otherId].sort().join(":");
  return getSupabase()
    .channel(`dm:${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "private_messages" },
      (payload) => {
        const msg = payload.new as PrivateMessage;
        const relevant = (msg.sender_id === myId && msg.receiver_id === otherId)
          || (msg.sender_id === otherId && msg.receiver_id === myId);
        if (relevant) onMessage(msg);
      }
    )
    .subscribe();
}

// ============================================================
// PEEP POSTS — التغريدات والمنشورات
// ============================================================
export async function fetchPeepFeed(limit = 30, offset = 0): Promise<PeepPost[]> {
  const { data, error } = await getSupabase()
    .from("peep_posts")
    .select("*, profiles(peep_username, avatar_emoji, is_verified)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("fetchPeepFeed error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createPeepPost(post: {
  user_id: string;
  content: string;
  media_url?: string;
  language?: string;
  is_live?: boolean;
}): Promise<PeepPost | null> {
  const { data, error } = await getSupabase()
    .from("peep_posts")
    .insert(post)
    .select()
    .single();
  if (error) {
    console.error("createPeepPost error:", error.message);
    return null;
  }
  return data;
}

export async function toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void> {
  if (isLiked) {
    await getSupabase().from("peep_likes").delete().match({ post_id: postId, user_id: userId });
    await getSupabase().rpc("decrement_likes", { post_id: postId });
  } else {
    await getSupabase().from("peep_likes").insert({ post_id: postId, user_id: userId });
    await getSupabase().rpc("increment_likes", { post_id: postId });
  }
}

export async function toggleRetweet(postId: string, userId: string, isRetweeted: boolean): Promise<void> {
  if (isRetweeted) {
    await getSupabase().from("peep_retweets").delete().match({ post_id: postId, user_id: userId });
  } else {
    await getSupabase().from("peep_retweets").insert({ post_id: postId, user_id: userId });
    await getSupabase().rpc("increment_retweets", { post_id: postId });
  }
}

export function subscribeToPeepFeed(onPost: (post: PeepPost) => void): RealtimeChannel {
  return getSupabase()
    .channel("peep:feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "peep_posts" },
      (payload) => onPost(payload.new as PeepPost)
    )
    .subscribe();
}
