import type { Express } from "express";
import { Pool } from "pg";
import { requireAuth } from "./authRoutes";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let fxCache: { rates: Record<string, number>; ts: number } | null = null;
let cryptoCache: { data: Record<string, { usd: number; usd_24h_change: number }>; ts: number } | null = null;

const FX_TTL = 5 * 60 * 1000;
const CRYPTO_TTL = 2 * 60 * 1000;

const COINGECKO_IDS = [
  "bitcoin", "ethereum", "solana", "binancecoin", "ripple",
  "dogecoin", "cardano", "avalanche-2", "chainlink", "matic-network",
  "tether", "usd-coin", "polkadot",
];

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB",
  ripple: "XRP", dogecoin: "DOGE", cardano: "ADA", "avalanche-2": "AVAX",
  chainlink: "LINK", "matic-network": "POL", tether: "USDT",
  "usd-coin": "USDC", polkadot: "DOT",
};

async function fetchFxRates(): Promise<Record<string, number>> {
  if (fxCache && Date.now() - fxCache.ts < FX_TTL) return fxCache.rates;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json() as { result: string; rates: Record<string, number> };
    if (json.result === "success" && json.rates) {
      fxCache = { rates: json.rates, ts: Date.now() };
      return json.rates;
    }
  } catch (e) {
    console.warn("[FX] Fetch failed, using cache:", e);
  }
  return fxCache?.rates ?? {};
}

async function fetchCryptoPrices() {
  if (cryptoCache && Date.now() - cryptoCache.ts < CRYPTO_TTL) return cryptoCache.data;
  try {
    const ids = COINGECKO_IDS.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
    if (json && json.bitcoin) {
      cryptoCache = { data: json, ts: Date.now() };
      return json;
    }
  } catch (e) {
    console.warn("[Crypto] Fetch failed, using cache:", e);
  }
  return cryptoCache?.data ?? {};
}

