import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
  FlatList, Dimensions, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { WORLD_CURRENCIES, CRYPTO_ASSETS, FIAT_ACCOUNTS, type WorldCurrency, type CryptoAsset } from "@/constants/walletData";

const { height: SCREEN_H } = Dimensions.get("window");

type CurrencyTab = "all" | "fiat" | "crypto" | "mine";

interface UnifiedCurrency {
  id: string;
  type: "fiat" | "crypto";
  code: string;
  name: string;
  flag: string;
  symbol: string;
  region: string;
  usdRate: number;
  color: string;
  iconEmoji?: string;
  isOwned?: boolean;
  balance?: number;
  change24h?: number;
}

const REGION_COLORS: Record<string, string> = {
  "Middle East": "#E67E22",
  "Europe": "#2980B9",
  "Americas": "#27AE60",
  "Asia": "#9B59B6",
  "Africa": "#E74C3C",
  "Oceania": "#16A085",
};

function buildUnified(): UnifiedCurrency[] {
  const ownedCodes = new Set(FIAT_ACCOUNTS.map(a => a.currency));
  const fiat: UnifiedCurrency[] = WORLD_CURRENCIES.map(wc => ({
    id: `fiat_${wc.currency}`,
    type: "fiat" as const,
    code: wc.currency,
    name: wc.country,
    flag: wc.flag,
    symbol: wc.symbol,
    region: wc.region,
    usdRate: wc.usdRate,
    color: REGION_COLORS[wc.region] ?? COLORS.orange,
    isOwned: ownedCodes.has(wc.currency),
    balance: FIAT_ACCOUNTS.find(a => a.currency === wc.currency)?.balance,
  }));

  const crypto: UnifiedCurrency[] = CRYPTO_ASSETS.map(ca => ({
    id: `crypto_${ca.symbol}`,
    type: "crypto" as const,
    code: ca.symbol,
    name: ca.name,
    flag: ca.iconEmoji ?? "●",
    symbol: "$",
    region: "Crypto",
    usdRate: ca.usdPrice,
    color: ca.color,
    iconEmoji: ca.iconEmoji,
    isOwned: ca.usdValue > 0,
    balance: ca.balance,
    change24h: ca.change24h,
  }));

  return [...fiat, ...crypto];
}

const ALL_CURRENCIES = buildUnified();

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect?: (currency: UnifiedCurrency) => void;
  title?: string;
}

