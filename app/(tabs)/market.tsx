import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import { PRODUCTS, type Product } from "@/constants/mockData";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const SUPER_CATEGORIES = [
  { id: "all", label: "All", icon: "grid-outline" as const },
  { id: "esim", label: "eSIM", icon: "cellular-outline" as const },
  { id: "satellite", label: "Satellite", icon: "radio-outline" as const },
  { id: "privacy", label: "Privacy", icon: "shield-outline" as const },
  { id: "electronics", label: "Tech", icon: "hardware-chip-outline" as const },
  { id: "fashion", label: "Fashion", icon: "shirt-outline" as const },
];

const FEATURED_MODULES = [
  {
    id: "esim",
    title: "eSIM Store",
    desc: "Instant global eSIM · 190+ countries · In-app activation",
    icon: "cellular-outline" as const,
    badge: "NEW",
    gradient: ["#0D0D1E", "#1A1A2E"] as [string, string],
    accent: "#00D4FF",
    route: "/market/esim" as const,
    emoji: "📡",
  },
  {
    id: "satellite",
    title: "Satellite Radar",
    desc: "Live orbital tracking · Emergency mesh connectivity",
    icon: "planet-outline" as const,
    badge: "LIVE",
    gradient: ["#000010", "#0A0A18"] as [string, string],
    accent: "#00D4FF",
    route: "/market/satellite" as const,
    emoji: "🛰️",
  },
  {
    id: "ghost",
    title: "Ghost Protocol",
    desc: "Stealth IP · E2E encryption · Self-destructing sessions",
    icon: "shield-checkmark-outline" as const,
    badge: "SECURE",
    gradient: ["#0A0006", "#1A0012"] as [string, string],
    accent: COLORS.orange,
    route: "/market/ghost" as const,
    emoji: "👻",
  },
];

function AddToCartButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    scale.value = withSequence(withTiming(0.85, { duration: 80 }), withTiming(1, { duration: 100 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity style={styles.addBtn} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function ProductCard({ item }: { item: Product }) {
  const [inCart, setInCart] = useState(false);
  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;
  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.85}>
      <View style={[styles.productImage, { backgroundColor: item.color }]}>
        <Ionicons name="cube-outline" size={36} color="rgba(255,255,255,0.4)" />
        {item.badge && (
          <View style={[styles.badge, {
            backgroundColor: item.badge === "SALE" ? COLORS.danger : item.badge === "NEW" ? COLORS.blue : COLORS.orange
          }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color={COLORS.orange} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({(item.reviews / 1000).toFixed(1)}k)</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${item.price}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            )}
          </View>
          <AddToCartButton onPress={() => setInCart(!inCart)} />
        </View>
      </View>
      {inCart && (
        <View style={styles.inCartIndicator}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom;

  const showProducts = selectedCat === "all" || selectedCat === "electronics" || selectedCat === "fashion";
  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <StarryBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <View>
            <Text style={styles.headerTitle}>Super Market</Text>
            <Text style={styles.headerSub}>eSIM · Satellite · Privacy · Tech</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="heart-outline" size={20} color={COLORS.orange} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="bag-outline" size={20} color={COLORS.orange} />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search eSIM, Starlink, products..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={18} color={COLORS.orange} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContent}
        >
          {SUPER_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
              onPress={() => { setSelectedCat(cat.id); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={selectedCat === cat.id ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(selectedCat === "all" || selectedCat === "esim" || selectedCat === "satellite" || selectedCat === "privacy") && (
          <>
            <Text style={styles.sectionTitle}>Advanced Modules</Text>
            {FEATURED_MODULES.filter((m) =>
              selectedCat === "all" ||
              (selectedCat === "esim" && m.id === "esim") ||
              (selectedCat === "satellite" && m.id === "satellite") ||
              (selectedCat === "privacy" && m.id === "ghost")
            ).map((module) => (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(module.route);
                }}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={module.gradient}
                  style={styles.moduleInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.moduleLeft}>
                    <Text style={styles.moduleEmoji}>{module.emoji}</Text>
                    <View style={styles.moduleText}>
                      <View style={styles.moduleTitleRow}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <View style={[styles.moduleBadge, { backgroundColor: module.accent + "22", borderColor: module.accent + "44" }]}>
                          <Text style={[styles.moduleBadgeText, { color: module.accent }]}>{module.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.moduleDesc}>{module.desc}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </>
        )}

        {(selectedCat === "all" || selectedCat === "esim") && (
          <View style={styles.esimTeaser}>
            <Text style={styles.teaserLabel}>🌍 MENA Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { data: "1 GB", price: "$4.99", validity: "7 days", flag: "🌍", speed: "4G" },
                { data: "5 GB", price: "$14.99", validity: "30 days", flag: "🌍", speed: "4G" },
                { data: "20 GB", price: "$39.99", validity: "90 days", flag: "🌍", speed: "5G" },
              ].map((plan) => (
                <TouchableOpacity
                  key={plan.data}
                  style={styles.teaserCard}
                  onPress={() => router.push("/market/esim")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.teaserFlag}>{plan.flag}</Text>
                  <Text style={styles.teaserData}>{plan.data}</Text>
                  <Text style={styles.teaserValidity}>{plan.validity}</Text>
                  <Text style={styles.teaserSpeed}>{plan.speed} LTE</Text>
                  <Text style={styles.teaserPrice}>{plan.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showProducts && (
          <>
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.grid}>
              {(search ? filtered : PRODUCTS).map((item, i) => (
                <View key={item.id} style={i % 2 === 0 ? styles.gridLeft : styles.gridRight}>
                  <ProductCard item={item} />
                </View>
              ))}
              {(search ? filtered : PRODUCTS).length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.white, letterSpacing: -0.5 },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: -2 },
  headerRight: { flexDirection: "row", gap: 8, marginTop: 4 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: -2, right: -2, backgroundColor: COLORS.danger, borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: COLORS.white },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 14, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.borderLight, gap: 8 },
  searchInput: { flex: 1, color: COLORS.white, fontFamily: "Poppins_400Regular", fontSize: 14, padding: 0 },
  filterBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  catScroll: { maxHeight: 44, marginBottom: 20 },
  catContent: { paddingHorizontal: 16, gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.borderLight },
  catChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  catText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white, paddingHorizontal: 20, marginBottom: 14 },
  moduleCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  moduleInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  moduleLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  moduleEmoji: { fontSize: 32 },
  moduleText: { flex: 1, gap: 4 },
  moduleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moduleTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white },
  moduleBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  moduleBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 0.5 },
  moduleDesc: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  esimTeaser: { paddingHorizontal: 20, marginBottom: 24 },
  teaserLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  teaserCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, width: 120, borderWidth: 1, borderColor: COLORS.borderLight, gap: 3 },
  teaserFlag: { fontSize: 22 },
  teaserData: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  teaserValidity: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary },
  teaserSpeed: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.success },
  teaserPrice: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.orange, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 0 },
  gridLeft: { width: "50%", paddingRight: 6, paddingBottom: 12 },
  gridRight: { width: "50%", paddingLeft: 6, paddingBottom: 12 },
  productCard: { backgroundColor: COLORS.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: COLORS.borderLight },
  productImage: { height: 140, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: 10, left: 10, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: COLORS.white, letterSpacing: 0.5 },
  productInfo: { padding: 12 },
  productName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white, marginBottom: 4, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  ratingText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.orange },
  reviewsText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.orange },
  originalPrice: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, textDecorationLine: "line-through" },
  addBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  inCartIndicator: { position: "absolute", top: 10, right: 10 },
  empty: { width: "100%", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 15, color: COLORS.textMuted },
});