export function registerWalletRoutes(app: Express) {

  app.get("/api/wallet/fx-rates", async (_req, res) => {
    try {
      const rates = await fetchFxRates();
      const isLive = fxCache ? Date.now() - fxCache.ts < FX_TTL : false;
      const pairs = [
        { from: "USD", to: "EUR" }, { from: "USD", to: "GBP" },
        { from: "USD", to: "IQD" }, { from: "USD", to: "AED" },
        { from: "USD", to: "SAR" }, { from: "USD", to: "SYP" },
        { from: "USD", to: "TRY" }, { from: "USD", to: "INR" },
        { from: "USD", to: "EGP" }, { from: "EUR", to: "USD" },
        { from: "EUR", to: "IQD" },
      ];
      const result = pairs.map((p) => {
        const toRate = rates[p.to] ?? null;
        const fromRate = rates[p.from] ?? null;
        let rate = 0;
        if (p.from === "USD" && toRate) rate = toRate;
        else if (p.to === "USD" && fromRate) rate = 1 / fromRate;
        else if (fromRate && toRate) rate = toRate / fromRate;
        return { from: p.from, to: p.to, rate: parseFloat(rate.toFixed(6)), change: 0, isLive };
      });
      res.json({ rates: result, allRates: rates, isLive, updatedAt: fxCache?.ts ?? null });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch FX rates" });
    }
  });

  app.get("/api/wallet/crypto-prices", async (_req, res) => {
    try {
      const prices = await fetchCryptoPrices();
      const isLive = cryptoCache ? Date.now() - cryptoCache.ts < CRYPTO_TTL : false;
      const result = COINGECKO_IDS.map((id) => ({
        id,
        symbol: CRYPTO_SYMBOL_MAP[id] ?? id.toUpperCase(),
        usdPrice: prices[id]?.usd ?? 0,
        change24h: prices[id]?.usd_24h_change ?? 0,
        isLive,
      }));
      res.json({ prices: result, isLive, updatedAt: cryptoCache?.ts ?? null });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch crypto prices" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth as any, async (req: any, res) => {
    try {
      const userId = `user_${req.userId}`;
      const { rows } = await pool.query(
        `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
      res.json({ transactions: rows });
    } catch (err) {
      console.error("[Wallet] GET transactions error:", err);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/wallet/balances", requireAuth as any, async (req: any, res) => {
    try {
      const userId = `user_${req.userId}`;
      const existingRows = await pool.query(
        `SELECT * FROM wallet_balances WHERE user_id = $1 ORDER BY id`,
        [userId]
      );
      if (existingRows.rows.length === 0) {
        await initializeWalletForUser(userId);
        const { rows } = await pool.query(
          `SELECT * FROM wallet_balances WHERE user_id = $1 ORDER BY id`,
          [userId]
        );
        res.json({ balances: rows });
        return;
      }
      res.json({ balances: existingRows.rows });
    } catch (err) {
      console.error("[Wallet] GET balances error:", err);
      res.status(500).json({ error: "Failed to fetch balances" });
    }
  });

  app.post("/api/wallet/send", requireAuth as any, async (req: any, res) => {
    const {
      fromCurrency, amount, recipientName,
      type = "send", label, sub, isRemittance = false,
      providerName, toCurrency,
    } = req.body;
    const userId = `user_${req.userId}`;

    if (!fromCurrency || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid request: missing currency or amount" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: balRows } = await client.query(
        `SELECT balance FROM wallet_balances WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
        [userId, fromCurrency]
      );

      if (!balRows.length || parseFloat(balRows[0].balance) < parseFloat(amount)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Insufficient balance" });
      }

      await client.query(
        `UPDATE wallet_balances SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2 AND currency = $3`,
        [parseFloat(amount), userId, fromCurrency]
      );

      const txLabel = label || (isRemittance ? `${providerName || "Remittance"} Transfer` : `Send to ${recipientName || "User"}`);
      const txSub = sub || (isRemittance ? `To ${recipientName} · ${toCurrency || ""}` : `Internal transfer`);
      const txValue = `-${fromCurrency === "USD" ? "$" : fromCurrency}${parseFloat(amount).toFixed(2)}`;
      const txType = isRemittance ? "remit" : "send";
      const txIcon = "send-outline";

      const { rows: txRows } = await client.query(
        `INSERT INTO wallet_transactions (user_id, type, label, sub, amount, value, icon, positive, currency, raw_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9) RETURNING *`,
        [userId, txType, txLabel, txSub, txValue, txValue, txIcon, fromCurrency, -parseFloat(amount)]
      );

      await client.query("COMMIT");

      const { rows: updatedBalance } = await pool.query(
        `SELECT balance FROM wallet_balances WHERE user_id = $1 AND currency = $2`,
        [userId, fromCurrency]
      );

      res.json({
        success: true,
        transaction: txRows[0],
        newBalance: updatedBalance[0]?.balance ?? 0,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[Wallet] Send error:", err);
      res.status(500).json({ error: "Transaction failed" });
    } finally {
      client.release();
    }
  });

  app.post("/api/wallet/receive", requireAuth as any, async (req: any, res) => {
    const { currency, amount, fromUser } = req.body;
    const userId = `user_${req.userId}`;
    if (!currency || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }
    try {
      await pool.query(
        `UPDATE wallet_balances SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2 AND currency = $3`,
        [parseFloat(amount), userId, currency]
      );
      const { rows } = await pool.query(
        `INSERT INTO wallet_transactions (user_id, type, label, sub, amount, value, icon, positive, currency, raw_amount)
         VALUES ($1, 'receive', $2, $3, $4, $5, 'arrow-down-outline', true, $6, $7) RETURNING *`,
        [
          userId,
          `Received from ${fromUser || "User"}`,
          `${currency} deposit`,
          `+${amount} ${currency}`,
          `+${amount} ${currency}`,
          currency,
          parseFloat(amount),
        ]
      );
      res.json({ success: true, transaction: rows[0] });
    } catch (err) {
      console.error("[Wallet] Receive error:", err);
      res.status(500).json({ error: "Failed to record receipt" });
    }
  });

  app.post("/api/wallet/convert", requireAuth as any, async (req: any, res) => {
    const { fromCurrency, toCurrency, amount } = req.body;
    const userId = `user_${req.userId}`;
    if (!fromCurrency || !toCurrency || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid request" });
    }
    try {
      const rates = await fetchFxRates();
      const fromRate = rates[fromCurrency] ?? 1;
      const toRate = rates[toCurrency] ?? 1;
      const converted = (parseFloat(amount) / fromRate) * toRate;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const { rows: balRows } = await client.query(
          `SELECT balance FROM wallet_balances WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
          [userId, fromCurrency]
        );
        if (!balRows.length || parseFloat(balRows[0].balance) < parseFloat(amount)) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Insufficient balance" });
        }
        await client.query(
          `UPDATE wallet_balances SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2 AND currency = $3`,
          [parseFloat(amount), userId, fromCurrency]
        );
        await client.query(
          `INSERT INTO wallet_balances (user_id, currency, symbol, flag, balance, color, region)
           VALUES ($1, $2, $2, '🏳', $3, '#9B59B6', 'Other')
           ON CONFLICT (user_id, currency) DO UPDATE SET balance = wallet_balances.balance + EXCLUDED.balance, updated_at = NOW()`,
          [userId, toCurrency, converted]
        );
        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, label, sub, amount, value, icon, positive, currency, raw_amount)
           VALUES ($1, 'fx', $2, $3, $4, $5, 'swap-horizontal-outline', true, $6, $7)`,
          [
            userId,
            `FX Conversion`,
            `${fromCurrency} → ${toCurrency} @ ${(toRate / fromRate).toFixed(4)}`,
            `${amount} ${fromCurrency}`,
            `${converted.toFixed(2)} ${toCurrency}`,
            fromCurrency,
            parseFloat(amount),
          ]
        );
        await client.query("COMMIT");
        res.json({ success: true, converted: converted.toFixed(4), rate: (toRate / fromRate).toFixed(6) });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("[Wallet] Convert error:", err);
      res.status(500).json({ error: "Conversion failed" });
    }
  });
}

async function initializeWalletForUser(userId: string): Promise<void> {
  const defaultBalances = [
    { currency: "USD", symbol: "$", flag: "🇺🇸", balance: 1000.00, color: "#27AE60", region: "North America" },
    { currency: "EUR", symbol: "€", flag: "🇪🇺", balance: 500.00, color: "#2980B9", region: "Europe" },
    { currency: "IQD", symbol: "IQ", flag: "🇮🇶", balance: 250000, color: "#E67E22", region: "Middle East" },
    { currency: "AED", symbol: "AED", flag: "🇦🇪", balance: 1000.00, color: "#8E44AD", region: "Middle East" },
  ];
  for (const b of defaultBalances) {
    await pool.query(
      `INSERT INTO wallet_balances (user_id, currency, symbol, flag, balance, color, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [userId, b.currency, b.symbol, b.flag, b.balance, b.color, b.region]
    );
  }
}
