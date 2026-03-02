import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Animated,
  Easing,
  PanResponder,
  LayoutChangeEvent,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";
import { VideoView } from "@/components/VideoView";
import { WebRTCEngine, CallStats } from "@/lib/webrtc";
import { FaceMeshEngine, FaceMeshMode } from "@/lib/faceMesh";
import { AudioEngine, VoiceMorphMode } from "@/lib/audioEngine";
import { getApiUrl } from "@/lib/query-client";
import {
  detectLanguage, translateText, getRandomPhrase,
  speakText, stopSpeech, generateSegmentId,
  type SpeechSegment,
} from "@/lib/dubbing";
import { SUPPORTED_LANGUAGES, type Language } from "@/constants/peepData";

const QUALITY_COLORS: Record<string, string> = {
  "4K UHD": "#E67E22",
  "Full HD": "#27AE60",
  "HD 720p": "#2980B9",
  "SD 480p": "#8E44AD",
  Low: "#E74C3C",
};

const FILTER_OPTIONS: { mode: FaceMeshMode; label: string; icon: string; desc: string }[] = [
  { mode: "none",    label: "Off",     icon: "close-circle-outline",   desc: "Raw camera" },
  { mode: "smooth",  label: "Bilat.",  icon: "flower-outline",          desc: "Skin smooth" },
  { mode: "contour", label: "3D Mesh", icon: "scan-outline",            desc: "468 points" },
  { mode: "privacy", label: "Privacy", icon: "eye-off-outline",          desc: "Starry BG" },
];

type SoundEffect = "normal" | "deep" | "high" | "robot" | "echo" | "chipmunk" | "monster" | "whisper";

const SOUND_EFFECTS: { id: SoundEffect; label: string; icon: string; morphMode: VoiceMorphMode }[] = [
  { id: "normal",   label: "عادي",        icon: "person",          morphMode: "off" },
  { id: "deep",     label: "صوت عميق",    icon: "arrow-down",      morphMode: "professional" },
  { id: "high",     label: "صوت حاد",     icon: "arrow-up",        morphMode: "clear" },
  { id: "robot",    label: "روبوت",       icon: "hardware-chip",   morphMode: "ghost" },
  { id: "echo",     label: "صدى",         icon: "radio-outline",   morphMode: "studio" },
  { id: "chipmunk", label: "سنجاب",       icon: "paw",             morphMode: "clear" },
  { id: "monster",  label: "وحش",         icon: "skull",           morphMode: "ghost" },
  { id: "whisper",  label: "همس",         icon: "ear",             morphMode: "studio" },
];

const VIDEO_QUALITIES: { id: string; label: string; res: string }[] = [
  { id: "SD",      label: "SD",      res: "480p" },
  { id: "HD",      label: "HD",      res: "720p" },
  { id: "Full HD", label: "Full\nHD", res: "1080p" },
  { id: "4K",      label: "4K",      res: "2160p" },
];

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getSignalingUrl(): string {
  try {
    const apiBase = getApiUrl();
    const url = new URL(apiBase);
    const wsProto = url.protocol === "https:" ? "wss" : "ws";
    return `${wsProto}://${url.host}/ws/signal`;
  } catch {
    return "ws://localhost:5000/ws/signal";
  }
}

function PulsingRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.65, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

function ControlBtn({ icon, label, active = false, activeColor = "#E74C3C", badge, onPress, testID }: {
  icon: string; label: string; active?: boolean; activeColor?: string; badge?: string; onPress: () => void; testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.ctrlWrap} onPress={onPress} activeOpacity={0.75} testID={testID}>
      <View style={[styles.ctrlBtn, active && { backgroundColor: activeColor, borderColor: activeColor }]}>
        <Ionicons name={icon as any} size={22} color="#fff" />
        {badge ? (
          <View style={styles.ctrlBadge}><Text style={styles.ctrlBadgeText}>{badge}</Text></View>
        ) : null}
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SettingsSlider({ value, min, max, onChange, color = COLORS.orange, label, valueLabel, testID }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; color?: string; label: string; valueLabel: string; testID?: string;
}) {
  const [trackWidth, setTrackWidth] = useState(200);
  const startX = useRef(0);
  const startValue = useRef(value);
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: (e) => {
      startX.current = e.nativeEvent.pageX;
      startValue.current = value;
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth));
      onChange(parseFloat((min + (max - min) * ratio).toFixed(3)));
    },
    onPanResponderMove: (e) => {
      const dx = e.nativeEvent.pageX - startX.current;
      const dv = (dx / trackWidth) * (max - min);
      const next = Math.max(min, Math.min(max, startValue.current + dv));
      onChange(parseFloat(next.toFixed(3)));
    },
  }), [trackWidth, min, max, onChange, value]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={[styles.sliderValue, { color }]}>{valueLabel}</Text>
        </View>
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(parseFloat(e.target.value).toFixed(3)))}
          data-testid={testID}
          style={{
            width: "100%",
            height: 28,
            appearance: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            accentColor: color,
          } as any}
        />
      </View>
    );
  }

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{valueLabel}</Text>
      </View>
      <View
        style={styles.sliderTrack}
        testID={testID}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width || 200)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderBg} />
        <View style={[styles.sliderFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
        <View style={[styles.sliderThumb, { left: `${pct * 100}%` as any, borderColor: color }]} />
      </View>
    </View>
  );
}

