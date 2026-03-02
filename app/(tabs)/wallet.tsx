import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Dimensions, Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { CurrencyPickerSheet } from "@/components/CurrencyPickerSheet";
import {
  FIAT_ACCOUNTS, FX_RATES, REMITTANCE_PROVIDERS, WALLET_TRANSACTIONS,
  CRYPTO_ASSETS, WORLD_CURRENCIES, VIRTUAL_CARDS,
  type FiatAccount, type WalletTx, type CryptoAsset,
} from "@/constants/walletData";

function useWalletLiveData() {
  const { data: fxData } = useQuery<{ rates: { from: string; to: string; rate: number; change: number; isLive: boolean }[]; isLive: boolean }>({
    queryKey: ["/api/wallet/fx-rates"],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
    retry: 1,
  });
  const { data: cryptoData } = useQuery<{ prices: { id: string; symbol: string; usdPrice: number; change24h: number; isLive: boolean }[]; isLive: boolean }>({
    queryKey: ["/api/wallet/crypto-prices"],
    refetchInterval: 2 * 60 * 1000,
    staleTime: 90 * 1000,
    retry: 1,
  });
  const { data: txData, isLoading: txLoading } = useQuery<{ transactions: any[] }>({
    queryKey: ["/api/wallet/transactions"],
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
    retry: 1,
  });
  const { data: balancesData } = useQuery<{ balances: any[] }>({
    queryKey: ["/api/wallet/balances"],
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
    retry: 1,
  });
  return { fxData, cryptoData, txData, txLoading, balancesData };
}

const { width } = Dimensions.get("window");
const CARD_W = 140;

