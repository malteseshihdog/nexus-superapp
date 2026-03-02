import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { registerWalletRoutes } from "./walletRoutes";
import { registerAuthRoutes, requireAuth } from "./authRoutes";
import { pool } from "./db";

interface SignalingClient {
  ws: WebSocket;
  peerId: string;
  roomId: string;
}

const rooms = new Map<string, Map<string, SignalingClient>>();

function broadcastToRoom(roomId: string, message: object, excludePeerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  room.forEach((client) => {
    if (client.peerId !== excludePeerId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function sendToPeer(roomId: string, targetPeerId: string, message: object) {
  const room = rooms.get(roomId);
  if (!room) return;
  const target = room.get(targetPeerId);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify(message));
  }
}

function setupSignaling(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/signal" });

  wss.on("connection", (ws) => {
    let currentPeerId = "";
    let currentRoomId = "";

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "join": {
            const { roomId, peerId } = msg;
            currentPeerId = peerId;
            currentRoomId = roomId;

            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Map());
            }
            const room = rooms.get(roomId)!;

            room.set(peerId, { ws, peerId, roomId });

            room.forEach((client) => {
              if (client.peerId !== peerId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ type: "peer-joined", peerId }));
                ws.send(JSON.stringify({ type: "peer-joined", peerId: client.peerId }));
              }
            });
            break;
          }

          case "offer": {
            const { to, from, sdp, roomId } = msg;
            sendToPeer(roomId || currentRoomId, to, { type: "offer", sdp, from });
            break;
          }

          case "answer": {
            const { to, from, sdp } = msg;
            sendToPeer(currentRoomId, to, { type: "answer", sdp, from });
            break;
          }

          case "ice-candidate": {
            const { to, from, candidate } = msg;
            sendToPeer(currentRoomId, to, { type: "ice-candidate", candidate, from });
            break;
          }

          case "leave": {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.delete(currentPeerId);
              if (room.size === 0) rooms.delete(currentRoomId);
              else broadcastToRoom(currentRoomId, { type: "peer-left", peerId: currentPeerId });
            }
            break;
          }
        }
      } catch (e) {
        console.warn("[Signaling] Parse error:", e);
      }
    });

    ws.on("close", () => {
      if (currentPeerId && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.delete(currentPeerId);
          if (room.size === 0) rooms.delete(currentRoomId);
          else broadcastToRoom(currentRoomId, { type: "peer-left", peerId: currentPeerId }, currentPeerId);
        }
      }
    });
  });

  console.log("[Signaling] WebRTC WebSocket server listening on /ws/signal");
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/config", (_req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
    res.json({
      supabaseUrl,
      supabaseAnonKey,
      configured: supabaseUrl.length > 0 && supabaseAnonKey.length > 0,
    });
  });

  app.get("/api/peep/schema", (_req, res) => {
    res.json({
      schema: `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- peep_profiles: one row per user
CREATE TABLE IF NOT EXISTS peep_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peep_username TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_color  TEXT DEFAULT '#E67E22',
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- peep_posts: main timeline table
CREATE TABLE IF NOT EXISTS peep_posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id      UUID REFERENCES peep_profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL CHECK (char_length(content) <= 280),
  media_url      TEXT,
  media_type     TEXT CHECK (media_type IN ('image','video','4k')),
  is_live        BOOLEAN DEFAULT FALSE,
  stream_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- peep_likes: many-to-many
CREATE TABLE IF NOT EXISTS peep_likes (
  post_id    UUID REFERENCES peep_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES peep_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- peep_retweets
CREATE TABLE IF NOT EXISTS peep_retweets (
  post_id    UUID REFERENCES peep_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES peep_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- peep_replies
CREATE TABLE IF NOT EXISTS peep_replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES peep_posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES peep_profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE peep_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE peep_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE peep_retweets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE peep_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE peep_profiles  ENABLE ROW LEVEL SECURITY;

-- RLS Policies: public read, authenticated write
CREATE POLICY "Public read peep_posts"     ON peep_posts     FOR SELECT USING (true);
CREATE POLICY "Auth insert peep_posts"     ON peep_posts     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Own delete peep_posts"      ON peep_posts     FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Public read peep_likes"     ON peep_likes     FOR SELECT USING (true);
CREATE POLICY "Auth manage peep_likes"     ON peep_likes     FOR ALL  USING (user_id = auth.uid());

CREATE POLICY "Public read peep_retweets"  ON peep_retweets  FOR SELECT USING (true);
CREATE POLICY "Auth manage peep_retweets"  ON peep_retweets  FOR ALL  USING (user_id = auth.uid());

CREATE POLICY "Public read peep_replies"   ON peep_replies   FOR SELECT USING (true);
CREATE POLICY "Auth insert peep_replies"   ON peep_replies   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public read peep_profiles"  ON peep_profiles  FOR SELECT USING (true);
CREATE POLICY "Own update peep_profiles"   ON peep_profiles  FOR UPDATE USING (id = auth.uid());
      `,
    });
  });

  app.get("/api/peep/live/sessions", (_req, res) => {
    res.json({
      sessions: [
        {
          id: "ls1",
          peep_username: "@nexus_ai",
          title: "AI & the Future — Live Q&A",
          viewers: 12480,
          quality: "4K UHD",
          language: "en",
          started_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        },
        {
          id: "ls2",
          peep_username: "@stream4k_studio",
          title: "4K Streaming Pipeline Demo",
          viewers: 4320,
          quality: "4K UHD",
          language: "en",
          started_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        },
      ],
    });
  });

  registerAuthRoutes(app);
  registerWalletRoutes(app);
  registerChatRoutes(app);
  registerPeepRoutes(app);

  const httpServer = createServer(app);
  setupSignaling(httpServer);
  return httpServer;
}