export function CurrencyPickerSheet({ visible, onClose, onSelect, title = "Select Currency" }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CurrencyTab>("all");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<UnifiedCurrency | null>(null);
  const inputRef = useRef<TextInput>(null);

  const regions = useMemo(() => {
    const r = new Set(ALL_CURRENCIES.filter(c => c.type === "fiat").map(c => c.region));
    return Array.from(r);
  }, []);

  const filtered = useMemo(() => {
    let list = ALL_CURRENCIES;
    if (tab === "fiat") list = list.filter(c => c.type === "fiat");
    if (tab === "crypto") list = list.filter(c => c.type === "crypto");
    if (tab === "mine") list = list.filter(c => c.isOwned);
    if (selectedRegion && tab !== "crypto") list = list.filter(c => c.region === selectedRegion || c.type === "crypto");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, search, selectedRegion]);

  const handleSelect = useCallback((item: UnifiedCurrency) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailItem(item);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!detailItem) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect?.(detailItem);
    setDetailItem(null);
    onClose();
  }, [detailItem, onSelect, onClose]);

  const handleClose = () => {
    setSearch("");
    setTab("all");
    setSelectedRegion(null);
    setDetailItem(null);
    onClose();
  };

  const TABS: { key: CurrencyTab; label: string; icon: string }[] = [
    { key: "all", label: "الكل", icon: "grid-outline" },
    { key: "mine", label: "محفظتي", icon: "wallet-outline" },
    { key: "fiat", label: "ورقية", icon: "cash-outline" },
    { key: "crypto", label: "رقمية", icon: "logo-bitcoin" },
  ];

  const renderItem = useCallback(({ item }: { item: UnifiedCurrency }) => {
    const isCrypto = item.type === "crypto";
    const isPos = (item.change24h ?? 0) >= 0;
    const rateDisplay = isCrypto
      ? (item.usdRate >= 1000 ? `$${(item.usdRate / 1000).toFixed(1)}K` : `$${item.usdRate.toFixed(item.usdRate < 1 ? 4 : 2)}`)
      : (item.usdRate >= 1000 ? `${(item.usdRate / 1000).toFixed(1)}K per $` : item.usdRate >= 1 ? `${item.usdRate.toFixed(2)} per $` : `$${(1 / item.usdRate).toFixed(2)}`);

    return (
      <TouchableOpacity style={p.row} onPress={() => handleSelect(item)} activeOpacity={0.78}>
        <View style={[p.flagWrap, { backgroundColor: item.color + "20" }]}>
          <Text style={[p.flagText, isCrypto && { color: item.color }]}>
            {item.flag}
          </Text>
        </View>
        <View style={p.rowInfo}>
          <View style={p.rowTop}>
            <Text style={p.rowCode}>{item.code}</Text>
            {item.isOwned && (
              <View style={p.ownedBadge}>
                <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
                <Text style={p.ownedText}>في المحفظة</Text>
              </View>
            )}
          </View>
          <Text style={p.rowName} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={p.rowRight}>
          <Text style={p.rowRate}>{rateDisplay}</Text>
          {isCrypto && item.change24h !== undefined ? (
            <Text style={[p.rowChange, { color: isPos ? COLORS.success : COLORS.danger }]}>
              {isPos ? "+" : ""}{item.change24h.toFixed(2)}%
            </Text>
          ) : (
            <View style={[p.regionTag, { backgroundColor: item.color + "18" }]}>
              <Text style={[p.regionTagText, { color: item.color }]}>{item.region}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  }, []);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={p.overlay}>
        <TouchableOpacity style={p.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={[p.sheet, { paddingBottom: bottomPad + 16 }]}>
          <View style={p.handle} />

          <View style={p.headerRow}>
            <Text style={p.title}>{title}</Text>
            <TouchableOpacity style={p.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={p.searchWrap}>
            <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
            <TextInput
              ref={inputRef}
              style={p.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="ابحث عن عملة، دولة، منطقة..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={p.tabRow}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[p.tabBtn, tab === t.key && p.tabBtnActive]}
                onPress={() => { setTab(t.key); setSelectedRegion(null); Haptics.selectionAsync(); }}
              >
                <Ionicons name={t.icon as any} size={13} color={tab === t.key ? COLORS.orange : COLORS.textMuted} />
                <Text style={[p.tabText, tab === t.key && { color: COLORS.orange }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(tab === "all" || tab === "fiat") && !search && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.regionRow}>
              <TouchableOpacity
                style={[p.regionChip, !selectedRegion && p.regionChipActive]}
                onPress={() => setSelectedRegion(null)}
              >
                <Text style={[p.regionChipText, !selectedRegion && { color: COLORS.orange }]}>الكل</Text>
              </TouchableOpacity>
              {regions.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[p.regionChip, selectedRegion === r && p.regionChipActive]}
                  onPress={() => { setSelectedRegion(selectedRegion === r ? null : r); Haptics.selectionAsync(); }}
                >
                  <View style={[p.regionDot, { backgroundColor: REGION_COLORS[r] }]} />
                  <Text style={[p.regionChipText, selectedRegion === r && { color: COLORS.orange }]}>
                    {r === "Middle East" ? "الشرق الأوسط" : r === "Europe" ? "أوروبا" : r === "Americas" ? "الأمريكيتان" : r === "Asia" ? "آسيا" : r === "Africa" ? "أفريقيا" : r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={p.countRow}>
            <Text style={p.countText}>{filtered.length} عملة</Text>
            {search ? <Text style={p.countSearch}>نتائج "{search}"</Text> : null}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            style={p.list}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={p.separator} />}
            ListEmptyComponent={
              <View style={p.empty}>
                <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
                <Text style={p.emptyText}>لا توجد نتائج</Text>
                <Text style={p.emptySubText}>جرّب البحث باسم العملة أو الدولة</Text>
              </View>
            }
            getItemLayout={(_, index) => ({ length: 66, offset: 66 * index, index })}
          />
        </View>
      </View>

      {detailItem && (
        <Modal visible transparent animationType="fade">
          <View style={p.detailOverlay}>
            <View style={p.detailCard}>
              <View style={[p.detailIconWrap, { backgroundColor: detailItem.color + "22" }]}>
                <Text style={[p.detailIcon, { color: detailItem.color }]}>{detailItem.flag}</Text>
              </View>
              <Text style={p.detailCode}>{detailItem.code}</Text>
              <Text style={p.detailName}>{detailItem.name}</Text>

              <View style={p.detailStats}>
                <View style={p.detailStat}>
                  <Text style={p.detailStatLabel}>سعر الصرف</Text>
                  <Text style={p.detailStatValue}>
                    {detailItem.type === "crypto"
                      ? `$${detailItem.usdRate >= 1000 ? (detailItem.usdRate / 1000).toFixed(1) + "K" : detailItem.usdRate.toFixed(2)}`
                      : `1 USD = ${detailItem.usdRate >= 1 ? detailItem.usdRate.toFixed(2) : (1 / detailItem.usdRate).toFixed(4)} ${detailItem.code}`}
                  </Text>
                </View>
                <View style={p.detailStatDivider} />
                <View style={p.detailStat}>
                  <Text style={p.detailStatLabel}>المنطقة</Text>
                  <Text style={[p.detailStatValue, { color: detailItem.color }]}>{detailItem.region}</Text>
                </View>
                {detailItem.balance !== undefined && (
                  <>
                    <View style={p.detailStatDivider} />
                    <View style={p.detailStat}>
                      <Text style={p.detailStatLabel}>رصيدك</Text>
                      <Text style={[p.detailStatValue, { color: COLORS.success }]}>
                        {detailItem.type === "crypto"
                          ? `${detailItem.balance} ${detailItem.code}`
                          : `${detailItem.symbol}${detailItem.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {detailItem.change24h !== undefined && (
                <View style={[p.changeRow, { backgroundColor: detailItem.change24h >= 0 ? "#27AE6018" : "#E74C3C18" }]}>
                  <Ionicons name={detailItem.change24h >= 0 ? "trending-up" : "trending-down"} size={14} color={detailItem.change24h >= 0 ? COLORS.success : COLORS.danger} />
                  <Text style={[p.changeText, { color: detailItem.change24h >= 0 ? COLORS.success : COLORS.danger }]}>
                    {detailItem.change24h >= 0 ? "+" : ""}{detailItem.change24h.toFixed(2)}% (24 ساعة)
                  </Text>
                </View>
              )}

              <View style={p.detailActions}>
                <TouchableOpacity style={p.detailCancelBtn} onPress={() => setDetailItem(null)}>
                  <Text style={p.detailCancelText}>رجوع</Text>
                </TouchableOpacity>
                <TouchableOpacity style={p.detailConfirmBtn} onPress={handleConfirm}>
                  <LinearGradient colors={[COLORS.orange, "#D35400"]} style={p.detailConfirmInner}>
                    <Ionicons name={detailItem.isOwned ? "eye-outline" : "add-circle-outline"} size={16} color="#fff" />
                    <Text style={p.detailConfirmText}>{detailItem.isOwned ? "عرض الحساب" : "إضافة للمحفظة"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

import { LinearGradient } from "expo-linear-gradient";

const p = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)" },
  sheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.92,
    borderTopWidth: 1, borderColor: "#2A2A2A",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginTop: 12, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1A1A", marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.white, padding: 0 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#111", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#222", marginBottom: 12 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9 },
  tabBtnActive: { backgroundColor: "#1E1409" },
  tabText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textMuted },
  regionRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingBottom: 10 },
  regionChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#2A2A2A" },
  regionChipActive: { borderColor: COLORS.orange + "60", backgroundColor: "#1E1409" },
  regionDot: { width: 6, height: 6, borderRadius: 3 },
  regionChipText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textMuted },
  countRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  countText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textMuted },
  countSearch: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.orange },
  list: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 11, gap: 12 },
  flagWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  flagText: { fontSize: 22 },
  rowInfo: { flex: 1, gap: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowCode: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.white },
  ownedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(39,174,96,0.12)", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  ownedText: { fontFamily: "Poppins_500Medium", fontSize: 9, color: COLORS.success },
  rowName: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  rowRight: { alignItems: "flex-end", gap: 3 },
  rowRate: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.white },
  rowChange: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  regionTag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  regionTagText: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  separator: { height: 1, backgroundColor: "#1E1E1E", marginHorizontal: 16 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.textSecondary },
  emptySubText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted },
  detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 24 },
  detailCard: { backgroundColor: "#181818", borderRadius: 24, padding: 24, width: "100%", borderWidth: 1, borderColor: "#2A2A2A", gap: 14 },
  detailIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  detailIcon: { fontSize: 32 },
  detailCode: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.white, textAlign: "center", letterSpacing: -0.5 },
  detailName: { fontFamily: "Poppins_400Regular", fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },
  detailStats: { flexDirection: "row", backgroundColor: "#111", borderRadius: 16, padding: 16 },
  detailStat: { flex: 1, alignItems: "center", gap: 4 },
  detailStatLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  detailStatValue: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.white, textAlign: "center" },
  detailStatDivider: { width: 1, backgroundColor: "#2A2A2A", marginHorizontal: 4 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  changeText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  detailActions: { flexDirection: "row", gap: 10 },
  detailCancelBtn: { flex: 1, backgroundColor: "#222", borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  detailCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.textSecondary },
  detailConfirmBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  detailConfirmInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  detailConfirmText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
