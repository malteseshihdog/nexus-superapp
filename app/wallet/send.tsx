import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";
import {
  FIAT_ACCOUNTS,
  FX_RATES,
  REMITTANCE_PROVIDERS,
  REMITTANCE_CORRIDORS,
  type RemittanceProvider,
  type RemittanceCorridor,
} from "@/constants/walletData";

const { width } = Dimensions.get("window");

type SendTab = "internal" | "remit";

const INTERNAL_CONTACTS = [
  { id: "c1", name: "Alexandra Chen", peep: "@dev_alchemy", initials: "AC", color: "#E67E22" },
  { id: "c2", name: "Marcus Webb", peep: "@satoshi_vision", initials: "MW", color: "#F7931A" },
  { id: "c3", name: "Priya Sharma", peep: "@privacy_first", initials: "PS", color: "#27AE60" },
  { id: "c4", name: "James Okonkwo", peep: "@defi_depths", initials: "JO", color: "#9B59B6" },
];

function SuccessModal({ amount, currency, recipient, onClose }: {
  amount: string; currency: string; recipient: string; onClose: () => void;
}) {
  return (
    <View style={styles.successOverlay}>
      <View style={styles.successCard}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
        <Text style={styles.successTitle}>Sent Successfully!</Text>
        <Text style={styles.successAmount}>
          {currency} {amount}
        </Text>
        <Text style={styles.successSub}>to {recipient}</Text>
        <Text style={styles.successTime}>Processed in &lt; 2 seconds</Text>
        <TouchableOpacity style={styles.successBtn} onPress={onClose}>
          <Text style={styles.successBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initTab = params.tab === "remit" ? "remit" : "internal";
  const [tab, setTab] = useState<SendTab>(initTab);
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(FIAT_ACCOUNTS[0]);
  const [selectedContact, setSelectedContact] = useState(INTERNAL_CONTACTS[0]);
  const [selectedProvider, setSelectedProvider] = useState<RemittanceProvider>(REMITTANCE_PROVIDERS[0]);
  const [selectedCorridor, setSelectedCorridor] = useState<RemittanceCorridor>(REMITTANCE_CORRIDORS[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const fxRate = FX_RATES.find(
    (r) => r.from === selectedAccount.currency && r.to === selectedCorridor.currency
  ) || { rate: 1310.5, change: 0.08 };

  const convertedAmount = amount
    ? (parseFloat(amount) * fxRate.rate).toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "0";

  const fee = tab === "remit" ? selectedProvider.fee : 0;
  const totalAmount = amount ? (parseFloat(amount) + fee).toFixed(2) : "0.00";

  const handleSend = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSending(true);
    try {
      const body = tab === "internal"
        ? {
            fromCurrency: selectedAccount.currency,
            amount: parseFloat(amount),
            recipientName: selectedContact.name,
            type: "send",
            label: `Send to ${selectedContact.name}`,
            sub: `${selectedContact.peep} · ${selectedAccount.currency}`,
          }
        : {
            fromCurrency: selectedAccount.currency,
            amount: parseFloat(amount) + fee,
            recipientName: selectedCorridor.country,
            type: "remit",
            label: `${selectedProvider.name} Transfer`,
            sub: `To ${selectedCorridor.country} · ${selectedCorridor.currency}`,
            isRemittance: true,
            providerName: selectedProvider.name,
            toCurrency: selectedCorridor.currency,
          };
      const res = await apiRequest("POST", "/api/wallet/send", body);
      const json = await res.json();
      if (json.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/wallet/balances"] });
        setShowSuccess(true);
      } else {
        Alert.alert("Error", json.error ?? "Transaction failed");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Transaction failed";
      if (msg.includes("Insufficient")) {
        Alert.alert("Insufficient Balance", `You don't have enough ${selectedAccount.currency} for this transfer.`);
      } else {
        Alert.alert("Error", "Could not complete transfer. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  }, [amount, tab, selectedAccount, selectedContact, selectedProvider, selectedCorridor, fee, queryClient]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D0D0D", "#111111"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        {([
          { key: "internal", label: "Internal", icon: "flash-outline" },
          { key: "remit", label: "Remittance", icon: "globe-outline" },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => { setTab(t.key); Haptics.selectionAsync(); }}
          >
            <Ionicons name={t.icon} size={15} color={tab === t.key ? COLORS.orange : COLORS.textSecondary} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
      >
        {tab === "internal" ? (
          <>
            <Text style={styles.sectionLabel}>Select Recipient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsRow}>
              {INTERNAL_CONTACTS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.contactCard, selectedContact.id === c.id && styles.contactCardActive]}
                  onPress={() => { setSelectedContact(c); Haptics.selectionAsync(); }}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: c.color }]}>
                    <Text style={styles.contactInitials}>{c.initials}</Text>
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.contactPeep}>{c.peep}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>From Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {FIAT_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accChip, selectedAccount.id === acc.id && styles.accChipActive]}
                  onPress={() => { setSelectedAccount(acc); Haptics.selectionAsync(); }}
                >
                  <Text style={styles.accFlag}>{acc.flag}</Text>
                  <View>
                    <Text style={[styles.accCode, selectedAccount.id === acc.id && { color: COLORS.white }]}>
                      {acc.currency}
                    </Text>
                    <Text style={styles.accBalance}>
                      {acc.symbol}{acc.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Provider</Text>
            <View style={styles.providersRow}>
              {REMITTANCE_PROVIDERS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.providerCard, selectedProvider.id === p.id && styles.providerCardActive, { backgroundColor: p.bgColor }]}
                  onPress={() => { setSelectedProvider(p); Haptics.selectionAsync(); }}
                >
                  <Text style={styles.providerLogo}>{p.logo}</Text>
                  <Text style={[styles.providerName, { color: p.color }]}>{p.shortName}</Text>
                  <Text style={styles.providerFee}>${p.fee} fee</Text>
                  <Text style={styles.providerEta}>{p.eta}</Text>
                  {selectedProvider.id === p.id && (
                    <Ionicons name="checkmark-circle" size={16} color={p.color} style={styles.providerCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Destination Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {REMITTANCE_CORRIDORS.filter((c) => c.popular).map((c) => (
                <TouchableOpacity
                  key={c.country}
                  style={[styles.corridorChip, selectedCorridor.country === c.country && styles.corridorChipActive]}
                  onPress={() => { setSelectedCorridor(c); Haptics.selectionAsync(); }}
                >
                  <Text style={styles.corridorFlag}>{c.flag}</Text>
                  <Text style={[styles.corridorCountry, selectedCorridor.country === c.country && { color: COLORS.white }]}>
                    {c.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.fxCard}>
              <View style={styles.fxRow}>
                <Text style={styles.fxLabel}>Exchange Rate</Text>
                <Text style={styles.fxRate}>
                  1 {selectedAccount.currency} = {fxRate.rate.toLocaleString()} {selectedCorridor.currency}
                </Text>
              </View>
              <View style={styles.fxRow}>
                <Text style={styles.fxLabel}>Transfer Fee ({selectedProvider.shortName})</Text>
                <Text style={styles.fxFee}>${selectedProvider.fee}</Text>
              </View>
              <View style={styles.fxRow}>
                <Text style={styles.fxLabel}>Delivery</Text>
                <Text style={styles.fxEta}>{selectedProvider.eta}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Amount ({selectedAccount.currency})</Text>
        <View style={styles.amountInputWrap}>
          <Text style={styles.amountSymbol}>{selectedAccount.symbol}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="decimal-pad"
          />
        </View>

        {tab === "remit" && amount ? (
          <View style={styles.convertRow}>
            <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
            <Text style={styles.convertText}>
              ≈ {selectedCorridor.currency} {convertedAmount}
            </Text>
          </View>
        ) : null}

        <View style={styles.quickAmounts}>
          {["50", "100", "200", "500"].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.quickAmt, amount === v && styles.quickAmtActive]}
              onPress={() => { setAmount(v); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.quickAmtText, amount === v && { color: COLORS.orange }]}>
                {selectedAccount.symbol}{v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "remit" && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deducted</Text>
            <Text style={styles.totalValue}>{selectedAccount.symbol}{totalAmount}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, (!amount || parseFloat(amount) <= 0 || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isSending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={(!amount || parseFloat(amount) <= 0) ? ["#333", "#333"] : [COLORS.orange, "#D35400"]}
            style={styles.sendBtnInner}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
            <Text style={styles.sendBtnText}>
              {isSending ? "Processing..." : tab === "internal" ? "Send Instantly" : `Send via ${selectedProvider.shortName}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {showSuccess && (
        <SuccessModal
          amount={amount}
          currency={selectedAccount.currency}
          recipient={tab === "internal" ? selectedContact.name : `${selectedCorridor.country} (${selectedCorridor.currency})`}
          onClose={() => {
            setShowSuccess(false);
            setAmount("");
            router.back();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  tabBar: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  tabActive: { backgroundColor: "#2A2A2A" },
  tabText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  contactsRow: { marginBottom: 20, marginHorizontal: -4 },
  contactCard: { alignItems: "center", marginHorizontal: 6, width: 76, padding: 12, backgroundColor: "#1A1A1A", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  contactCardActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeDim },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  contactInitials: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
  contactName: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: COLORS.white, textAlign: "center" },
  contactPeep: { fontFamily: "Poppins_400Regular", fontSize: 9, color: COLORS.textMuted, textAlign: "center" },
  accChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  accChipActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeDim },
  accFlag: { fontSize: 18 },
  accCode: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
  accBalance: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  providersRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  providerCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "transparent", gap: 3, position: "relative" },
  providerCardActive: { borderColor: "rgba(255,255,255,0.2)" },
  providerLogo: { fontSize: 20 },
  providerName: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  providerFee: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary },
  providerEta: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textMuted },
  providerCheck: { position: "absolute", top: 8, right: 8 },
  corridorChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  corridorChipActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeDim },
  corridorFlag: { fontSize: 16 },
  corridorCountry: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary },
  fxCard: { backgroundColor: "#1A1A1A", borderRadius: 16, padding: 16, marginBottom: 20, gap: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  fxRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fxLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
  fxRate: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white },
  fxFee: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#E74C3C" },
  fxEta: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.success },
  amountInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  amountSymbol: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 36, color: COLORS.white },
  convertRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  convertText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.orange },
  quickAmounts: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickAmt: { flex: 1, alignItems: "center", paddingVertical: 10, backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  quickAmtActive: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange },
  quickAmtText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingVertical: 10 },
  totalLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white },
  sendBtn: { borderRadius: 18, overflow: "hidden", shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  sendBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center", zIndex: 100 },
  successCard: { backgroundColor: "#1A1A1A", borderRadius: 24, padding: 32, alignItems: "center", width: width - 60, gap: 10, borderWidth: 1, borderColor: "#2E2E2E" },
  successTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.white },
  successAmount: { fontFamily: "Poppins_700Bold", fontSize: 32, color: COLORS.success, letterSpacing: -1 },
  successSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
  successTime: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  successBtn: { backgroundColor: COLORS.orange, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14, marginTop: 8 },
  successBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