export default function CallScreen() {
  const { name, avatar, color, callType } = useLocalSearchParams<{
    name: string; avatar: string; color: string; callType: "video" | "audio";
  }>();

  const insets = useSafeAreaInsets();
  const { userId } = useCurrentUser();
  const isVideo = callType !== "audio";

  const engineRef = useRef<WebRTCEngine | null>(null);
  const faceMeshRef = useRef<FaceMeshEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [filteredLocalStream, setFilteredLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [callStatus, setCallStatus] = useState<"ringing" | "connecting" | "connected" | "ended">("ringing");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(isVideo);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const [qualityLabel, setQualityLabel] = useState<string>("4K UHD");
  const [bitrateKbps, setBitrateKbps] = useState(0);
  const [codec, setCodec] = useState("AV1");
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [webrtcAvailable, setWebrtcAvailable] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  type BatteryMode = "auto" | "saver" | "performance";
  const [batteryMode, setBatteryMode] = useState<BatteryMode>("auto");
  const [frameRateCap, setFrameRateCap] = useState(30);
  const [preferredCodec, setPreferredCodec] = useState<"AV1" | "VP9" | "H264">("AV1");
  const [lowDataMode, setLowDataMode] = useState(false);
  const [networkType, setNetworkType] = useState<"WiFi" | "5G" | "4G LTE" | "3G">("WiFi");
  const [thermalState, setThermalState] = useState<"nominal" | "fair" | "serious" | "critical">("nominal");
  const [filterMode, setFilterMode] = useState<FaceMeshMode>("none");
  const [brightness, setBrightness] = useState(1.0);
  const [filterIntensity, setFilterIntensity] = useState(0.5);
  const [morphMode, setMorphMode] = useState<VoiceMorphMode>("off");
  const [micGain, setMicGain] = useState(1.0);
  const [noiseCancelStrength, setNoiseCancelStrength] = useState(0.65);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [sessionKeyHex, setSessionKeyHex] = useState("");

  const [noiseCancel, setNoiseCancel] = useState(true);
  const [echoCancel, setEchoCancel] = useState(true);
  const [stereoMode, setStereoMode] = useState(false);
  const [pitchX, setPitchX] = useState(1.0);
  const [soundEffect, setSoundEffect] = useState<SoundEffect>("normal");
  const [selectedQuality, setSelectedQuality] = useState<"SD" | "HD" | "Full HD" | "4K">("HD");

  const [autoTranslate, setAutoTranslate] = useState(false);
  const [myLang, setMyLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [theirLang, setTheirLang] = useState<Language>(SUPPORTED_LANGUAGES[1]);
  const [captions, setCaptions] = useState<SpeechSegment[]>([]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langPickerFor, setLangPickerFor] = useState<"me" | "them">("me");
  const [langSearch, setLangSearch] = useState("");
  const [dubbingActive, setDubbingActive] = useState(false);
  const captionAnim = useRef(new Animated.Value(0)).current;
  const dubbingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phraseIndexRef = useRef(0);

  const panelAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const contactColor = color || COLORS.orange;
  const contactInitials = (avatar && avatar.length <= 4)
    ? avatar
    : (name ?? "?").substring(0, 2).toUpperCase();

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !showSettings;
    setShowSettings(next);
    Animated.spring(panelAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [showSettings, panelAnim]);

  useEffect(() => {
    const engine = new WebRTCEngine();
    engineRef.current = engine;
    const available = engine.available;
    setWebrtcAvailable(available);

    engine.on("local-stream", async (s: MediaStream) => {
      setLocalStream(s);

      if (Platform.OS === "web") {
        try {
          const fm = new FaceMeshEngine();
          faceMeshRef.current = fm;
          const filtered = await fm.init(s);
          setFilteredLocalStream(filtered);
        } catch {}

        try {
          const ae = new AudioEngine();
          audioEngineRef.current = ae;
          await ae.init(s);
          setSessionKeyHex(ae.sessionKey);
        } catch {}
      }
    });

    engine.on("remote-stream", (s: MediaStream) => {
      setRemoteStream(s);
      setCallStatus("connected");
      startTimer();
    });
    engine.on("connected", () => { setCallStatus("connected"); startTimer(); });
    engine.on("disconnected", () => { setCallStatus("ended"); stopTimer(); });
    engine.on("quality-change", (tier: any) => setQualityLabel(tier.label));
    engine.on("bitrate-update", (kbps: number) => setBitrateKbps(kbps));
    engine.on("codec-detected", (c: string) => setCodec(c));
    engine.on("stats", (s: CallStats) => {
      setCallStats(s);
      setQualityLabel(s.qualityTier);
      setBitrateKbps(s.bitrateKbps);
      setCodec(s.codec);
    });

    if (available) {
      (async () => {
        try {
          setCallStatus("connecting");
          await engine.getLocalStream(isVideo);
          const myId = userId ?? "u_" + Date.now().toString(36);
          const remoteId = "remote_" + (name ?? "peer").replace(/\s/g, "_").toLowerCase();
          const roomId = [myId, remoteId].sort().join("__");
          engine.connectSignaling(getSignalingUrl(), roomId, myId, true);
        } catch {
          simulateFallback();
        }
      })();
    } else {
      simulateFallback();
    }

    return () => {
      engine.destroy();
      faceMeshRef.current?.destroy();
      audioEngineRef.current?.destroy();
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (faceMeshRef.current) {
      faceMeshRef.current.setSettings({ mode: filterMode, brightness, intensity: filterIntensity });
    }
  }, [filterMode, brightness, filterIntensity]);

  useEffect(() => {
    audioEngineRef.current?.setMorphMode(morphMode);
  }, [morphMode]);

  useEffect(() => {
    audioEngineRef.current?.setMicGain(micGain);
  }, [micGain]);

  useEffect(() => {
    audioEngineRef.current?.setNoiseCancelStrength(noiseCancelStrength);
  }, [noiseCancelStrength]);

  useEffect(() => {
    audioEngineRef.current?.setEncryption(encryptionEnabled);
  }, [encryptionEnabled]);

  useEffect(() => {
    const found = SOUND_EFFECTS.find((s) => s.id === soundEffect);
    if (found) setMorphMode(found.morphMode);
  }, [soundEffect]);

  useEffect(() => {
    audioEngineRef.current?.setNoiseCancelStrength(noiseCancel ? noiseCancelStrength : 0);
  }, [noiseCancel, noiseCancelStrength]);

  useEffect(() => {
    if (!autoTranslate || callStatus !== "connected") {
      if (dubbingTimerRef.current) clearInterval(dubbingTimerRef.current);
      stopSpeech();
      setDubbingActive(false);
      return;
    }
    setDubbingActive(true);
    Animated.spring(captionAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();

    const THEIR_LANGS = [theirLang.code];
    const THEIR_PHRASES = (() => {
      const pool: Array<{ text: string; langCode: string }> = [];
      for (const langCode of THEIR_LANGS) {
        const phrase = getRandomPhrase(langCode);
        pool.push({ text: phrase, langCode });
      }
      return pool;
    })();

    let segIdx = 0;
    dubbingTimerRef.current = setInterval(() => {
      const speaker: "me" | "them" = segIdx % 3 === 0 ? "me" : "them";
      const srcLang = speaker === "me" ? myLang : theirLang;
      const tgtLang = speaker === "me" ? theirLang : myLang;
      const originalText = getRandomPhrase(srcLang.code);
      const detectedLangCode = detectLanguage(originalText);
      const detectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLangCode) ?? srcLang;
      const translatedText = translateText(originalText, tgtLang.code);
      const segment: SpeechSegment = {
        id: generateSegmentId(),
        speaker,
        detectedLang,
        originalText,
        translatedText,
        timestamp: Date.now(),
      };
      setCaptions((prev) => [...prev.slice(-4), segment]);
      if (speaker === "them") {
        speakText(translatedText, tgtLang.code);
      }
      segIdx++;
    }, 4500);

    return () => {
      if (dubbingTimerRef.current) clearInterval(dubbingTimerRef.current);
      stopSpeech();
    };
  }, [autoTranslate, callStatus, myLang, theirLang]);

  useEffect(() => {
    const networks = ["WiFi", "5G", "4G LTE", "3G"] as const;
    const netTimer = setInterval(() => {
      const n = networks[Math.floor(Math.random() * 2)];
      setNetworkType(n);
      if (batteryMode === "saver") {
        setFrameRateCap(20);
      } else if (batteryMode === "performance") {
        setFrameRateCap(60);
      } else {
        setFrameRateCap(n === "WiFi" || n === "5G" ? 30 : 15);
      }
    }, 8000);
    const thermalTimer = setInterval(() => {
      if (batteryMode === "saver") setThermalState("nominal");
      else if (elapsed > 300) setThermalState("fair");
      else setThermalState("nominal");
    }, 15000);
    return () => { clearInterval(netTimer); clearInterval(thermalTimer); };
  }, [batteryMode, elapsed]);

  useEffect(() => {
    if (batteryMode === "saver") {
      setFrameRateCap(20);
      setPreferredCodec("VP9");
    } else if (batteryMode === "performance") {
      setFrameRateCap(60);
      setPreferredCodec("AV1");
    }
  }, [batteryMode]);

  function simulateFallback() {
    setCallStatus("connecting");
    setTimeout(() => {
      setCallStatus("connected");
      startTimer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1800);
  }

  const handleEndCall = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    stopTimer();
    engineRef.current?.destroy();
    faceMeshRef.current?.destroy();
    audioEngineRef.current?.destroy();
    setCallStatus("ended");
    setTimeout(() => router.back(), 500);
  }, [stopTimer]);

  const handleToggleMic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !micEnabled;
    setMicEnabled(next);
    engineRef.current?.toggleMic(next);
  }, [micEnabled]);

  const handleToggleCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !cameraEnabled;
    setCameraEnabled(next);
    engineRef.current?.toggleCamera(next);
  }, [cameraEnabled]);

  const handleFlipCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    engineRef.current?.flipCamera();
  }, []);

  const thermalColor = { nominal: "#27AE60", fair: "#F39C12", serious: "#E67E22", critical: "#E74C3C" }[thermalState];
  const netTypeIcon: Record<string, string> = { WiFi: "wifi", "5G": "cellular", "4G LTE": "cellular", "3G": "cellular" };
  const effectiveFPS = batteryMode === "saver" ? 20 : batteryMode === "performance" ? 60 : frameRateCap;
  const effectiveRes = batteryMode === "saver" ? "720p" : batteryMode === "performance" ? "4K" : "1080p";
  const qColor = QUALITY_COLORS[qualityLabel] ?? COLORS.orange;
  const statusLabel =
    callStatus === "ringing" ? "Ringing..." :
    callStatus === "connecting" ? "Connecting securely..." :
    callStatus === "ended" ? "Call Ended" :
    formatDuration(elapsed);

  const showVideo = isVideo && webrtcAvailable && callStatus === "connected";
  const displayLocalStream = filteredLocalStream || localStream;
  const hasActiveFilter = filterMode !== "none";
  const hasActiveMorph = morphMode !== "off";
  const activeSoundEffect = SOUND_EFFECTS.find((s) => s.id === soundEffect && s.id !== "normal");

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [560, 0],
  });

  const panelOpacity = panelAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });

  return (
    <View style={styles.root}>
      {remoteStream && showVideo ? (
        <VideoView stream={remoteStream} style={StyleSheet.absoluteFill} objectFit="cover" />
      ) : (
        <View style={styles.bgDark}>
          <View style={[styles.avatarWrap]}>
            <PulsingRing color={contactColor} />
            <PulsingRing color={contactColor + "66"} />
            <View style={[styles.avatarCircle, { backgroundColor: contactColor }]}>
              <Text style={styles.avatarText}>{contactInitials}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
          <View style={styles.contactBlock}>
            <Text style={styles.contactName}>{name ?? "Unknown"}</Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, callStatus === "connected" && styles.statusConnected]}>
                {statusLabel}
              </Text>
              {hasActiveFilter && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>✨ {filterMode}</Text>
                </View>
              )}
              {hasActiveMorph && activeSoundEffect && (
                <View style={[styles.activeFilterBadge, { backgroundColor: COLORS.orange + "30", borderColor: COLORS.orange }]}>
                  <Text style={[styles.activeFilterText, { color: COLORS.orange }]}>🎙 {activeSoundEffect.label}</Text>
                </View>
              )}
              {encryptionEnabled && sessionKeyHex ? (
                <View style={[styles.activeFilterBadge, { backgroundColor: "rgba(39,174,96,0.15)", borderColor: "#27AE60" }]}>
                  <Text style={[styles.activeFilterText, { color: "#27AE60" }]}>🔐 {sessionKeyHex}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowStats((v) => !v)} style={styles.badgeRow} activeOpacity={0.8}>
            <View style={[styles.qualityBadge, { borderColor: qColor }]}>
              <View style={[styles.qDot, { backgroundColor: qColor }]} />
              <Text style={[styles.qLabel, { color: qColor }]}>{effectiveRes}</Text>
            </View>
            <View style={styles.codecBadge}><Text style={styles.codecText}>{preferredCodec}</Text></View>
            <View style={[styles.codecBadge, { backgroundColor: "rgba(39,174,96,0.15)", borderColor: "#27AE60", borderWidth: 1 }]}>
              <Text style={[styles.codecText, { color: "#27AE60" }]}>{effectiveFPS}fps</Text>
            </View>
            {batteryMode === "saver" && (
              <View style={[styles.codecBadge, { backgroundColor: "rgba(39,174,96,0.15)" }]}>
                <Text style={[styles.codecText, { color: "#27AE60" }]}>🔋 Saver</Text>
              </View>
            )}
            {thermalState !== "nominal" && (
              <View style={[styles.codecBadge, { backgroundColor: thermalColor + "22" }]}>
                <Text style={[styles.codecText, { color: thermalColor }]}>🌡️ {thermalState}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showStats && callStats && (
          <View style={styles.statsPanel}>
            <Text style={styles.statRow}>↑ {bitrateKbps > 1000 ? `${(bitrateKbps / 1000).toFixed(1)} Mbps` : `${bitrateKbps} Kbps`}</Text>
            <Text style={styles.statRow}>RTT {callStats.roundTripMs} ms</Text>
            <Text style={styles.statRow}>Res {callStats.resolution}</Text>
            <Text style={styles.statRow}>Loss {callStats.packetsLost} pkts</Text>
          </View>
        )}

        {displayLocalStream && showVideo && (
          <View style={styles.pipWrap}>
            <VideoView stream={displayLocalStream} muted style={styles.pipFill} objectFit="cover" />
            <TouchableOpacity style={styles.flipOverlay} onPress={handleFlipCamera}>
              <Ionicons name="camera-reverse-outline" size={15} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!showVideo && callStatus !== "connected" && (
          <View style={styles.encryptRow}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.orange} />
            <Text style={styles.encryptText}>End-to-end encrypted · Ghost Protocol · AV1</Text>
          </View>
        )}
        {callStatus === "connected" && !showVideo && (
          <View style={styles.audioActive}>
            <Ionicons name="radio-outline" size={18} color={COLORS.orange} />
            <Text style={styles.audioActiveText}>Secure audio · {qualityLabel}</Text>
          </View>
        )}

        {dubbingActive && captions.length > 0 && (
          <Animated.View style={[styles.captionPanel, { opacity: captionAnim, transform: [{ translateY: captionAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <View style={styles.captionHeader}>
              <View style={styles.captionAIBadge}>
                <Ionicons name="language" size={11} color={COLORS.orange} />
                <Text style={styles.captionAIText}>AI DUBBING LIVE</Text>
                <View style={styles.captionLiveDot} />
              </View>
              <Text style={styles.captionLangInfo}>
                {myLang.flag} {myLang.name} ⇄ {theirLang.flag} {theirLang.name}
              </Text>
            </View>
            {captions.slice(-2).map((seg) => (
              <View key={seg.id} style={[styles.captionRow, seg.speaker === "me" && styles.captionRowMe]}>
                <View style={styles.captionSpeakerBadge}>
                  <Text style={styles.captionSpeakerText}>{seg.speaker === "me" ? "You" : (name ?? "Them")}</Text>
                  <Text style={styles.captionDetectedLang}>{seg.detectedLang.flag}</Text>
                </View>
                <View style={styles.captionTextBlock}>
                  <Text style={styles.captionOriginal} numberOfLines={1}>{seg.originalText}</Text>
                  <View style={styles.captionArrow}>
                    <Ionicons name="arrow-forward" size={10} color={COLORS.orange} />
                  </View>
                  <Text style={styles.captionTranslated} numberOfLines={2}>{seg.translatedText}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {showSettings && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={toggleSettings}
            activeOpacity={1}
          />
        )}

        <Animated.View
          style={[styles.settingsPanel, { opacity: panelOpacity, transform: [{ translateY: panelTranslateY }] }]}
          pointerEvents={showSettings ? "auto" : "none"}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>إعدادات الصوت والفيديو</Text>
            <TouchableOpacity onPress={toggleSettings} style={styles.panelCloseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>

            {isVideo && (
              <>
                <View style={styles.settingsSectionHeader}>
                  <Ionicons name="videocam-outline" size={16} color={COLORS.orange} />
                  <Text style={styles.settingsSectionTitle}>جودة الفيديو</Text>
                </View>
                <View style={styles.qualityRow}>
                  {VIDEO_QUALITIES.map((q) => {
                    const active = selectedQuality === q.id;
                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={[styles.qualityBtn, active && styles.qualityBtnActive]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedQuality(q.id as any); }}
                        testID={`quality-${q.id}`}
                      >
                        <Text style={[styles.qualityBtnText, active && styles.qualityBtnTextActive]} numberOfLines={2} textBreakStrategy="simple">
                          {q.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.settingsSectionHeader}>
              <Ionicons name="options-outline" size={16} color={COLORS.orange} />
              <Text style={styles.settingsSectionTitle}>فلاتر الصوت</Text>
            </View>

            {[
              { key: "noise",  icon: "volume-mute-outline",      label: "إلغاء الضوضاء",  desc: "تصفية الأصوات",    val: noiseCancel,  set: setNoiseCancel },
              { key: "echo",   icon: "radio-outline",             label: "إلغاء الصدى",    desc: "منع ارتداد",       val: echoCancel,   set: setEchoCancel },
              { key: "stereo", icon: "headset-outline",           label: "نمط ستيريو",     desc: "صوت محيطي ثلاثي", val: stereoMode,   set: setStereoMode },
            ].map((item) => (
              <View key={item.key} style={styles.filterRow}>
                <View style={styles.filterRowLeft}>
                  <Ionicons name={item.icon as any} size={20} color={item.val ? COLORS.orange : "rgba(255,255,255,0.45)"} />
                  <View style={{ gap: 2 }}>
                    <Text style={styles.filterRowLabel}>{item.label}</Text>
                    <Text style={styles.filterRowDesc}>{item.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={item.val}
                  onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.set(v); }}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: COLORS.orange }}
                  thumbColor="#fff"
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              </View>
            ))}

            <View style={styles.settingsSectionHeader}>
              <Ionicons name="pulse-outline" size={16} color={COLORS.orange} />
              <Text style={styles.settingsSectionTitle}>نبرة الصوت</Text>
            </View>

            <View style={styles.pitchContainer}>
              <View style={styles.pitchSliderWrap}>
                <Text style={styles.pitchSliderEdge}>منخفض</Text>
                <View style={styles.pitchSliderTrack}>
                  <View style={[styles.pitchSliderFill, { width: `${((pitchX - 0.5) / 1.5) * 100}%` as any }]} />
                </View>
                <Text style={styles.pitchSliderEdge}>عالي</Text>
              </View>
              <View style={styles.pitchControls}>
                <TouchableOpacity
                  style={styles.pitchBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPitchX((v) => Math.max(0.5, parseFloat((v - 0.1).toFixed(1)))); }}
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.pitchValue}>
                  <Text style={styles.pitchValueText}>{pitchX.toFixed(1)}x</Text>
                </View>
                <TouchableOpacity
                  style={styles.pitchBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPitchX((v) => Math.min(2.0, parseFloat((v + 0.1).toFixed(1)))); }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsSectionHeader}>
              <Ionicons name="musical-note-outline" size={16} color={COLORS.orange} />
              <Text style={styles.settingsSectionTitle}>تأثيرات الصوت</Text>
            </View>

            <View style={styles.soundEffectGrid}>
              {SOUND_EFFECTS.map((eff) => {
                const active = soundEffect === eff.id;
                return (
                  <TouchableOpacity
                    key={eff.id}
                    style={[styles.soundEffectBtn, active && styles.soundEffectBtnActive]}
                    onPress={() => { Haptics.selectionAsync(); setSoundEffect(eff.id); }}
                    testID={`effect-${eff.id}`}
                  >
                    <Ionicons
                      name={eff.icon as any}
                      size={24}
                      color={active ? "#fff" : "rgba(255,255,255,0.65)"}
                    />
                    <Text style={[styles.soundEffectLabel, active && styles.soundEffectLabelActive]}>
                      {eff.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toggleSettings();
              }}
              activeOpacity={0.85}
              testID="apply-settings-btn"
            >
              <Text style={styles.applyBtnText}>تطبيق الإعدادات</Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>

        <View style={[styles.controls, { paddingBottom: botPad + 20 }]}>
          <ControlBtn
            icon={micEnabled ? "mic" : "mic-off"}
            label={micEnabled ? "Mute" : "Unmute"}
            active={!micEnabled}
            activeColor="#E74C3C"
            onPress={handleToggleMic}
            testID="ctrl-mic"
          />
          {isVideo && (
            <ControlBtn
              icon={cameraEnabled ? "videocam" : "videocam-off"}
              label={cameraEnabled ? "Camera" : "No Cam"}
              active={!cameraEnabled}
              activeColor="#E74C3C"
              onPress={handleToggleCamera}
              testID="ctrl-camera"
            />
          )}
          <ControlBtn
            icon="language"
            label={autoTranslate ? "Dub ON" : "AI Dub"}
            active={autoTranslate}
            activeColor={COLORS.orange}
            badge={autoTranslate ? "●" : undefined}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (!autoTranslate) {
                setShowLangPicker(true);
              } else {
                setAutoTranslate(false);
                setCaptions([]);
              }
            }}
            testID="ctrl-translate"
          />
          <ControlBtn
            icon="color-wand-outline"
            label="AI Beauty"
            active={showSettings}
            activeColor={COLORS.orange}
            badge={hasActiveFilter || hasActiveMorph || encryptionEnabled ? "•" : undefined}
            onPress={toggleSettings}
            testID="ctrl-beauty"
          />
          <ControlBtn
            icon="battery-half-outline"
            label={batteryMode === "saver" ? "Saver ON" : "Battery"}
            active={batteryMode === "saver"}
            activeColor="#27AE60"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setBatteryMode((m) => m === "saver" ? "auto" : "saver");
            }}
            testID="ctrl-battery"
          />
          <ControlBtn
            icon={speakerEnabled ? "volume-high" : "volume-mute"}
            label="Speaker"
            active={!speakerEnabled}
            activeColor="#8E44AD"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSpeakerEnabled((v) => !v);
            }}
            testID="ctrl-speaker"
          />
          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.8} testID="end-call-btn">
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>
        </View>
      </View>

      {showLangPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
          <Pressable style={styles.langOverlay} onPress={() => setShowLangPicker(false)}>
            <Pressable style={styles.langSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.langHandle} />
              <Text style={styles.langTitle}>AI Voice Dubbing Setup</Text>
              <Text style={styles.langSubtitle}>
                System auto-detects each speaker's language and dubs their voice in real-time
              </Text>

              <View style={styles.langPairRow}>
                <TouchableOpacity
                  style={styles.langPairCard}
                  onPress={() => { setLangPickerFor("me"); setLangSearch(""); }}
                >
                  <Text style={styles.langPairLabel}>Your Language</Text>
                  <View style={[styles.langPairSelected, langPickerFor === "me" && styles.langPairSelectedActive]}>
                    <Text style={styles.langPairFlag}>{myLang.flag}</Text>
                    <View>
                      <Text style={styles.langPairName}>{myLang.name}</Text>
                      <Text style={styles.langPairNative}>{myLang.nativeName}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.langPairDivider}>
                  <Ionicons name="swap-horizontal" size={22} color={COLORS.orange} />
                </View>

                <TouchableOpacity
                  style={styles.langPairCard}
                  onPress={() => { setLangPickerFor("them"); setLangSearch(""); }}
                >
                  <Text style={styles.langPairLabel}>{name ?? "Their"} Language</Text>
                  <View style={[styles.langPairSelected, langPickerFor === "them" && styles.langPairSelectedActive]}>
                    <Text style={styles.langPairFlag}>{theirLang.flag}</Text>
                    <View>
                      <Text style={styles.langPairName}>{theirLang.name}</Text>
                      <Text style={styles.langPairNative}>{theirLang.nativeName}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.langPickingFor}>
                {langPickerFor === "me" ? "Selecting your language:" : `Selecting ${name ?? "their"} language:`}
              </Text>

              <View style={styles.langSearchRow}>
                <Ionicons name="search" size={14} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.langSearchInput}
                  value={langSearch}
                  onChangeText={setLangSearch}
                  placeholder="Search..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
                {SUPPORTED_LANGUAGES.filter((l) =>
                  l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                  l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
                ).map((lang) => {
                  const isSelected = langPickerFor === "me" ? myLang.code === lang.code : theirLang.code === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langListRow, isSelected && styles.langListRowActive]}
                      onPress={() => {
                        if (langPickerFor === "me") setMyLang(lang);
                        else setTheirLang(lang);
                        Haptics.selectionAsync();
                        setLangSearch("");
                      }}
                    >
                      <Text style={styles.langListFlag}>{lang.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.langListName}>{lang.name}</Text>
                        <Text style={styles.langListNative}>{lang.nativeName}</Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={17} color={COLORS.orange} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.startDubbingBtn}
                onPress={() => {
                  setShowLangPicker(false);
                  setAutoTranslate(true);
                  setCaptions([]);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Ionicons name="language" size={18} color="#fff" />
                <Text style={styles.startDubbingText}>Start AI Dubbing</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  bgDark: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D" },
  avatarWrap: { width: 190, height: 190, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 2 },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 16,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.15)",
  },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 42, color: "#fff" },
  overlay: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  contactBlock: { flex: 1, gap: 4 },
  contactName: { fontFamily: "Poppins_700Bold", fontSize: 22, color: "#fff", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  statusLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "rgba(255,255,255,0.6)" },
  statusConnected: { fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.9)", fontSize: 14, letterSpacing: 1 },
  activeFilterBadge: { backgroundColor: "rgba(230,126,34,0.2)", borderWidth: 1, borderColor: COLORS.orange, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  activeFilterText: { fontFamily: "Poppins_600SemiBold", fontSize: 9, color: COLORS.orange },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  qualityBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(0,0,0,0.35)" },
  qDot: { width: 6, height: 6, borderRadius: 3 },
  qLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  codecBadge: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  codecText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.75)" },
  statsPanel: { marginHorizontal: 20, marginTop: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 2, alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statRow: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 0.3 },
  pipWrap: { position: "absolute", top: 150, right: 16, width: 100, height: 150, borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.18)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  pipFill: { flex: 1 },
  flipOverlay: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, padding: 5 },
  encryptRow: { position: "absolute", bottom: 190, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  encryptText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.55)" },
  audioActive: { position: "absolute", bottom: 190, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(230,126,34,0.12)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(230,126,34,0.3)" },
  audioActiveText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.orange },

  settingsPanel: {
    position: "absolute",
    bottom: 108,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    maxHeight: 520,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  panelTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },
  panelCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  panelContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 16 },
  settingsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsSectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },

  qualityRow: { flexDirection: "row", gap: 10 },
  qualityBtn: {
    flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center",
    backgroundColor: "#2A2A2A", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  qualityBtnActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  qualityBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center" },
  qualityBtnTextActive: { color: "#fff" },

  filterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 4,
  },
  filterRowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  filterRowLabel: { fontFamily: "Poppins_500Medium", fontSize: 15, color: "#fff" },
  filterRowDesc: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.45)" },

  pitchContainer: { gap: 16 },
  pitchSliderWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  pitchSliderEdge: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", width: 46, textAlign: "center" },
  pitchSliderTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" },
  pitchSliderFill: { height: "100%" as any, backgroundColor: COLORS.orange, borderRadius: 2 },
  pitchControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  pitchBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center",
  },
  pitchValue: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#2A2A2A", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  pitchValueText: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#fff" },

  soundEffectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soundEffectBtn: {
    width: "30%", paddingVertical: 14, alignItems: "center", gap: 6,
    backgroundColor: "#2A2A2A", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  soundEffectBtnActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  soundEffectLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  soundEffectLabelActive: { color: "#fff" },

  applyBtn: {
    backgroundColor: COLORS.orange, borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
    marginTop: 4,
  },
  applyBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  panelHandle: { width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  panelTabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  panelTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  panelTabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.orange },
  panelTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.5)" },
  panelSection: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase", flex: 1 },
  panelSectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  meshBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(39,174,96,0.15)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(39,174,96,0.3)" },
  meshDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#27AE60" },
  meshBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 9, color: "#27AE60" },

  optionGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optionCard: { width: "22%", minWidth: 64, alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  optionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  optionDesc: { fontFamily: "Poppins_400Regular", fontSize: 9, color: "rgba(255,255,255,0.35)", textAlign: "center" },

  sliderRow: { gap: 8 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  sliderValue: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  sliderTrack: { height: 28, justifyContent: "center", position: "relative" },
  sliderBg: { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 },
  sliderFill: { position: "absolute", left: 0, height: 4, borderRadius: 2 },
  sliderThumb: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff", borderWidth: 2.5, marginLeft: -9, top: 5 },

  noiseLevelRow: { flexDirection: "row", gap: 6 },
  noisePreset: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  noisePresetActive: { borderColor: "#2980B9", backgroundColor: "rgba(41,128,185,0.15)" },
  noisePresetLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.55)" },
  encryptCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(39,174,96,0.06)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(39,174,96,0.2)" },
  encryptCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  encryptKeyText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#27AE60", letterSpacing: 1 },
  encryptToggleBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, minWidth: 64, justifyContent: "center" },
  encryptToggleText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },
  clearModeBtn: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  clearModeBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.55)" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  toggleInfo: { flex: 1, gap: 2 },
  toggleLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "rgba(255,255,255,0.85)" },
  toggleDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)" },
  toggleSwitch: { width: 46, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", paddingHorizontal: 3 },
  toggleSwitchOn: { backgroundColor: COLORS.orange },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.5)" },
  toggleThumbOn: { backgroundColor: "#fff", alignSelf: "flex-end" },

  controls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 20, paddingHorizontal: 16, backgroundColor: "rgba(0,0,0,0.5)" },
  ctrlWrap: { alignItems: "center", gap: 6 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  ctrlBadge: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange },
  ctrlBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 6, color: "#fff" },
  ctrlLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.65)" },
  endBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E74C3C", alignItems: "center", justifyContent: "center", shadowColor: "#E74C3C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.65, shadowRadius: 14, elevation: 10 },
  perfStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  perfStatCard: { flex: 1, minWidth: "28%", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 2 },
  perfStatValue: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  perfStatLabel: { fontFamily: "Poppins_400Regular", fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 },

  captionPanel: {
    position: "absolute", left: 12, right: 12, bottom: 150,
    backgroundColor: "rgba(0,0,0,0.82)", borderRadius: 16,
    padding: 12, gap: 8,
    borderWidth: 1, borderColor: "rgba(230,126,34,0.25)",
  },
  captionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  captionAIBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(230,126,34,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(230,126,34,0.4)" },
  captionAIText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: COLORS.orange, letterSpacing: 0.8 },
  captionLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E74C3C" },
  captionLangInfo: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.45)" },
  captionRow: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, gap: 4, borderLeftWidth: 2, borderLeftColor: "rgba(230,126,34,0.6)" },
  captionRowMe: { borderLeftColor: "rgba(39,174,96,0.6)" },
  captionSpeakerBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  captionSpeakerText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: COLORS.orange },
  captionDetectedLang: { fontSize: 12 },
  captionTextBlock: { gap: 3 },
  captionOriginal: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic" },
  captionArrow: { paddingLeft: 2 },
  captionTranslated: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff", lineHeight: 18 },

  langOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  langSheet: {
    backgroundColor: "#181818", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  langHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  langTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#fff", marginBottom: 4 },
  langSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 16, lineHeight: 17 },
  langPairRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  langPairCard: { flex: 1, gap: 6 },
  langPairLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.45)" },
  langPairSelected: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  langPairSelectedActive: { borderColor: COLORS.orange, backgroundColor: "rgba(230,126,34,0.1)" },
  langPairFlag: { fontSize: 24 },
  langPairName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  langPairNative: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.4)" },
  langPairDivider: { alignItems: "center", justifyContent: "center", paddingTop: 18 },
  langPickingFor: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.orange, marginBottom: 8 },
  langSearchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8 },
  langSearchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: "#fff" },
  langListRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  langListRowActive: { backgroundColor: "rgba(230,126,34,0.08)", borderRadius: 8, paddingHorizontal: 6 },
  langListFlag: { fontSize: 20 },
  langListName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  langListNative: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.4)" },
  startDubbingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  startDubbingText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
