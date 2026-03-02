import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Share,
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { COLORS } from "@/constants/colors";
import { FIAT_ACCOUNTS } from "@/constants/walletData";

const { width } = Dimensions.get("window");
const QR_SIZE = width - 100;

const WALLET_ID = "NEXUS:USD:b3f8a12c-9d4e-4a7c-bf12-8e9d4a7cb3f8";

export default function QRPayScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"receive" | "scan">("receive");
  const [selectedCurrency, setSelectedCurrency] = useState(FIAT_ACCOUNTS[0]);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const qrValue = `${WALLET_ID}:${selectedCurrency.currency}`;

  const handleCopy = useCallback(() => {
    Clipboard.setString(qrValue);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [qrValue]);

  const handleShare = useCallback(async () => {
    Haptics.selectionAsync();
    await Share.share({
      message: `Pay me via NEXUS Wallet:\n${qrValue}`,
      title: "My NEXUS Wallet Address",
    });
  }, [qrValue]);

  const handleBarcodeScan = useCallback((result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(result.data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [scanned]);

  const handleScanAgain = useCallback(() => {
    setScanned(false);
    setScannedData(null);
  }, []);

  const handleConfirmPayment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D0D0D", "#111111"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        {(["receive", "scan"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              setTab(t);
              Haptics.selectionAsync();
            }}
          >
            <Ionicons
              name={t === "receive" ? "qr-code-outline" : "scan-outline"}
              size={16}
              color={tab === t ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "receive" ? "Receive" : "Scan to Pay"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "receive" ? (
        <View style={styles.receiveContainer}>
          <Text style={styles.receiveHint}>
            Share this code to receive payment instantly
          </Text>

          <View style={styles.currencyRow}>
            {FIAT_ACCOUNTS.slice(0, 4).map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.currencyBtn,
                  selectedCurrency.id === acc.id && styles.currencyBtnActive,
                ]}
                onPress={() => {
                  setSelectedCurrency(acc);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.currencyFlag}>{acc.flag}</Text>
                <Text
                  style={[
                    styles.currencyCode,
                    selectedCurrency.id === acc.id && { color: COLORS.white },
                  ]}
                >
                  {acc.currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.qrWrapper}>
            <LinearGradient
              colors={["#1A1A1A", "#222222"]}
              style={styles.qrCard}
            >
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrValue}
                  size={QR_SIZE - 60}
                  color="#FFFFFF"
                  backgroundColor="transparent"
                  logo={undefined}
                />
              </View>
              <View style={styles.qrLabel}>
                <Text style={styles.qrLabelFlag}>{selectedCurrency.flag}</Text>
                <Text style={styles.qrLabelText}>
                  {selectedCurrency.currency} · NEXUS Wallet
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
              {qrValue}
            </Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={18}
                color={copied ? COLORS.success : COLORS.orange}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleCopy}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>{copied ? "Copied!" : "Copy Address"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.scanContainer}>
          {Platform.OS === "web" ? (
            <View style={styles.webScanPlaceholder}>
              <Ionicons name="scan-outline" size={64} color="rgba(255,255,255,0.2)" />
              <Text style={styles.webScanTitle}>Camera Scanner</Text>
              <Text style={styles.webScanSub}>
                QR scanning requires the Expo Go app on a physical device
              </Text>
            </View>
          ) : scanned && scannedData ? (
            <View style={styles.scannedResult}>
              <View style={styles.scannedSuccess}>
                <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
                <Text style={styles.scannedTitle}>QR Detected</Text>
                <Text style={styles.scannedAddress} numberOfLines={2}>
                  {scannedData}
                </Text>
              </View>
              <View style={styles.scannedActions}>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPayment}>
                  <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.confirmBtnInner}>
                    <Text style={styles.confirmBtnText}>Confirm Payment</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
                  <Text style={styles.scanAgainText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : permission?.granted ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScan}
              />
              <View style={styles.scanOverlay} pointerEvents="none">
                <View style={styles.scanFrame}>
                  <View style={[styles.scanCorner, styles.scanCornerTL]} />
                  <View style={[styles.scanCorner, styles.scanCornerTR]} />
                  <View style={[styles.scanCorner, styles.scanCornerBL]} />
                  <View style={[styles.scanCorner, styles.scanCornerBR]} />
                </View>
                <Text style={styles.scanInstruction}>
                  Point at any NEXUS QR code to pay
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={52} color="rgba(255,255,255,0.3)" />
              <Text style={styles.permissionTitle}>Camera Access Needed</Text>
              <Text style={styles.permissionSub}>
                Allow camera to scan QR codes for instant payment
              </Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={[styles.nfcBanner, { marginBottom: bottomPad + 8 }]}>
        <Ionicons name="radio-outline" size={16} color={COLORS.orange} />
        <Text style={styles.nfcBannerText}>
          NFC Tap-to-Pay available on physical device with Nexus native app
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: "#2A2A2A" },
  tabText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  receiveContainer: { flex: 1, alignItems: "center", paddingHorizontal: 20 },
  receiveHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  currencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  currencyBtnActive: {
    backgroundColor: COLORS.orangeDim,
    borderColor: COLORS.orange,
  },
  currencyFlag: { fontSize: 14 },
  currencyCode: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary },
  qrWrapper: { width: "100%", marginBottom: 16 },
  qrCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  qrContainer: { padding: 12, borderRadius: 12, backgroundColor: "#FFFFFF" },
  qrLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  qrLabelFlag: { fontSize: 18 },
  qrLabelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  copyBtn: { padding: 4 },
  actionRow: { flexDirection: "row", gap: 12, width: "100%" },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  actionBtnPrimary: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange },
  actionBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white },
  scanContainer: { flex: 1 },
  webScanPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  webScanTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  webScanSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
  cameraWrapper: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  scanCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: COLORS.orange,
    borderWidth: 3,
  },
  scanCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  scanCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  scanCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  scanCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanInstruction: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.white, textAlign: "center" },
  scannedResult: { flex: 1, alignItems: "center", justifyContent: "space-between", padding: 32 },
  scannedSuccess: { alignItems: "center", gap: 14 },
  scannedTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.white },
  scannedAddress: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
  scannedActions: { width: "100%", gap: 12 },
  confirmBtn: { borderRadius: 16, overflow: "hidden" },
  confirmBtnInner: { paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  scanAgainBtn: { alignItems: "center", paddingVertical: 12 },
  scanAgainText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.textSecondary },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  permissionTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white },
  permissionSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
  permissionBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  permissionBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  nfcBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: COLORS.orangeDim,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(230,126,34,0.2)",
  },
  nfcBannerText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.orange, flex: 1 },
});