function registerChatRoutes(app: Express): void {
  app.get("/api/chat/conversations", requireAuth as any, async (req: any, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.id, c.last_message, c.last_message_at,
                CASE WHEN c.user1_id = $1 THEN u2.id ELSE u1.id END AS other_user_id,
                CASE WHEN c.user1_id = $1 THEN u2.name ELSE u1.name END AS other_user_name,
                CASE WHEN c.user1_id = $1 THEN u2.avatar_emoji ELSE u1.avatar_emoji END AS other_user_avatar,
                CASE WHEN c.user1_id = $1 THEN u2.phone ELSE u1.phone END AS other_user_phone,
                (SELECT COUNT(*) FROM nexus_messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.read = false) AS unread_count
         FROM nexus_conversations c
         JOIN nexus_users u1 ON u1.id = c.user1_id
         JOIN nexus_users u2 ON u2.id = c.user2_id
         WHERE c.user1_id = $1 OR c.user2_id = $1
         ORDER BY c.last_message_at DESC`,
        [req.userId]
      );
      res.json({ conversations: rows });
    } catch (err) {
      console.error("[Chat] Get conversations error:", err);
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/chat/messages/:conversationId", requireAuth as any, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { rows } = await pool.query(
        `SELECT m.id, m.content, m.type, m.read, m.created_at,
                m.sender_id,
                u.name AS sender_name, u.avatar_emoji AS sender_avatar
         FROM nexus_messages m
         JOIN nexus_users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [conversationId]
      );
      await pool.query(
        "UPDATE nexus_messages SET read = true WHERE conversation_id = $1 AND sender_id != $2",
        [conversationId, req.userId]
      );
      res.json({ messages: rows });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/chat/messages", requireAuth as any, async (req: any, res) => {
    const { conversation_id, content, type = "text" } = req.body as {
      conversation_id?: number;
      content?: string;
      type?: string;
    };
    if (!conversation_id || !content?.trim()) {
      res.status(400).json({ error: "conversation_id و content مطلوبان" });
      return;
    }
    try {
      const { rows } = await pool.query(
        "INSERT INTO nexus_messages (conversation_id, sender_id, content, type) VALUES ($1, $2, $3, $4) RETURNING *",
        [conversation_id, req.userId, content.trim(), type]
      );
      await pool.query(
        "UPDATE nexus_conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2",
        [content.trim(), conversation_id]
      );
      res.json({ message: rows[0] });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/chat/conversations", requireAuth as any, async (req: any, res) => {
    const { other_phone } = req.body as { other_phone?: string };
    if (!other_phone) { res.status(400).json({ error: "other_phone مطلوب" }); return; }
    try {
      const otherUser = await pool.query<{ id: number }>(
        "SELECT id FROM nexus_users WHERE phone = $1",
        [other_phone.replace(/\s+/g, "").trim()]
      );
      if (otherUser.rows.length === 0) {
        res.status(404).json({ error: "المستخدم غير مسجل في NEXUS" });
        return;
      }
      const otherId = otherUser.rows[0].id;
      const minId = Math.min(req.userId, otherId);
      const maxId = Math.max(req.userId, otherId);
      const existing = await pool.query(
        "SELECT id FROM nexus_conversations WHERE user1_id = $1 AND user2_id = $2",
        [minId, maxId]
      );
      if (existing.rows.length > 0) {
        res.json({ conversation_id: existing.rows[0].id, existed: true });
        return;
      }
      const { rows } = await pool.query(
        "INSERT INTO nexus_conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id",
        [minId, maxId]
      );
      res.json({ conversation_id: rows[0].id, existed: false });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });
}

function registerPeepRoutes(app: Express): void {
  app.get("/api/peep/feed", async (req: any, res) => {
    try {
      const userId = req.headers.authorization ? await getUserIdFromToken(req.headers.authorization.slice(7)) : null;
      const { rows } = await pool.query(
        `SELECT p.id, p.content, p.media_url, p.likes_count, p.comments_count, p.reposts_count, p.created_at,
                u.name AS author_name, u.avatar_emoji AS author_avatar, u.username AS author_username,
                ${userId ? `EXISTS(SELECT 1 FROM nexus_likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) AS liked_by_me` : "false AS liked_by_me"}
         FROM nexus_posts p
         JOIN nexus_users u ON u.id = p.user_id
         ORDER BY p.created_at DESC
         LIMIT 50`
      );
      res.json({ posts: rows });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/peep/posts", requireAuth as any, async (req: any, res) => {
    const { content, media_url } = req.body as { content?: string; media_url?: string };
    if (!content?.trim()) { res.status(400).json({ error: "المحتوى مطلوب" }); return; }
    if (content.trim().length > 280) { res.status(400).json({ error: "الحد الأقصى 280 حرفاً" }); return; }
    try {
      const { rows } = await pool.query(
        "INSERT INTO nexus_posts (user_id, content, media_url) VALUES ($1, $2, $3) RETURNING *",
        [req.userId, content.trim(), media_url || null]
      );
      const post = await pool.query(
        `SELECT p.*, u.name AS author_name, u.avatar_emoji AS author_avatar, u.username AS author_username
         FROM nexus_posts p JOIN nexus_users u ON u.id = p.user_id WHERE p.id = $1`,
        [rows[0].id]
      );
      res.json({ post: post.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/peep/posts/:id/like", requireAuth as any, async (req: any, res) => {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) { res.status(400).json({ error: "معرّف المنشور غير صالح" }); return; }
    try {
      const existing = await pool.query(
        "SELECT id FROM nexus_likes WHERE user_id = $1 AND post_id = $2",
        [req.userId, postId]
      );
      if (existing.rows.length > 0) {
        await pool.query("DELETE FROM nexus_likes WHERE user_id = $1 AND post_id = $2", [req.userId, postId]);
        await pool.query("UPDATE nexus_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1", [postId]);
        res.json({ liked: false });
      } else {
        await pool.query("INSERT INTO nexus_likes (user_id, post_id) VALUES ($1, $2)", [req.userId, postId]);
        await pool.query("UPDATE nexus_posts SET likes_count = likes_count + 1 WHERE id = $1", [postId]);
        res.json({ liked: true });
      }
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.delete("/api/peep/posts/:id", requireAuth as any, async (req: any, res) => {
    const postId = parseInt(req.params.id);
    try {
      await pool.query("DELETE FROM nexus_posts WHERE id = $1 AND user_id = $2", [postId, req.userId]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });
}

async function getUserIdFromToken(token: string): Promise<number | null> {
  try {
    const { rows } = await pool.query<{ user_id: number; expires_at: Date }>(
      "SELECT user_id, expires_at FROM nexus_sessions WHERE token = $1",
      [token]
    );
    if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) return null;
    return rows[0].user_id;
  } catch {
    return null;
  }
}