function formatBal(amount: number, symbol: string, currency: string) {
  if (["IQD","SYP","VND","IDR","IRR","LBP"].includes(currency)) {
    return `${symbol}${(amount / 1000).toFixed(0)}K`;
  }
  return `${symbol}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function AccountCard({ account, selected, onPress }: { account: FiatAccount; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.accCard, selected && { borderColor: account.color, backgroundColor: account.color + "12" }]}
      onPress={() => { onPress(); Haptics.selectionAsync(); }}
      activeOpacity={0.82}
    >
      <View style={s.accTop}>
        <Text style={s.accFlag}>{account.flag}</Text>
        {selected && <View style={[s.accActiveDot, { backgroundColor: account.color }]} />}
      </View>
      <Text style={[s.accCurrency, selected && { color: account.color }]}>{account.currency}</Text>
      <Text style={s.accBalance}>{formatBal(account.balance, account.symbol, account.currency)}</Text>
      <Text style={s.accRegion}>{account.region}</Text>
    </TouchableOpacity>
  );
}

function CryptoRow({ asset, onPress }: { asset: CryptoAsset; onPress: () => void }) {
  const isPos = asset.change24h >= 0;
  return (
    <TouchableOpacity style={s.cryptoRow} activeOpacity={0.78} onPress={onPress}>
      <View style={[s.cryptoIconWrap, { backgroundColor: asset.color + "22" }]}>
        <Text style={[s.cryptoEmoji, { color: asset.color }]}>{asset.iconEmoji}</Text>
      </View>
      <View style={s.cryptoInfo}>
        <Text style={s.cryptoName}>{asset.symbol}</Text>
        <Text style={s.cryptoFullName}>{asset.name}</Text>
      </View>
      <View style={s.cryptoRight}>
        <Text style={s.cryptoPrice}>${asset.usdPrice >= 1000 ? (asset.usdPrice / 1000).toFixed(1) + "K" : asset.usdPrice.toFixed(asset.usdPrice < 1 ? 4 : 2)}</Text>
        <View style={[s.cryptoChangeBadge, { backgroundColor: isPos ? "#27AE6022" : "#E74C3C22" }]}>
          <Ionicons name={isPos ? "trending-up" : "trending-down"} size={10} color={isPos ? COLORS.success : COLORS.danger} />
          <Text style={[s.cryptoChange, { color: isPos ? COLORS.success : COLORS.danger }]}>
            {isPos ? "+" : ""}{asset.change24h.toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TxRow({ tx }: { tx: WalletTx }) {
  const iconColors: Record<string, string> = {
    send: COLORS.danger, receive: COLORS.success, card: COLORS.orange,
    crypto: "#F7931A", remit: "#2980B9", fx: "#9B59B6",
  };
  const color = iconColors[tx.type] || COLORS.orange;
  return (
    <TouchableOpacity style={s.txRow} activeOpacity={0.75}>
      <View style={[s.txIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={tx.icon as any} size={17} color={color} />
      </View>
      <View style={s.txInfo}>
        <Text style={s.txLabel}>{tx.label}</Text>
        <Text style={s.txSub}>{tx.sub}</Text>
      </View>
      <View style={s.txRight}>
        <Text style={[s.txValue, { color: tx.positive ? COLORS.success : COLORS.danger }]}>{tx.value}</Text>
        <Text style={s.txTime}>{tx.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CurrencyConverterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState("100");
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const currencies = WORLD_CURRENCIES.slice(0, 20);
  const fromRate = currencies[fromIdx]?.usdRate ?? 1;
  const toRate = currencies[toIdx]?.usdRate ?? 1;
  const result = amount ? ((parseFloat(amount) / fromRate) * toRate).toFixed(4) : "0";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.sheetHandle} />
          <Text style={s.modalTitle}>Currency Converter</Text>
          <Text style={s.modalSub}>70 currencies · Live rates</Text>

          <View style={s.converterRow}>
            <View style={s.converterBox}>
              <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
                {currencies.map((c, i) => (
                  <TouchableOpacity key={c.currency} style={[s.currencyItem, fromIdx === i && s.currencyItemActive]} onPress={() => setFromIdx(i)}>
                    <Text style={s.currencyFlag}>{c.flag}</Text>
                    <Text style={[s.currencyCode, fromIdx === i && { color: COLORS.orange }]}>{c.currency}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={s.converterMid}>
              <Ionicons name="swap-horizontal" size={22} color={COLORS.orange} />
            </View>
            <View style={s.converterBox}>
              <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
                {currencies.map((c, i) => (
                  <TouchableOpacity key={c.currency} style={[s.currencyItem, toIdx === i && s.currencyItemActive]} onPress={() => setToIdx(i)}>
                    <Text style={s.currencyFlag}>{c.flag}</Text>
                    <Text style={[s.currencyCode, toIdx === i && { color: COLORS.orange }]}>{c.currency}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TextInput
            style={s.converterInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="rgba(255,255,255,0.3)"
            placeholder="Amount"
          />
          <View style={s.converterResult}>
            <Text style={s.converterResultLabel}>{amount || "0"} {currencies[fromIdx]?.currency} =</Text>
            <Text style={s.converterResultValue}>{result} {currencies[toIdx]?.currency}</Text>
          </View>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function WalletHeader({ topPad, onConverterOpen, onPickerOpen }: {
  topPad: number;
  onConverterOpen: () => void;
  onPickerOpen: () => void;
}) {
  const { user, signOut } = usePhoneAuth();

  async function handleSignOut() {
    if (Platform.OS === "web") {
      const ok = window.confirm("هل تريد تسجيل الخروج من NEXUS؟");
      if (!ok) return;
      await signOut();
      router.replace("/auth/phone");
      return;
    }
    Alert.alert(
      "تسجيل الخروج",
      "هل تريد تسجيل الخروج من NEXUS؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "خروج",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth/phone");
          },
        },
      ]
    );
  }

  return (
    <View style={[s.header, { paddingTop: topPad + 8 }]}>
      <View style={s.userPill}>
        <View style={s.userAvatarSmall}>
          <Text style={s.userAvatarEmoji}>{user?.avatar_emoji ?? "💎"}</Text>
        </View>
        <View>
          <Text style={s.headerTitle}>Wallet</Text>
          <Text style={s.headerSub}>{user?.name ?? "NEXUS User"}</Text>
        </View>
      </View>
      <View style={s.headerRight}>
        <TouchableOpacity style={s.headerBtn} onPress={onPickerOpen}>
          <Ionicons name="globe-outline" size={19} color={COLORS.orange} />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn} onPress={() => router.push("/wallet/qr")}>
          <Ionicons name="qr-code-outline" size={19} color={COLORS.orange} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={handleSignOut}
          testID="sign-out-btn"
        >
          <Ionicons name="log-out-outline" size={19} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(FIAT_ACCOUNTS[0]);
  const [cryptoTab, setCryptoTab] = useState<"portfolio" | "market">("portfolio");
  const [showConverter, setShowConverter] = useState(false);
  const [regionFilter, setRegionFilter] = useState("All");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showInsureModal, setShowInsureModal] = useState(false);

  const { user, signOut } = usePhoneAuth();
  const { fxData, cryptoData, txData, txLoading, balancesData } = useWalletLiveData();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom;

  const liveFxRates = fxData?.rates ?? FX_RATES;
  const fxIsLive = fxData?.isLive ?? false;

  const liveCrypto = CRYPTO_ASSETS.map((asset) => {
    const live = cryptoData?.prices?.find(p => p.symbol === asset.symbol);
    if (!live) return asset;
    return { ...asset, usdPrice: live.usdPrice, change24h: live.change24h };
  });

  const liveAccounts = FIAT_ACCOUNTS.map((acc) => {
    const live = balancesData?.balances?.find((b: any) => b.currency === acc.currency);
    if (!live) return acc;
    return { ...acc, balance: parseFloat(live.balance) };
  });

  const liveTransactions: WalletTx[] = txData?.transactions?.map((row: any) => ({
    id: String(row.id),
    label: row.label,
    sub: row.sub,
    amount: row.amount,
    value: row.value,
    time: new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    icon: row.icon,
    positive: row.positive,
    type: row.type,
  })) ?? WALLET_TRANSACTIONS;

  const cryptoTotal = liveCrypto.reduce((s, c) => s + c.usdValue, 0);
  const fiatTotal = liveAccounts.reduce((s, a) => {
    const liveRate = liveFxRates.find((r: any) => r.from === a.currency && r.to === "USD")?.rate
      ?? liveFxRates.find((r: any) => r.from === "USD" && r.to === a.currency)
        ? 1 / (liveFxRates.find((r: any) => r.from === "USD" && r.to === a.currency)?.rate ?? 1)
        : null;
    const fallbackRates: Record<string, number> = { USD: 1, EUR: 1.0848, GBP: 1.267, AED: 0.272, IQD: 0.000763, SAR: 0.266, SYP: 0.0000775, TRY: 0.0311, INR: 0.012, EGP: 0.0202 };
    const rate = liveRate ?? fallbackRates[a.currency] ?? 1;
    return s + a.balance * rate;
  }, 0);
  const cardsTotal = VIRTUAL_CARDS.reduce((s, c) => s + c.balance, 0);
  const grandTotal = fiatTotal + cryptoTotal;

  const QUICK_ACTIONS = [
    { icon: "arrow-up-outline", label: "Send", color: COLORS.orange, route: "/wallet/send" as const },
    { icon: "arrow-down-outline", label: "Receive", color: "#27AE60", route: "/wallet/qr" as const },
    { icon: "swap-horizontal-outline", label: "Convert", color: "#9B59B6", action: () => setShowConverter(true) },
    { icon: "card-outline", label: "Cards", color: "#2980B9", route: "/wallet/cards" as const },
    { icon: "logo-bitcoin", label: "Trade", color: "#F7931A", route: "/wallet/crypto-wallet" as const },
    { icon: "globe-outline", label: "Remit", color: "#E74C3C", action: () => router.push({ pathname: "/wallet/send", params: { tab: "remit" } }) },
    { icon: "qr-code-outline", label: "QR Pay", color: "#16A085", route: "/wallet/qr" as const },
    { icon: "shield-checkmark-outline", label: "Insure", color: "#8E44AD", action: () => setShowInsureModal(true) },
  ];

  return (
    <StarryBackground>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 96 }]}>

        <WalletHeader
          topPad={topPad}
          onConverterOpen={() => setShowConverter(true)}
          onPickerOpen={() => setShowCurrencyPicker(true)}
        />

        <LinearGradient colors={["#1C0D03", "#100A07", "#070A1C"]} style={s.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.balanceTop}>
            <Text style={s.balanceLabel}>Total Net Worth</Text>
            <TouchableOpacity onPress={() => setHideBalance(h => !h)}>
              <Ionicons name={hideBalance ? "eye-off-outline" : "eye-outline"} size={16} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </View>
          <Text style={s.balanceValue}>
            {hideBalance ? "••••••••" : `$${grandTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          </Text>
          <View style={s.balanceBreakdown}>
            {[
              { label: "Fiat", value: `$${fiatTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "#27AE60" },
              { label: "Crypto", value: `$${cryptoTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "#F7931A" },
              { label: "Cards", value: `$${cardsTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "#9B59B6" },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={s.balanceDivider} />}
                <View style={s.balanceBreakdownItem}>
                  <Text style={[s.balanceBreakdownValue, { color: hideBalance ? COLORS.textMuted : item.color }]}>
                    {hideBalance ? "••••" : item.value}
                  </Text>
                  <Text style={s.balanceBreakdownLabel}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          <View style={s.balanceBadgeRow}>
            <View style={s.balanceBadge}>
              <Ionicons name="trending-up-outline" size={11} color={COLORS.success} />
              <Text style={s.balanceBadgeText}>+8.4% · 30d</Text>
            </View>
            <View style={[s.balanceBadge, { backgroundColor: "rgba(230,126,34,0.12)", borderColor: "rgba(230,126,34,0.2)" }]}>
              <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.orange} />
              <Text style={[s.balanceBadgeText, { color: COLORS.orange }]}>Secured</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={s.quickItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if ("action" in a && a.action) { a.action(); }
                else if ("route" in a && a.route) { router.push(a.route as any); }
              }}
              activeOpacity={0.78}
            >
              <LinearGradient colors={[a.color + "30", a.color + "12"]} style={[s.quickIconWrap, { borderColor: a.color + "40" }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </LinearGradient>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>My Accounts</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => { Haptics.selectionAsync(); setShowCurrencyPicker(true); }}>
              <Ionicons name="add" size={14} color={COLORS.orange} />
              <Text style={s.sectionLink}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {liveAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} selected={selectedAccount.id === acc.id} onPress={() => setSelectedAccount(acc)} />
            ))}
          </ScrollView>
          {selectedAccount && (
            <View style={s.accDetail}>
              <View style={s.accDetailRow}>
                <View style={s.accDetailFlag}>
                  <Text style={{ fontSize: 24 }}>{selectedAccount.flag}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.accDetailCurrency}>{selectedAccount.currency} Account</Text>
                  <Text style={s.accDetailRegion}>{selectedAccount.region}</Text>
                </View>
                <Text style={[s.accDetailBalance, { color: selectedAccount.color }]}>
                  {selectedAccount.symbol}{selectedAccount.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={s.accDetailDivider} />
              <Text style={s.accDetailIbanLabel}>{selectedAccount.iban ? "IBAN" : "Account No."}</Text>
              <Text style={s.accDetailIban} numberOfLines={1} ellipsizeMode="middle">
                {selectedAccount.iban || selectedAccount.accountNumber}
              </Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Crypto Portfolio</Text>
            <View style={s.tabSwitch}>
              {(["portfolio","market"] as const).map(tab => (
                <TouchableOpacity key={tab} style={[s.tabSwitchBtn, cryptoTab === tab && s.tabSwitchActive]} onPress={() => { setCryptoTab(tab); Haptics.selectionAsync(); }}>
                  <Text style={[s.tabSwitchText, cryptoTab === tab && { color: COLORS.orange }]}>
                    {tab === "portfolio" ? "My Assets" : "Market"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.cryptoList}>
            {(cryptoTab === "portfolio"
              ? liveCrypto.filter(a => a.usdValue > 0)
              : liveCrypto
            ).slice(0, cryptoTab === "portfolio" ? 6 : 8).map((asset) => (
              <CryptoRow
                key={asset.id}
                asset={asset}
                onPress={() => router.push({ pathname: "/wallet/crypto-wallet", params: { assetId: asset.id } })}
              />
            ))}
          </View>
          <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push("/wallet/crypto-wallet")}>
            <LinearGradient colors={[COLORS.orange, "#D35400"]} style={s.viewAllBtnInner}>
              <Ionicons name="logo-bitcoin" size={16} color="#fff" />
              <Text style={s.viewAllBtnText}>Open Trading Terminal</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>FX Rates</Text>
            {fxIsLive ? (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>Live</Text>
              </View>
            ) : (
              <Text style={s.sectionMuted}>Updating...</Text>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {liveFxRates.filter((fx: any) => fx.from && fx.to).map((fx: any) => {
              const isPos = (fx.change ?? 0) >= 0;
              return (
                <TouchableOpacity key={`${fx.from}-${fx.to}`} style={s.fxCard} activeOpacity={0.8} onPress={() => setShowConverter(true)}>
                  <Text style={s.fxPair}>{fx.from}/{fx.to}</Text>
                  <Text style={s.fxRate}>{fx.rate >= 1000 ? fx.rate.toLocaleString("en-US", { maximumFractionDigits: 0 }) : fx.rate >= 10 ? fx.rate.toFixed(2) : fx.rate.toFixed(4)}</Text>
                  <View style={[s.fxChangeBadge, { backgroundColor: isPos ? "#27AE6018" : "#E74C3C18" }]}>
                    <Text style={[s.fxChange, { color: isPos ? COLORS.success : COLORS.danger }]}>{isPos ? "▲" : "▼"} {Math.abs(fx.change ?? 0).toFixed(2)}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>العملات العالمية</Text>
            <Text style={s.sectionMuted}>70 دولة · ورقية + رقمية</Text>
          </View>
          <TouchableOpacity style={s.currencyDirectoryBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCurrencyPicker(true); }} activeOpacity={0.85}>
            <LinearGradient colors={["#1E1409", "#120D06"]} style={s.currencyDirectoryInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.currencyDirectoryLeft}>
                <View style={s.currencyDirectoryIconRow}>
                  {["🇺🇸","🇪🇺","🇬🇧","🇮🇶","🇸🇦","🇯🇵","₿","Ξ"].map((f, i) => (
                    <Text key={i} style={s.currencyDirectoryFlag}>{f}</Text>
                  ))}
                  <View style={s.currencyDirectoryMore}>
                    <Text style={s.currencyDirectoryMoreText}>+75</Text>
                  </View>
                </View>
                <Text style={s.currencyDirectoryTitle}>دليل العملات الكامل</Text>
                <Text style={s.currencyDirectorySub}>ابحث واختر من 70 عملة ورقية + 13 رقمية</Text>
              </View>
              <View style={s.currencyDirectoryArrow}>
                <Ionicons name="chevron-forward" size={22} color={COLORS.orange} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 12 }}>
            {WORLD_CURRENCIES.slice(0, 12).map((c) => (
              <TouchableOpacity key={c.currency} style={s.currencyQuickChip} onPress={() => { Haptics.selectionAsync(); setShowCurrencyPicker(true); }}>
                <Text style={s.currencyQuickFlag}>{c.flag}</Text>
                <Text style={s.currencyQuickCode}>{c.currency}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.currencyQuickChip, { borderColor: COLORS.orange + "50", backgroundColor: COLORS.orangeDim }]} onPress={() => setShowCurrencyPicker(true)}>
              <Text style={{ fontSize: 14 }}>•••</Text>
              <Text style={[s.currencyQuickCode, { color: COLORS.orange }]}>الكل</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Remittance</Text>
            <TouchableOpacity onPress={() => router.push("/wallet/send")}>
              <Text style={s.sectionLink}>Send Now →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {REMITTANCE_PROVIDERS.map((p) => (
              <TouchableOpacity key={p.id} style={[s.remitCard, { backgroundColor: p.bgColor, borderColor: p.color + "30" }]} onPress={() => router.push("/wallet/send")} activeOpacity={0.85}>
                <Text style={s.remitLogo}>{p.logo}</Text>
                <Text style={[s.remitName, { color: p.color }]}>{p.shortName}</Text>
                <Text style={s.remitFee}>${p.fee} fee</Text>
                <Text style={s.remitEta}>{p.eta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.corridorRow}>
            <Text style={s.corridorLabel}>Popular:</Text>
            <Text style={s.corridorFlags}>🇮🇶 🇸🇾 🇪🇬 🇮🇳 🇵🇭 🇲🇽 🇳🇬 🇵🇰 🇧🇩 🇲🇦</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity><Text style={s.sectionLink}>All →</Text></TouchableOpacity>
          </View>
          <View style={s.txList}>
            {txLoading ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <ActivityIndicator size="small" color={COLORS.orange} />
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>Loading transactions...</Text>
              </View>
            ) : liveTransactions.slice(0, 9).map((tx, i, arr) => (
              <React.Fragment key={tx.id}>
                <TxRow tx={tx} />
                {i < arr.length - 1 && <View style={s.txDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

      </ScrollView>

      <CurrencyConverterModal visible={showConverter} onClose={() => setShowConverter(false)} />

      <CurrencyPickerSheet
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="دليل العملات"
        onSelect={(currency) => {
          setShowCurrencyPicker(false);
        }}
      />

      <Modal visible={showInsureModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.sheetHandle} />
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#8E44AD18", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1.5, borderColor: "#8E44AD40" }}>
                <Ionicons name="shield-checkmark" size={34} color="#8E44AD" />
              </View>
              <Text style={[s.modalTitle, { textAlign: "center" }]}>NEXUS Insurance</Text>
              <Text style={[s.modalSub, { textAlign: "center" }]}>Your digital assets + fiat balances protected</Text>
            </View>
            {[
              { icon: "shield-half-outline", title: "Crypto Coverage", sub: "Up to $100K per wallet address", color: "#F7931A" },
              { icon: "card-outline", title: "Card Protection", sub: "Zero liability on unauthorized transactions", color: "#2980B9" },
              { icon: "globe-outline", title: "Remittance Insurance", sub: "Money-back guarantee on failed transfers", color: "#27AE60" },
              { icon: "lock-closed-outline", title: "Account Security", sub: "Biometric + 2FA loss coverage", color: "#9B59B6" },
            ].map((item) => (
              <View key={item.title} style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14, backgroundColor: "#111", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A2A2A" }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + "18", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white }}>{item.title}</Text>
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{item.sub}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={{ backgroundColor: "#8E44AD", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 8 }}
              onPress={() => setShowInsureModal(false)}
            >
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" }}>Coming Soon — Notify Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowInsureModal(false)}>
              <Text style={s.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StarryBackground>
  );
}

const s = StyleSheet.create({
  scroll: { paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.white, letterSpacing: -0.5 },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: -2 },
  headerRight: { flexDirection: "row", gap: 8, marginTop: 4 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center" },
  balanceCard: { marginHorizontal: 16, borderRadius: 26, padding: 22, marginBottom: 22, borderWidth: 1, borderColor: "rgba(230,126,34,0.18)" },
  balanceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  balanceLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.45)" },
  balanceValue: { fontFamily: "Poppins_700Bold", fontSize: 42, color: COLORS.white, letterSpacing: -1.5, marginBottom: 14 },
  balanceBreakdown: { flexDirection: "row", alignItems: "center", gap: 0, marginBottom: 14 },
  balanceDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 16 },
  balanceBreakdownItem: { gap: 2 },
  balanceBreakdownValue: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  balanceBreakdownLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.4)" },
  balanceBadgeRow: { flexDirection: "row", gap: 8 },
  balanceBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(39,174,96,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(39,174,96,0.2)" },
  balanceBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.success },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, marginBottom: 26 },
  quickItem: { width: "25%", alignItems: "center", gap: 6, paddingVertical: 10 },
  quickIconWrap: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  quickLabel: { fontFamily: "Poppins_500Medium", fontSize: 10.5, color: COLORS.textSecondary },
  section: { marginBottom: 26 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  sectionLink: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.orange },
  sectionMuted: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  accCard: { width: CARD_W, backgroundColor: "#1A1A1A", borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: "#2A2A2A", gap: 4 },
  accTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  accFlag: { fontSize: 22 },
  accActiveDot: { width: 8, height: 8, borderRadius: 4 },
  accCurrency: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.textSecondary },
  accBalance: { fontFamily: "Poppins_700Bold", fontSize: 19, color: COLORS.white },
  accRegion: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  accDetail: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#1A1A1A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2A2A2A", gap: 10 },
  accDetailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accDetailFlag: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  accDetailCurrency: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.white },
  accDetailRegion: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  accDetailBalance: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  accDetailDivider: { height: 1, backgroundColor: "#2A2A2A" },
  accDetailIbanLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  accDetailIban: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white, letterSpacing: 0.5 },
  tabSwitch: { flexDirection: "row", backgroundColor: "#1A1A1A", borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A" },
  tabSwitchBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  tabSwitchActive: { backgroundColor: COLORS.orangeDim },
  tabSwitchText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary },
  cryptoList: { backgroundColor: "#1A1A1A", marginHorizontal: 16, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 12 },
  cryptoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#242424", gap: 12 },
  cryptoIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  cryptoEmoji: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  cryptoInfo: { flex: 1 },
  cryptoName: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.white },
  cryptoFullName: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  cryptoRight: { alignItems: "flex-end", gap: 4 },
  cryptoPrice: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.white },
  cryptoChangeBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cryptoChange: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  viewAllBtn: { marginHorizontal: 16, borderRadius: 14, overflow: "hidden" },
  viewAllBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  viewAllBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(39,174,96,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.success },
  fxCard: { backgroundColor: "#1A1A1A", borderRadius: 16, padding: 14, minWidth: 120, gap: 5, borderWidth: 1, borderColor: "#2A2A2A" },
  fxPair: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textMuted },
  fxRate: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white },
  fxChangeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  fxChange: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  regionChip: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#2A2A2A" },
  regionChipActive: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange + "50" },
  regionChipText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary },
  currencyGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 6 },
  currencyGridItem: { width: (width - 48) / 4, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 10, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "#2A2A2A" },
  currencyGridFlag: { fontSize: 20 },
  currencyGridCode: { fontFamily: "Poppins_700Bold", fontSize: 10, color: COLORS.textSecondary },
  currencyGridRate: { fontFamily: "Poppins_500Medium", fontSize: 9, color: COLORS.textMuted },
  showMoreBtn: { marginHorizontal: 16, marginTop: 8, alignItems: "center", paddingVertical: 10 },
  showMoreText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.orange },
  remitCard: { width: 110, alignItems: "center", borderRadius: 16, padding: 14, gap: 3, borderWidth: 1 },
  remitLogo: { fontSize: 24 },
  remitName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  remitFee: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  remitEta: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary },
  corridorRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  corridorLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary },
  corridorFlags: { fontSize: 18, letterSpacing: 2 },
  txList: { backgroundColor: "#1A1A1A", marginHorizontal: 16, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A" },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  txDivider: { height: 1, backgroundColor: "#242424", marginHorizontal: 16 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  txSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  txRight: { alignItems: "flex-end", gap: 2 },
  txValue: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  txTime: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#181818", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: "#2A2A2A" },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.white, marginBottom: 2 },
  modalSub: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  converterRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  converterBox: { flex: 1, backgroundColor: "#111", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A" },
  converterMid: { alignItems: "center", justifyContent: "center" },
  currencyItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  currencyItemActive: { backgroundColor: COLORS.orangeDim },
  currencyFlag: { fontSize: 16 },
  currencyCode: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary },
  converterInput: { backgroundColor: "#111", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontFamily: "Poppins_700Bold", fontSize: 24, color: COLORS.white, borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 14 },
  converterResult: { backgroundColor: "#0D0D0D", borderRadius: 14, padding: 16, gap: 4, marginBottom: 20, borderWidth: 1, borderColor: COLORS.orange + "30" },
  converterResultLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted },
  converterResultValue: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.orange, letterSpacing: -0.5 },
  closeBtn: { backgroundColor: "#2A2A2A", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
  currencyDirectoryBtn: { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: COLORS.orange + "30" },
  currencyDirectoryInner: { flexDirection: "row", alignItems: "center", padding: 18, gap: 12 },
  currencyDirectoryLeft: { flex: 1, gap: 8 },
  currencyDirectoryIconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  currencyDirectoryFlag: { fontSize: 18 },
  currencyDirectoryMore: { backgroundColor: COLORS.orangeDim, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.orange + "40" },
  currencyDirectoryMoreText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: COLORS.orange },
  currencyDirectoryTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white },
  currencyDirectorySub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  currencyDirectoryArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center" },
  currencyQuickChip: { backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "#2A2A2A" },
  currencyQuickFlag: { fontSize: 20 },
  currencyQuickCode: { fontFamily: "Poppins_700Bold", fontSize: 10, color: COLORS.textSecondary },
  userPill: { flexDirection: "row", alignItems: "center", gap: 10 },
  userAvatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.orange + "40",
  },
  userAvatarEmoji: { fontSize: 18 },
});
