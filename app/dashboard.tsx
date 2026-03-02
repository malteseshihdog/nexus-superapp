import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { FIAT_ACCOUNTS } from "@/constants/walletData";
import { POSTS, CRYPTO_ASSETS } from "@/constants/mockData";

// ── Computed totals ──────────────────────────────────────────
const FX_TO_USD: Record<string, number> = { USD: 1, EUR: 1.0848, IQD: 0.000763, SYP: 0.0000775 };
const totalFiat = FIAT_ACCOUNTS.reduce((s, a) => s + a.balance * (FX_TO_USD[a.currency] ?? 0), 0);
const totalCrypto = CRYPTO_ASSETS.reduce((s, a) => s + a.holdings * a.price, 0);
const totalPortfolio = totalFiat + totalCrypto;

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// ── Pulsing glow component ───────────────────────────────────
function GhostGlow({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!active) { anim.setValue(0.1); return; }
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 1400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [active]);
  return (
    <Animated.View
      style={[styles.ghostGlow, { opacity: anim, backgroundColor: active ? COLORS.orange : "#444" }]}
    />
  );
}

// ── Quick action button ──────────────────────────────────────
function QuickAction({
  icon, label, onPress, accent,
}: { icon: string; label: string; onPress: () => void; accent?: string }) {
  return (
    <TouchableOpacity style={styles.qaBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.qaIcon, { backgroundColor: (accent ?? COLORS.orange) + "22" }]}>
        <Ionicons name={icon as any} size={22} color={accent ?? COLORS.orange} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { ghostUsername, isGhostMode } = useCurrentUser();
  const { maskedIp, isGhostMode: tunnelActive } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [satCount] = useState(12);
  const [esimActive] = useState(true);
  const [tick, setTick] = useState(0);

  // Rotate displayed balance tickers every 4s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const peepPreviews = POSTS.slice(0, 2);

  return (
    <StarryBackground>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEXUS Hub</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/profile")}>
          <Ionicons name="person-circle-outline" size={26} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
      >
        {/* ── 1. Identity Header ──────────────────────────────── */}
        <View style={styles.identityCard}>
          <LinearGradient
            colors={["#0D0D1A", "#1A0D04"]}
            style={styles.identityGrad}
          >
            <View style={styles.identityLeft}>
              <View style={styles.avatarWrap}>
                <GhostGlow active={isGhostMode} />
                <LinearGradient
                  colors={isGhostMode ? [COLORS.orange, "#D35400"] : ["#2A2A2A", "#1A1A1A"]}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarEmoji}>👻</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeText}>مرحباً بك يا شبح 🛡️</Text>
                <Text style={styles.usernameText}>@{ghostUsername || "ghost_user"}</Text>
                <View style={[styles.tunnelBadge, { backgroundColor: isGhostMode ? "rgba(39,174,96,0.15)" : "rgba(231,76,60,0.12)" }]}>
                  <View style={[styles.tunnelDot, { backgroundColor: isGhostMode ? COLORS.success : COLORS.danger }]} />
                  <Text style={[styles.tunnelText, { color: isGhostMode ? COLORS.success : COLORS.danger }]}>
                    {isGhostMode ? `Ghost Tunnel: Active 🛰️` : "Ghost Tunnel: Inactive"}
                  </Text>
                </View>
              </View>
            </View>
            {isGhostMode && (
              <View style={styles.ipBadge}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.orange} />
                <Text style={styles.ipText}>{maskedIp}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ── 2. Portfolio Value ───────────────────────────────── */}
        <View style={styles.portfolioCard}>
          <LinearGradient colors={["#1A0D04", "#0D0A00"]} style={styles.portfolioGrad}>
            <Text style={styles.portfolioLabel}>إجمالي المحفظة الهايبرد 💳</Text>
            <Text style={styles.portfolioTotal}>{fmt(totalPortfolio)}</Text>
            <View style={styles.portfolioRow}>
              {FIAT_ACCOUNTS.slice(0, 3).map((a) => (
                <View key={a.id} style={styles.portfolioChip}>
                  <Text style={styles.portfolioChipFlag}>{a.flag}</Text>
                  <Text style={styles.portfolioChipVal}>
                    {a.symbol}{a.balance >= 1_000_000
                      ? `${(a.balance / 1_000_000).toFixed(1)}M`
                      : a.balance >= 1_000
                      ? `${(a.balance / 1_000).toFixed(1)}K`
                      : a.balance.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.cryptoRow}>
              {CRYPTO_ASSETS.slice(0, 4).map((c) => (
                <View key={c.id} style={styles.cryptoChip}>
                  <Text style={[styles.cryptoSym, { color: c.color }]}>{c.symbol}</Text>
                  <Text style={styles.cryptoHold}>{c.holdings < 1 ? c.holdings.toFixed(3) : c.holdings.toFixed(1)}</Text>
                  <Text style={[styles.cryptoChange, { color: c.change24h >= 0 ? COLORS.success : COLORS.danger }]}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.walletBtn} onPress={() => router.push("/wallet/send")}>
                <Ionicons name="arrow-up-circle" size={16} color={COLORS.orange} />
                <Text style={styles.walletBtnText}>إرسال</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => router.push("/wallet/qr")}>
                <Ionicons name="qr-code" size={16} color={COLORS.orange} />
                <Text style={styles.walletBtnText}>QR Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => router.push("/wallet/crypto-wallet")}>
                <MaterialCommunityIcons name="bitcoin" size={16} color="#F7931A" />
                <Text style={styles.walletBtnText}>Crypto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => router.push("/wallet/cards")}>
                <Ionicons name="card" size={16} color="#627EEA" />
                <Text style={styles.walletBtnText}>Cards</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── 3. Communications Hub ───────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>مركز الاتصالات 📡</Text>
            <TouchableOpacity onPress={() => router.push("/market/esim")}>
              <Text style={styles.seeAll}>عرض الكل ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.commsRow}>
            <View style={[styles.commChip, esimActive && styles.commChipActive]}>
              <Ionicons name="cellular" size={18} color={esimActive ? COLORS.success : "#555"} />
              <Text style={styles.commChipLabel}>eSIM</Text>
              <Text style={[styles.commChipStatus, { color: esimActive ? COLORS.success : "#555" }]}>
                {esimActive ? "Active" : "Inactive"}
              </Text>
            </View>
            <View style={[styles.commChip, styles.commChipActive]}>
              <Ionicons name="radio" size={18} color={COLORS.orange} />
              <Text style={styles.commChipLabel}>Satellites</Text>
              <Text style={[styles.commChipStatus, { color: COLORS.orange }]}>{satCount} Found</Text>
            </View>
            <View style={[styles.commChip, isGhostMode && styles.commChipActive]}>
              <MaterialCommunityIcons name="ghost" size={18} color={isGhostMode ? COLORS.orange : "#555"} />
              <Text style={styles.commChipLabel}>VPN</Text>
              <Text style={[styles.commChipStatus, { color: isGhostMode ? COLORS.success : "#555" }]}>
                {isGhostMode ? "Active" : "Off"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.radarBtn} onPress={() => router.push("/market/satellite")}>
            <LinearGradient colors={["#0D0D1E", "#1A1A2E"]} style={styles.radarBtnInner}>
              <Text style={styles.radarBtnEmoji}>🛰️</Text>
              <Text style={styles.radarBtnText}>فتح رادار الأقمار الاصطناعية</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.orange} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push("/market/ghost")}>
            <LinearGradient colors={["#0D0600", "#1A0C00"]} style={styles.radarBtnInner}>
              <Text style={styles.radarBtnEmoji}>👻</Text>
              <Text style={styles.radarBtnText}>Ghost Protocol Settings</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.orange} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── 4. Latest Peep Feed ─────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>آخر منشورات Peep 🐦</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/feed")}>
              <Text style={styles.seeAll}>عرض الكل ›</Text>
            </TouchableOpacity>
          </View>
          {peepPreviews.map((post) => (
            <View key={post.id} style={styles.peepCard}>
              <View style={styles.peepHeader}>
                <View style={styles.peepAvatar}>
                  <Text style={styles.peepAvatarText}>{post.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.peepNameRow}>
                    <Text style={styles.peepUser}>{post.user}</Text>
                    {post.verified && (
                      <Ionicons name="checkmark-circle" size={13} color={COLORS.blue} style={{ marginLeft: 3 }} />
                    )}
                  </View>
                  <Text style={styles.peepHandle}>{post.handle} · {post.time}</Text>
                </View>
              </View>
              <Text style={styles.peepContent} numberOfLines={2}>{post.content}</Text>
              <View style={styles.peepStats}>
                <View style={styles.peepStat}>
                  <Ionicons name="heart-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.peepStatText}>{formatNum(post.likes)}</Text>
                </View>
                <View style={styles.peepStat}>
                  <Ionicons name="repeat" size={14} color={COLORS.textMuted} />
                  <Text style={styles.peepStatText}>{formatNum(post.retweets)}</Text>
                </View>
                <View style={styles.peepStat}>
                  <Ionicons name="chatbubble-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.peepStatText}>{formatNum(post.comments)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── 5. Quick Actions ────────────────────────────────── */}
        <Text style={styles.sectionTitle2}>إجراءات سريعة</Text>
        <View style={styles.qaRow}>
          <QuickAction icon="arrow-up-circle" label="إرسال" onPress={() => router.push("/wallet/send")} />
          <QuickAction icon="qr-code-outline" label="QR Pay" onPress={() => router.push("/wallet/qr")} />
          <QuickAction icon="create-outline" label="Peep" onPress={() => router.push("/(tabs)/feed")} accent="#2980B9" />
          <QuickAction icon="person-outline" label="هويتي" onPress={() => router.push("/profile")} accent="#9B59B6" />
        </View>
        <View style={styles.qaRow}>
          <QuickAction icon="cellular-outline" label="eSIM" onPress={() => router.push("/market/esim")} accent="#00D4FF" />
          <QuickAction icon="radio-outline" label="Radar" onPress={() => router.push("/market/satellite")} accent="#627EEA" />
          <QuickAction icon="card-outline" label="Cards" onPress={() => router.push("/wallet/cards")} accent={COLORS.success} />
          <QuickAction icon="storefront-outline" label="Market" onPress={() => router.push("/(tabs)/market")} accent="#E74C3C" />
        </View>
      </ScrollView>
    </StarryBackground>
  );
}

const CARD_RADIUS = 20;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white },
  settingsBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16, gap: 14 },

  // Identity card
  identityCard: { borderRadius: CARD_RADIUS, overflow: "hidden", borderWidth: 1, borderColor: "rgba(230,126,34,0.2)" },
  identityGrad: { padding: 18, gap: 10 },
  identityLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  ghostGlow: { position: "absolute", width: 60, height: 60, borderRadius: 30 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 26 },
  welcomeText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
  usernameText: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white, letterSpacing: -0.3 },
  tunnelBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, alignSelf: "flex-start" },
  tunnelDot: { width: 6, height: 6, borderRadius: 3 },
  tunnelText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  ipBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(230,126,34,0.1)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "rgba(230,126,34,0.25)", alignSelf: "flex-end" },
  ipText: { fontFamily: "Poppins_500Medium", fontSize: 10, color: COLORS.orange },

  // Portfolio card
  portfolioCard: { borderRadius: CARD_RADIUS, overflow: "hidden", borderWidth: 1, borderColor: "rgba(230,126,34,0.2)" },
  portfolioGrad: { padding: 18 },
  portfolioLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.orange, marginBottom: 6 },
  portfolioTotal: { fontFamily: "Poppins_700Bold", fontSize: 36, color: COLORS.white, letterSpacing: -1 },
  portfolioRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  portfolioChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  portfolioChipFlag: { fontSize: 14 },
  portfolioChipVal: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  cryptoRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  cryptoChip: { backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  cryptoSym: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  cryptoHold: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.white },
  cryptoChange: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  walletActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  walletBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.06)", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  walletBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.white },

  // Section cards
  sectionCard: { backgroundColor: "#1A1A1A", borderRadius: CARD_RADIUS, padding: 16, borderWidth: 1, borderColor: "#252525" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.white },
  seeAll: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.orange },
  sectionTitle2: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.white, marginLeft: 2 },

  // Comms
  commsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  commChip: { flex: 1, backgroundColor: "#111", borderRadius: 14, paddingVertical: 12, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#222" },
  commChipActive: { borderColor: "rgba(230,126,34,0.3)" },
  commChipLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textSecondary },
  commChipStatus: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  radarBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "rgba(100,116,180,0.3)" },
  ghostBtn: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(230,126,34,0.25)" },
  radarBtnInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  radarBtnEmoji: { fontSize: 18 },
  radarBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white, flex: 1 },

  // Peep preview
  peepCard: { backgroundColor: "#111", borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#222" },
  peepHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  peepAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.orange },
  peepAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.white },
  peepNameRow: { flexDirection: "row", alignItems: "center" },
  peepUser: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  peepHandle: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  peepContent: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  peepStats: { flexDirection: "row", gap: 20 },
  peepStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  peepStatText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },

  // Quick actions
  qaRow: { flexDirection: "row", gap: 10 },
  qaBtn: { flex: 1, alignItems: "center", gap: 7 },
  qaIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  qaLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
});
