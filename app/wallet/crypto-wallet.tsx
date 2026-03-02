import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  ScrollView, Dimensions, TextInput, Modal, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Text as SvgText, Circle, Rect } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";
import { CRYPTO_ASSETS, CRYPTO_SEED_WORDS, generateCandleData, type CryptoAsset } from "@/constants/walletData";

const { width } = Dimensions.get("window");
const CHART_W = width - 32;
const CHART_H = 200;

function generateSeedPhrase(): string[] {
  return [...CRYPTO_SEED_WORDS].sort(() => Math.random() - 0.5).slice(0, 12);
}

type Timeframe = "1H" | "4H" | "1D" | "1W" | "1M";
type OrderType = "market" | "limit" | "stop";
type TradeAction = "buy" | "sell" | "send" | "receive";

function PriceChart({ asset, timeframe }: { asset: CryptoAsset; timeframe: Timeframe }) {
  const counts: Record<Timeframe, number> = { "1H": 60, "4H": 48, "1D": 30, "1W": 28, "1M": 30 };
  const data = useMemo(() => {
    const candles = generateCandleData(asset.usdPrice, counts[timeframe]);
    return candles.map(c => c.close);
  }, [asset.id, timeframe]);

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const toY = (v: number) => CHART_H - 10 - ((v - minVal) / range) * (CHART_H - 30);
  const toX = (i: number) => (i / (data.length - 1)) * CHART_W;

  const pathD = data.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const fillD = pathD + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? "#27AE60" : "#E74C3C";

  const labelCount = 5;
  const yLabels = Array.from({ length: labelCount }, (_, i) => {
    const val = minVal + (range / (labelCount - 1)) * i;
    return { y: toY(val), label: val >= 1000 ? `$${(val / 1000).toFixed(1)}K` : `$${val.toFixed(2)}` };
  });

  return (
    <View style={{ marginHorizontal: 0 }}>
      <Svg width={CHART_W} height={CHART_H} style={{ overflow: "hidden" }}>
        <Defs>
          <SvgGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        {yLabels.map((yl, i) => (
          <React.Fragment key={i}>
            <Line x1={0} y1={yl.y} x2={CHART_W} y2={yl.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <SvgText x={4} y={yl.y - 3} fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="System">{yl.label}</SvgText>
          </React.Fragment>
        ))}
        <Path d={fillD} fill="url(#chartFill)" />
        <Path d={pathD} stroke={lineColor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={4} fill={lineColor} />
        <Circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={8} fill={lineColor} fillOpacity={0.2} />
      </Svg>
    </View>
  );
}

function CandleChart({ asset, timeframe }: { asset: CryptoAsset; timeframe: Timeframe }) {
  const counts: Record<Timeframe, number> = { "1H": 30, "4H": 30, "1D": 30, "1W": 30, "1M": 30 };
  const candles = useMemo(() => generateCandleData(asset.usdPrice, counts[timeframe]), [asset.id, timeframe]);

  const allHighs = candles.map(c => c.high);
  const allLows = candles.map(c => c.low);
  const minVal = Math.min(...allLows);
  const maxVal = Math.max(...allHighs);
  const range = maxVal - minVal || 1;

  const toY = (v: number) => CHART_H - 15 - ((v - minVal) / range) * (CHART_H - 30);
  const candleW = (CHART_W / candles.length) * 0.65;
  const gap = CHART_W / candles.length;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {candles.map((c, i) => {
        const isGreen = c.close >= c.open;
        const col = isGreen ? "#27AE60" : "#E74C3C";
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(bodyBot - bodyTop, 1);
        const cx = i * gap + gap / 2;
        return (
          <React.Fragment key={i}>
            <Line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth={1} />
            <Rect x={cx - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={col} fillOpacity={0.9} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function CryptoWalletScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const { data: livePriceData } = useQuery<{ prices: { id: string; symbol: string; usdPrice: number; change24h: number }[] }>({
    queryKey: ["/api/wallet/crypto-prices"],
    refetchInterval: 2 * 60 * 1000,
    staleTime: 90 * 1000,
    retry: 1,
  });

  const liveAssets = CRYPTO_ASSETS.map((asset) => {
    const live = livePriceData?.prices?.find(p => p.symbol === asset.symbol);
    if (!live) return asset;
    return { ...asset, usdPrice: live.usdPrice, change24h: live.change24h };
  });

  const initialAsset = liveAssets.find(a => a.id === params.assetId) ?? liveAssets[0];
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(initialAsset);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [tradeAction, setTradeAction] = useState<TradeAction>("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [seedRevealed, setSeedRevealed] = useState(false);
  const [seedPhrase] = useState(generateSeedPhrase);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(CRYPTO_ASSETS.filter(a => !!a.isFavorite).map(a => a.id)));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalUSD = liveAssets.reduce((s, c) => s + c.usdValue, 0);
  const isUp = selectedAsset.change24h >= 0;
  const priceColor = isUp ? COLORS.success : COLORS.danger;

  const tradeUSD = tradeAmount ? parseFloat(tradeAmount) : 0;
  const tradeCrypto = tradeUSD / selectedAsset.usdPrice;

  const handleTrade = useCallback(() => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTradeAmount(""); setLimitPrice(""); }, 2500);
  }, [tradeAmount]);

  const TIMEFRAMES: Timeframe[] = ["1H", "4H", "1D", "1W", "1M"];

  return (
    <View style={sty.container}>
      <LinearGradient colors={["#0A0A0F", "#0D0D0D"]} style={StyleSheet.absoluteFill} />

      <View style={[sty.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={sty.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <TouchableOpacity style={sty.assetSelector} onPress={() => setShowAssetPicker(true)}>
          <View style={[sty.assetDot, { backgroundColor: selectedAsset.color }]} />
          <Text style={sty.assetSelectorText}>{selectedAsset.symbol}/USD</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <View style={sty.headerRight}>
          <TouchableOpacity style={sty.headerBtn} onPress={() => setShowSeed(true)}>
            <Ionicons name="key-outline" size={18} color={COLORS.orange} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[sty.scroll, { paddingBottom: bottomPad + 40 }]}>

        <View style={sty.priceSection}>
          <View style={sty.priceLabelRow}>
            <Text style={sty.assetName}>{selectedAsset.name}</Text>
            <View style={[sty.changeBadge, { backgroundColor: isUp ? "#27AE6022" : "#E74C3C22", borderColor: isUp ? "#27AE6040" : "#E74C3C40" }]}>
              <Ionicons name={isUp ? "trending-up" : "trending-down"} size={12} color={priceColor} />
              <Text style={[sty.changeBadgeText, { color: priceColor }]}>
                {isUp ? "+" : ""}{selectedAsset.change24h.toFixed(2)}% 24h
              </Text>
            </View>
          </View>
          <Text style={sty.priceValue}>
            ${selectedAsset.usdPrice >= 1000
              ? selectedAsset.usdPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : selectedAsset.usdPrice.toFixed(selectedAsset.usdPrice < 1 ? 6 : 4)}
          </Text>
          <View style={sty.priceMetaRow}>
            <View style={sty.priceMeta}>
              <Text style={sty.priceMetaLabel}>Mkt Cap</Text>
              <Text style={sty.priceMetaValue}>{selectedAsset.marketCap}</Text>
            </View>
            <View style={sty.priceMetaSep} />
            <View style={sty.priceMeta}>
              <Text style={sty.priceMetaLabel}>Vol 24H</Text>
              <Text style={sty.priceMetaValue}>{selectedAsset.volume24h}</Text>
            </View>
            <View style={sty.priceMetaSep} />
            <View style={sty.priceMeta}>
              <Text style={sty.priceMetaLabel}>My Balance</Text>
              <Text style={sty.priceMetaValue}>{selectedAsset.balance} {selectedAsset.symbol}</Text>
            </View>
          </View>
        </View>

        <View style={sty.chartContainer}>
          <View style={sty.chartControls}>
            <View style={sty.tfRow}>
              {TIMEFRAMES.map(tf => (
                <TouchableOpacity key={tf} style={[sty.tfBtn, timeframe === tf && sty.tfBtnActive]} onPress={() => { setTimeframe(tf); Haptics.selectionAsync(); }}>
                  <Text style={[sty.tfText, timeframe === tf && { color: COLORS.orange }]}>{tf}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={sty.chartTypeRow}>
              <TouchableOpacity style={[sty.chartTypeBtn, chartType === "line" && sty.chartTypeBtnActive]} onPress={() => setChartType("line")}>
                <Ionicons name="trending-up-outline" size={14} color={chartType === "line" ? COLORS.orange : COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={[sty.chartTypeBtn, chartType === "candle" && sty.chartTypeBtnActive]} onPress={() => setChartType("candle")}>
                <Ionicons name="bar-chart-outline" size={14} color={chartType === "candle" ? COLORS.orange : COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={sty.chartWrap}>
            {chartType === "line"
              ? <PriceChart asset={selectedAsset} timeframe={timeframe} />
              : <CandleChart asset={selectedAsset} timeframe={timeframe} />
            }
          </View>
        </View>

        <View style={sty.tradeCard}>
          <View style={sty.tradeActionRow}>
            {(["buy","sell","send","receive"] as TradeAction[]).map(a => {
              const colors: Record<TradeAction, string> = { buy: "#27AE60", sell: COLORS.danger, send: COLORS.orange, receive: "#2980B9" };
              const icons: Record<TradeAction, string> = { buy: "add-circle-outline", sell: "remove-circle-outline", send: "arrow-up-outline", receive: "arrow-down-outline" };
              const active = tradeAction === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[sty.tradeActionBtn, active && { backgroundColor: colors[a] + "22", borderColor: colors[a] + "60" }]}
                  onPress={() => { setTradeAction(a); Haptics.selectionAsync(); }}
                >
                  <Ionicons name={icons[a] as any} size={18} color={active ? colors[a] : COLORS.textMuted} />
                  <Text style={[sty.tradeActionText, active && { color: colors[a] }]}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(tradeAction === "buy" || tradeAction === "sell") && (
            <>
              <View style={sty.orderTypeRow}>
                {(["market","limit","stop"] as OrderType[]).map(o => (
                  <TouchableOpacity key={o} style={[sty.orderTypeBtn, orderType === o && sty.orderTypeBtnActive]} onPress={() => { setOrderType(o); Haptics.selectionAsync(); }}>
                    <Text style={[sty.orderTypeText, orderType === o && { color: COLORS.orange }]}>
                      {o.charAt(0).toUpperCase() + o.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(orderType === "limit" || orderType === "stop") && (
                <View style={sty.inputWrap}>
                  <Text style={sty.inputLabel}>{orderType === "limit" ? "Limit Price (USD)" : "Stop Price (USD)"}</Text>
                  <TextInput
                    style={sty.tradeInput}
                    value={limitPrice}
                    onChangeText={setLimitPrice}
                    placeholder={`${selectedAsset.usdPrice.toFixed(0)}`}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="decimal-pad"
                  />
                </View>
              )}

              <View style={sty.inputWrap}>
                <Text style={sty.inputLabel}>{tradeAction === "buy" ? "Pay (USD)" : `Sell Amount (${selectedAsset.symbol})`}</Text>
                <View style={sty.inputRow}>
                  <TextInput
                    style={[sty.tradeInput, { flex: 1 }]}
                    value={tradeAmount}
                    onChangeText={setTradeAmount}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="decimal-pad"
                  />
                  <View style={sty.currencyTag}>
                    <Text style={sty.currencyTagText}>{tradeAction === "buy" ? "USD" : selectedAsset.symbol}</Text>
                  </View>
                </View>
              </View>

              {tradeAmount && parseFloat(tradeAmount) > 0 && (
                <View style={sty.conversionRow}>
                  <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textMuted} />
                  <Text style={sty.conversionText}>
                    {tradeAction === "buy"
                      ? `≈ ${tradeCrypto.toFixed(8)} ${selectedAsset.symbol}`
                      : `≈ $${(parseFloat(tradeAmount) * selectedAsset.usdPrice).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </Text>
                  <Text style={sty.conversionFee}>· Fee: $0.{(parseFloat(tradeAmount) * 0.001).toFixed(2).replace("0.", "")}</Text>
                </View>
              )}

              <View style={sty.percentRow}>
                {[25, 50, 75, 100].map(p => (
                  <TouchableOpacity key={p} style={sty.percentBtn} onPress={() => {
                    Haptics.selectionAsync();
                    setTradeAmount(tradeAction === "buy" ? (selectedAsset.usdValue * p / 100).toFixed(2) : (selectedAsset.balance * p / 100).toFixed(6));
                  }}>
                    <Text style={sty.percentText}>{p}%</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={sty.tradeExecuteBtn} onPress={handleTrade} activeOpacity={0.85}>
                <LinearGradient
                  colors={tradeAction === "buy" ? ["#27AE60", "#1E8449"] : [COLORS.danger, "#C0392B"]}
                  style={sty.tradeExecuteBtnInner}
                >
                  <Ionicons name={tradeAction === "buy" ? "trending-up" : "trending-down"} size={18} color="#fff" />
                  <Text style={sty.tradeExecuteText}>
                    {tradeAction === "buy" ? "Buy" : "Sell"} {selectedAsset.symbol}
                    {orderType !== "market" ? ` · ${orderType.charAt(0).toUpperCase() + orderType.slice(1)}` : ""}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {(tradeAction === "send" || tradeAction === "receive") && (
            <View style={sty.addressBox}>
              <View style={sty.addressRow}>
                <Ionicons name={tradeAction === "send" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"} size={20} color={tradeAction === "send" ? COLORS.orange : "#2980B9"} />
                <Text style={sty.addressBoxTitle}>{tradeAction === "send" ? "Send" : "Receive"} {selectedAsset.symbol}</Text>
              </View>
              <Text style={sty.addressLabel}>Your {selectedAsset.name} Address</Text>
              <View style={sty.addressValueWrap}>
                <Text style={sty.addressValue} numberOfLines={1} ellipsizeMode="middle">{selectedAsset.address.replace("...", "NEXUS000ADDR")}</Text>
                <TouchableOpacity style={sty.copyBtn} onPress={() => Haptics.selectionAsync()}>
                  <Ionicons name="copy-outline" size={14} color={COLORS.orange} />
                </TouchableOpacity>
              </View>
              <Text style={sty.addressNetwork}>Network: {selectedAsset.name} · Balance: {selectedAsset.balance} {selectedAsset.symbol}</Text>
            </View>
          )}
        </View>

        <Text style={sty.sectionTitle}>Your Wallets</Text>
        <View style={sty.assetList}>
          {liveAssets.map((asset, i) => {
            const isPos = asset.change24h >= 0;
            return (
              <TouchableOpacity
                key={asset.id}
                style={[sty.assetRow, i > 0 && sty.assetRowBorder, selectedAsset.id === asset.id && sty.assetRowActive]}
                onPress={() => { setSelectedAsset(asset); Haptics.selectionAsync(); }}
                activeOpacity={0.78}
              >
                <View style={[sty.assetIconWrap, { backgroundColor: asset.color + "22" }]}>
                  <Text style={[sty.assetEmoji, { color: asset.color }]}>{asset.iconEmoji}</Text>
                </View>
                <View style={sty.assetInfo}>
                  <Text style={sty.assetSymbol}>{asset.symbol}</Text>
                  <Text style={sty.assetBalance}>{asset.balance} {asset.symbol}</Text>
                </View>
                <View style={sty.assetValues}>
                  <Text style={sty.assetUSD}>${asset.usdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</Text>
                  <Text style={[sty.assetChange, { color: isPos ? COLORS.success : COLORS.danger }]}>
                    {isPos ? "+" : ""}{asset.change24h.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={sty.sectionTitle}>Portfolio Allocation</Text>
        <View style={sty.allocContainer}>
          {liveAssets.filter(a => a.usdValue > 0).map(a => {
            const pct = (a.usdValue / totalUSD) * 100;
            return (
              <View key={a.id} style={sty.allocRow}>
                <View style={[sty.allocDot, { backgroundColor: a.color }]} />
                <Text style={sty.allocSymbol}>{a.symbol}</Text>
                <View style={sty.allocBarWrap}>
                  <View style={[sty.allocBar, { width: `${Math.max(pct, 1)}%` as any, backgroundColor: a.color }]} />
                </View>
                <Text style={sty.allocPct}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>

        <Text style={sty.sectionTitle}>Network Status</Text>
        <View style={sty.netList}>
          {[
            { name: "Bitcoin", symbol: "BTC", tps: "~7 TPS", confirm: "~10 min", color: "#F7931A" },
            { name: "Ethereum", symbol: "ETH", tps: "~15 TPS", confirm: "~12 sec", color: "#627EEA" },
            { name: "Solana", symbol: "SOL", tps: "65K TPS", confirm: "<1 sec", color: "#9945FF" },
            { name: "BNB Chain", symbol: "BNB", tps: "~300 TPS", confirm: "~3 sec", color: "#F3BA2F" },
            { name: "Polygon", symbol: "POL", tps: "~7K TPS", confirm: "~2 sec", color: "#8247E5" },
          ].map((n, i) => (
            <View key={n.symbol} style={[sty.netRow, i > 0 && sty.netRowBorder]}>
              <View style={[sty.netDot, { backgroundColor: n.color }]} />
              <Text style={sty.netName}>{n.name}</Text>
              <View style={sty.netStats}>
                <Text style={sty.netTps}>{n.tps}</Text>
                <Text style={sty.netConfirm}>{n.confirm}</Text>
              </View>
              <View style={sty.netOnline}>
                <View style={sty.netOnlineDot} />
                <Text style={sty.netOnlineText}>Online</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      <Modal visible={showAssetPicker} transparent animationType="slide">
        <View style={sty.pickerOverlay}>
          <View style={sty.pickerSheet}>
            <View style={sty.sheetHandle} />
            <Text style={sty.pickerTitle}>Select Asset</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {liveAssets.map(asset => {
                const isPos = asset.change24h >= 0;
                return (
                  <TouchableOpacity
                    key={asset.id}
                    style={[sty.pickerRow, selectedAsset.id === asset.id && sty.pickerRowActive]}
                    onPress={() => { setSelectedAsset(asset); setShowAssetPicker(false); Haptics.selectionAsync(); }}
                  >
                    <View style={[sty.assetIconWrap, { backgroundColor: asset.color + "22" }]}>
                      <Text style={[sty.assetEmoji, { color: asset.color }]}>{asset.iconEmoji}</Text>
                    </View>
                    <View style={sty.assetInfo}>
                      <Text style={sty.assetSymbol}>{asset.symbol}</Text>
                      <Text style={sty.assetBalance}>{asset.name}</Text>
                    </View>
                    <View style={sty.assetValues}>
                      <Text style={sty.assetUSD}>${asset.usdPrice >= 1000 ? (asset.usdPrice / 1000).toFixed(1) + "K" : asset.usdPrice.toFixed(asset.usdPrice < 1 ? 4 : 2)}</Text>
                      <Text style={[sty.assetChange, { color: isPos ? COLORS.success : COLORS.danger }]}>{isPos ? "+" : ""}{asset.change24h.toFixed(2)}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={sty.pickerClose} onPress={() => setShowAssetPicker(false)}>
              <Text style={sty.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSeed} transparent animationType="slide">
        <View style={sty.pickerOverlay}>
          <View style={sty.pickerSheet}>
            <View style={sty.sheetHandle} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Ionicons name="warning-outline" size={22} color="#F7B731" />
              <Text style={sty.pickerTitle}>Secret Recovery Phrase</Text>
            </View>
            <View style={{ backgroundColor: "rgba(247,183,49,0.1)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: "#F7B731", lineHeight: 20 }}>
                Never share this with anyone. Anyone with this phrase can steal your funds permanently.
              </Text>
            </View>
            {!seedRevealed ? (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.orangeDim, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.orange, marginBottom: 16 }}
                onPress={() => { setSeedRevealed(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
              >
                <Ionicons name="eye-outline" size={18} color={COLORS.orange} />
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.orange }}>Tap to Reveal</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {seedPhrase.map((word, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0D0D0D", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, width: (width - 72) / 3 }}>
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted, width: 14, textAlign: "right" }}>{idx + 1}</Text>
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white }}>{word}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={sty.pickerClose} onPress={() => { setShowSeed(false); setSeedRevealed(false); }}>
              <Text style={sty.pickerCloseText}>Close Safely</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showSuccess && (
        <View style={sty.successToast}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          <View>
            <Text style={sty.successToastTitle}>Order Placed!</Text>
            <Text style={sty.successToastSub}>{tradeAction === "buy" ? "Purchase" : "Sale"} confirmed · {selectedAsset.symbol}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const sty = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  assetSelector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  assetDot: { width: 10, height: 10, borderRadius: 5 },
  assetSelectorText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.white },
  headerRight: { flexDirection: "row", gap: 6 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.orangeDim, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16 },
  priceSection: { paddingTop: 8, paddingBottom: 16 },
  priceLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  assetName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.textSecondary },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  changeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  priceValue: { fontFamily: "Poppins_700Bold", fontSize: 36, color: COLORS.white, letterSpacing: -1, marginBottom: 12 },
  priceMetaRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  priceMeta: { flex: 1, gap: 2 },
  priceMetaLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  priceMetaValue: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white },
  priceMetaSep: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 12 },
  chartContainer: { backgroundColor: "#141414", borderRadius: 20, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#222" },
  chartControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  tfRow: { flexDirection: "row", gap: 2 },
  tfBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tfBtnActive: { backgroundColor: COLORS.orangeDim },
  tfText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textMuted },
  chartTypeRow: { flexDirection: "row", gap: 4, backgroundColor: "#0D0D0D", borderRadius: 10, padding: 3 },
  chartTypeBtn: { width: 32, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  chartTypeBtnActive: { backgroundColor: "#1A1A1A" },
  chartWrap: { paddingBottom: 8 },
  tradeCard: { backgroundColor: "#141414", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#222", gap: 14 },
  tradeActionRow: { flexDirection: "row", gap: 6 },
  tradeActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#0D0D0D", borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#222" },
  tradeActionText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textMuted },
  orderTypeRow: { flexDirection: "row", backgroundColor: "#0D0D0D", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#222" },
  orderTypeBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  orderTypeBtnActive: { backgroundColor: COLORS.orangeDim },
  orderTypeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textMuted },
  inputWrap: { gap: 6 },
  inputLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tradeInput: { fontFamily: "Poppins_700Bold", fontSize: 24, color: COLORS.white, borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 6 },
  currencyTag: { backgroundColor: "#222", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  currencyTagText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.textSecondary },
  conversionRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0D0D0D", borderRadius: 10, padding: 10 },
  conversionText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.orange, flex: 1 },
  conversionFee: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  percentRow: { flexDirection: "row", gap: 8 },
  percentBtn: { flex: 1, alignItems: "center", backgroundColor: "#0D0D0D", borderRadius: 8, paddingVertical: 7, borderWidth: 1, borderColor: "#222" },
  percentText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary },
  tradeExecuteBtn: { borderRadius: 14, overflow: "hidden" },
  tradeExecuteBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  tradeExecuteText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  addressBox: { backgroundColor: "#0D0D0D", borderRadius: 14, padding: 14, gap: 8 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressBoxTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.white },
  addressLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  addressValueWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1A1A", borderRadius: 10, padding: 10 },
  addressValue: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white, flex: 1 },
  copyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  addressNetwork: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white, marginBottom: 12 },
  assetList: { backgroundColor: "#141414", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#222", marginBottom: 24 },
  assetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  assetRowBorder: { borderTopWidth: 1, borderTopColor: "#1C1C1C" },
  assetRowActive: { backgroundColor: "rgba(230,126,34,0.07)" },
  assetIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  assetEmoji: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  assetInfo: { flex: 1 },
  assetSymbol: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.white },
  assetBalance: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  assetValues: { alignItems: "flex-end", gap: 2 },
  assetUSD: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.white },
  assetChange: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  allocContainer: { backgroundColor: "#141414", borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: "#222", marginBottom: 24 },
  allocRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocSymbol: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary, width: 36 },
  allocBarWrap: { flex: 1, height: 6, backgroundColor: "#222", borderRadius: 3, overflow: "hidden" },
  allocBar: { height: 6, borderRadius: 3 },
  allocPct: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary, width: 36, textAlign: "right" },
  netList: { backgroundColor: "#141414", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#222", marginBottom: 24 },
  netRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  netRowBorder: { borderTopWidth: 1, borderTopColor: "#1C1C1C" },
  netDot: { width: 10, height: 10, borderRadius: 5 },
  netName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white, flex: 1 },
  netStats: { alignItems: "flex-end", gap: 2 },
  netTps: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary },
  netConfirm: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  netOnline: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 },
  netOnlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  netOnlineText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.success },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#181818", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: "#2A2A2A" },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 20 },
  pickerTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white, marginBottom: 16 },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#222", gap: 12 },
  pickerRowActive: { backgroundColor: "rgba(230,126,34,0.07)" },
  pickerClose: { backgroundColor: "#2A2A2A", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  pickerCloseText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
  successToast: { position: "absolute", bottom: 40, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0D1F0D", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.success + "50" },
  successToastTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.success },
  successToastSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
});
