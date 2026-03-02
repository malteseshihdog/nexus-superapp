import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { VIRTUAL_CARDS, type VirtualCard } from "@/constants/walletData";

const { width } = Dimensions.get("window");
const CARD_W = width - 48;
const CARD_H = CARD_W * 0.58;

function CreditCard({ card, onToggleFreeze, selected }: {
  card: VirtualCard;
  onToggleFreeze: (id: string) => void;
  selected: boolean;
}) {
  const [showNumber, setShowNumber] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.cardWrapper, selected && styles.cardWrapperSelected]}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={card.isFrozen ? ["#2A2A2A", "#1A1A1A"] : card.color}
        style={[styles.card, { width: CARD_W, height: CARD_H }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardBrandRow}>
            <Text style={styles.cardBrand}>NEXUS</Text>
            {card.isVirtual && (
              <View style={styles.virtualBadge}>
                <Text style={styles.virtualBadgeText}>Virtual</Text>
              </View>
            )}
          </View>
          {card.isFrozen && (
            <View style={styles.frozenBadge}>
              <Ionicons name="snow" size={12} color="#7EC8E3" />
              <Text style={styles.frozenText}>Frozen</Text>
            </View>
          )}
          <MaterialCommunityIcons
            name={card.network === "Visa" ? "credit-card" : "credit-card-multiple"}
            size={28}
            color="rgba(255,255,255,0.6)"
          />
        </View>

        <View style={styles.cardChip}>
          <View style={styles.chipInner} />
        </View>

        <TouchableOpacity
          style={styles.cardNumber}
          onPress={() => setShowNumber(!showNumber)}
        >
          <Text style={styles.cardNumberText}>
            {showNumber
              ? `4242 4242 4242 ${card.last4}`
              : `•••• •••• •••• ${card.last4}`}
          </Text>
          <Ionicons
            name={showNumber ? "eye-off-outline" : "eye-outline"}
            size={14}
            color="rgba(255,255,255,0.5)"
          />
        </TouchableOpacity>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardBottomLabel}>Card Holder</Text>
            <Text style={styles.cardBottomValue}>{card.cardHolder}</Text>
          </View>
          <View>
            <Text style={styles.cardBottomLabel}>Expires</Text>
            <Text style={styles.cardBottomValue}>{card.expiry}</Text>
          </View>
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{card.network}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<VirtualCard[]>(VIRTUAL_CARDS);
  const [selectedCard, setSelectedCard] = useState(cards[0].id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const active = cards.find((c) => c.id === selectedCard) || cards[0];

  const toggleFreeze = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFrozen: !c.isFrozen } : c))
    );
  }, []);

  const CARD_ACTIONS = [
    {
      icon: active.isFrozen ? "snow-outline" : "snow",
      label: active.isFrozen ? "Unfreeze" : "Freeze",
      color: "#7EC8E3",
      onPress: () => toggleFreeze(active.id),
    },
    { icon: "settings-outline", label: "Limits", color: COLORS.orange, onPress: () => {} },
    { icon: "lock-closed-outline", label: "PIN", color: "#9B59B6", onPress: () => {} },
    { icon: "close-circle-outline", label: "Cancel", color: COLORS.danger, onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D0D0D", "#111111"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity style={styles.addCardBtn}>
          <Ionicons name="add" size={20} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 24));
            setSelectedCard(cards[idx]?.id || cards[0].id);
            Haptics.selectionAsync();
          }}
        >
          {cards.map((card) => (
            <View key={card.id} style={{ paddingHorizontal: 12 }}>
              <CreditCard
                card={card}
                onToggleFreeze={toggleFreeze}
                selected={selectedCard === card.id}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotRow}>
          {cards.map((c) => (
            <View key={c.id} style={[styles.dot, selectedCard === c.id && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            ${active.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </Text>
        </View>

        <View style={styles.cardActions}>
          {CARD_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.cardAction}
              onPress={action.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.cardActionIcon, { backgroundColor: action.color + "18" }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.cardActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Card Details</Text>
        <View style={styles.detailCard}>
          {[
            { label: "Card Type", value: active.isVirtual ? "Virtual Prepaid" : "Physical Prepaid" },
            { label: "Network", value: active.network },
            { label: "Status", value: active.isFrozen ? "Frozen ❄️" : "Active ✅" },
            { label: "Daily Limit", value: "$5,000" },
            { label: "Monthly Limit", value: "$25,000" },
            { label: "Issuer", value: "NEXUS Financial (Marqeta / Rapyd)" },
          ].map((d, i) => (
            <View key={d.label} style={[styles.detailRow, i > 0 && styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Order Physical Card</Text>
        <TouchableOpacity style={styles.physicalCardBanner} activeOpacity={0.85}>
          <LinearGradient colors={["#1A1A1A", "#111111"]} style={styles.physicalCardInner}>
            <View style={styles.physicalCardLeft}>
              <MaterialCommunityIcons name="credit-card-outline" size={28} color={COLORS.orange} />
              <View>
                <Text style={styles.physicalCardTitle}>Get a Physical Card</Text>
                <Text style={styles.physicalCardSub}>
                  Visa/Mastercard · Delivered in 5–7 days
                </Text>
              </View>
            </View>
            <View style={styles.physicalCardBadge}>
              <Text style={styles.physicalCardBadgeText}>FREE</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Card Issuance APIs</Text>
        <View style={styles.apiList}>
          {[
            { name: "Marqeta", desc: "Virtual & physical card issuance", color: "#7B2FBE" },
            { name: "Rapyd", desc: "Global card network integration", color: "#0A66C2" },
            { name: "PaySafeCard", desc: "Prepaid payment vouchers", color: "#009FD4" },
          ].map((api) => (
            <View key={api.name} style={styles.apiRow}>
              <View style={[styles.apiDot, { backgroundColor: api.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.apiName}>{api.name}</Text>
                <Text style={styles.apiDesc}>{api.desc}</Text>
              </View>
              <View style={styles.apiStatusBadge}>
                <Text style={styles.apiStatusText}>Ready</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  addCardBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { paddingTop: 8 },
  cardWrapper: { alignItems: "center" },
  cardWrapperSelected: {},
  card: { borderRadius: 20, padding: 22, justifyContent: "space-between" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardBrand: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "rgba(255,255,255,0.9)", letterSpacing: 2 },
  virtualBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  virtualBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.8)" },
  frozenBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(126,200,227,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  frozenText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#7EC8E3" },
  cardChip: { width: 38, height: 28, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.25)", padding: 4 },
  chipInner: { flex: 1, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" },
  cardNumber: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardNumberText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "rgba(255,255,255,0.9)", letterSpacing: 2 },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  cardBottomLabel: { fontFamily: "Poppins_400Regular", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  cardBottomValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.9)" },
  networkBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  networkText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "rgba(255,255,255,0.9)", letterSpacing: 1 },
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#333" },
  dotActive: { backgroundColor: COLORS.orange, width: 18 },
  balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 20 },
  balanceLabel: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
  balanceValue: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.white },
  cardActions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 28 },
  cardAction: { alignItems: "center", gap: 6 },
  cardActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardActionLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textSecondary },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white, paddingHorizontal: 24, marginBottom: 12 },
  detailCard: { marginHorizontal: 20, backgroundColor: "#1A1A1A", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 24 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: "#222" },
  detailLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary },
  detailValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  physicalCardBanner: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: COLORS.orange },
  physicalCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  physicalCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  physicalCardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.white },
  physicalCardSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  physicalCardBadge: { backgroundColor: COLORS.orange, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  physicalCardBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },
  apiList: { marginHorizontal: 20, backgroundColor: "#1A1A1A", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A" },
  apiRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#222" },
  apiDot: { width: 10, height: 10, borderRadius: 5 },
  apiName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  apiDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  apiStatusBadge: { backgroundColor: "rgba(39,174,96,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  apiStatusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.success },
});
