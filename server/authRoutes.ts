import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "nexus-super-secret-2025";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyToken(token: string): number | null {
  try {
    const result = pool.query<{ user_id: number; expires_at: Date }>(
      "SELECT user_id, expires_at FROM nexus_sessions WHERE token = $1",
      [token]
    );
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request & { userId?: number; userPhone?: string },
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const result = await pool.query<{ user_id: number; phone: string; expires_at: Date }>(
      `SELECT s.user_id, u.phone, s.expires_at
       FROM nexus_sessions s
       JOIN nexus_users u ON u.id = s.user_id
       WHERE s.token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "الجلسة غير صالحة" });
      return;
    }
    const session = result.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      res.status(401).json({ error: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً" });
      return;
    }
    req.userId = session.user_id;
    req.userPhone = session.phone;
    next();
  } catch (err) {
    console.error("[Auth] Token verification error:", err);
    res.status(500).json({ error: "خطأ في التحقق من الجلسة" });
  }
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/send-otp", async (req, res) => {
    const { phone } = req.body as { phone?: string };
    if (!phone || phone.trim().length < 7) {
      res.status(400).json({ error: "رقم الهاتف غير صالح" });
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, "").trim();
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await pool.query(
        "DELETE FROM nexus_otps WHERE phone = $1 AND used = false",
        [cleanPhone]
      );

      await pool.query(
        "INSERT INTO nexus_otps (phone, code, expires_at) VALUES ($1, $2, $3)",
        [cleanPhone, code, expiresAt]
      );

      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (twilioAccountSid && twilioAuthToken && twilioPhone) {
        try {
          const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Authorization": `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: cleanPhone,
                From: twilioPhone,
                Body: `كود تفعيل NEXUS: ${code}\n\nصالح لمدة 10 دقائق. لا تشارك هذا الكود مع أحد.`,
              }).toString(),
            }
          );

          if (!twilioRes.ok) {
            const errBody = await twilioRes.text();
            console.error("[Twilio] SMS failed:", errBody);
            res.status(500).json({ error: "فشل إرسال الرسالة النصية" });
            return;
          }

          console.log(`[Auth] OTP sent via Twilio to ${cleanPhone}`);
          res.json({ success: true, message: "تم إرسال كود التفعيل إلى هاتفك" });
        } catch (twilioErr) {
          console.error("[Twilio] Error:", twilioErr);
          res.status(500).json({ error: "فشل إرسال الرسالة النصية" });
        }
      } else {
        console.log(`[Auth DEV] OTP for ${cleanPhone}: ${code}`);
        res.json({
          success: true,
          message: "تم إنشاء كود التفعيل (وضع التطوير)",
          dev_code: code,
        });
      }
    } catch (err) {
      console.error("[Auth] Send OTP error:", err);
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phone, code, name } = req.body as {
      phone?: string;
      code?: string;
      name?: string;
    };

    if (!phone || !code) {
      res.status(400).json({ error: "رقم الهاتف والكود مطلوبان" });
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, "").trim();

    try {
      const otpResult = await pool.query<{
        id: number;
        code: string;
        expires_at: Date;
        used: boolean;
      }>(
        "SELECT id, code, expires_at, used FROM nexus_otps WHERE phone = $1 AND used = false ORDER BY created_at DESC LIMIT 1",
        [cleanPhone]
      );

      if (otpResult.rows.length === 0) {
        res.status(400).json({ error: "كود غير صالح أو منتهي الصلاحية" });
        return;
      }

      const otp = otpResult.rows[0];

      if (new Date(otp.expires_at) < new Date()) {
        res.status(400).json({ error: "انتهت صلاحية الكود، اطلب كوداً جديداً" });
        return;
      }

      if (otp.code !== code.trim()) {
        res.status(400).json({ error: "كود خاطئ، حاول مرة أخرى" });
        return;
      }

      await pool.query("UPDATE nexus_otps SET used = true WHERE id = $1", [otp.id]);

      let user = await pool.query<{
        id: number;
        phone: string;
        name: string;
        avatar_emoji: string;
        username: string;
      }>(
        "SELECT id, phone, name, avatar_emoji, username FROM nexus_users WHERE phone = $1",
        [cleanPhone]
      );

      let userId: number;
      let isNew = false;

      if (user.rows.length === 0) {
        const emojis = ["😊", "🔥", "⚡", "🌟", "💎", "🦁", "🐯", "🦊", "🐧", "🎯"];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const displayName = name?.trim() || `مستخدم NEXUS`;
        const newUser = await pool.query<{ id: number }>(
          "INSERT INTO nexus_users (phone, name, avatar_emoji, verified) VALUES ($1, $2, $3, true) RETURNING id",
          [cleanPhone, displayName, emoji]
        );
        userId = newUser.rows[0].id;
        isNew = true;
      } else {
        userId = user.rows[0].id;
        if (name?.trim()) {
          await pool.query(
            "UPDATE nexus_users SET name = $1, updated_at = NOW() WHERE id = $2",
            [name.trim(), userId]
          );
        }
      }

      const token = generateToken();
      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO nexus_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [userId, token, sessionExpiry]
      );

      const freshUser = await pool.query<{
        id: number;
        phone: string;
        name: string;
        avatar_emoji: string;
        username: string;
        bio: string;
      }>(
        "SELECT id, phone, name, avatar_emoji, username, bio FROM nexus_users WHERE id = $1",
        [userId]
      );

      res.json({
        success: true,
        token,
        user: freshUser.rows[0],
        isNew,
      });
    } catch (err) {
      console.error("[Auth] Verify OTP error:", err);
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.get("/api/auth/me", requireAuth as any, async (req: any, res) => {
    try {
      const result = await pool.query(
        "SELECT id, phone, name, avatar_emoji, username, bio, created_at FROM nexus_users WHERE id = $1",
        [req.userId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "المستخدم غير موجود" });
        return;
      }
      res.json({ user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/update-profile", requireAuth as any, async (req: any, res) => {
    const { name, username, bio, avatar_emoji } = req.body as {
      name?: string;
      username?: string;
      bio?: string;
      avatar_emoji?: string;
    };
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
      if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
      if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio); }
      if (avatar_emoji !== undefined) { fields.push(`avatar_emoji = $${idx++}`); values.push(avatar_emoji); }
      if (fields.length === 0) { res.status(400).json({ error: "لا توجد حقول للتحديث" }); return; }
      fields.push(`updated_at = NOW()`);
      values.push(req.userId);
      await pool.query(
        `UPDATE nexus_users SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
      const updated = await pool.query(
        "SELECT id, phone, name, avatar_emoji, username, bio FROM nexus_users WHERE id = $1",
        [req.userId]
      );
      res.json({ user: updated.rows[0] });
    } catch (err: any) {
      if (err.code === "23505") {
        res.status(400).json({ error: "اسم المستخدم مستخدم بالفعل" });
      } else {
        res.status(500).json({ error: "خطأ في الخادم" });
      }
    }
  });

  app.post("/api/auth/logout", requireAuth as any, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.slice(7);
      await pool.query("DELETE FROM nexus_sessions WHERE token = $1", [token]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });
}
