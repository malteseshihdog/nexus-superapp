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
  ScrollView,
  FlatList,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";
import { GroupCallEngine } from "@/lib/webrtcGroup";
import { CONVERSATIONS } from "@/constants/mockData";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const AVATAR_COLORS = [
  "#E67E22", "#2980B9", "#8E44AD", "#27AE60",
  "#E74C3C", "#F39C12", "#16A085", "#D35400",
];

interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
  joinedAt: number;
}

const DEMO_JOINERS: Omit<Participant, "audioEnabled" | "videoEnabled" | "isSpeaking" | "isLocal" | "joinedAt">[] = [
  { id: "d1", name: "Alexandra Chen", avatar: "AC", color: "#E67E22" },
  { id: "d2", name: "Marcus Webb",    avatar: "MW", color: "#2980B9" },
  { id: "d3", name: "Luna Rodriguez", avatar: "LR", color: "#8E44AD" },
  { id: "d4", name: "Priya Sharma",   avatar: "PS", color: "#27AE60" },
  { id: "d5", name: "James Okonkwo",  avatar: "JO", color: "#E74C3C" },
  { id: "d6", name: "Sofia Larsson",  avatar: "SL", color: "#F39C12" },
  { id: "d7", name: "Kai Tanaka",     avatar: "KT", color: "#16A085" },
  { id: "d8", name: "Yusuf Al-Amin",  avatar: "YA", color: "#D35400" },
];

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function gridConfig(n: number): { cols: number; tileHeight: number } {
  if (n <= 1) return { cols: 1, tileHeight: SCREEN_H * 0.72 };
  if (n <= 2) return { cols: 1, tileHeight: (SCREEN_H * 0.72) / 2 };
  if (n <= 4) return { cols: 2, tileHeight: (SCREEN_H * 0.72) / 2 };
  if (n <= 6) return { cols: 2, tileHeight: (SCREEN_H * 0.72) / 3 };
  if (n <= 9) return { cols: 3, tileHeight: (SCREEN_H * 0.72) / 3 };
  return { cols: 4, tileHeight: (SCREEN_H * 0.72) / Math.ceil(n / 4) };
}

function ParticipantTile({
  participant,
  size,
  isSpeaker = false,
  onPress,
  testID,
}: {
  participant: Participant;
  size: { width: number; height: number };
  isSpeaker?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (participant.isSpeaking) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(0);
  }, [participant.isSpeaking]);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(230,126,34,0.4)", COLORS.orange],
  });

  return (
    <TouchableOpacity
      style={{ width: size.width, height: size.height, padding: 2 }}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.tile,
          { borderColor: participant.isSpeaking ? borderColor : "rgba(255,255,255,0.08)" },
          isSpeaker && styles.tileSpeaker,
        ]}
      >
        <View style={[styles.tileAvatar, { backgroundColor: participant.color }]}>
          <Text style={styles.tileAvatarText}>{participant.avatar}</Text>
        </View>

        <View style={styles.tileBottom}>
          <View style={styles.tileNameRow}>
            {participant.isLocal && (
              <View style={styles.youBadge}><Text style={styles.youText}>You</Text></View>
            )}
            <Text style={styles.tileName} numberOfLines={1}>{participant.name}</Text>
          </View>
          <View style={[styles.tileMicIcon, !participant.audioEnabled && styles.tileMicMuted]}>
            <Ionicons
              name={participant.audioEnabled ? "mic" : "mic-off"}
              size={12}
              color={participant.audioEnabled ? "rgba(255,255,255,0.8)" : "#E74C3C"}
            />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function GroupCallScreen() {
  const { roomName, roomId, callType, isFamily } = useLocalSearchParams<{
    roomName: string;
    roomId: string;
    callType: "video" | "audio";
    isFamily: string;
  }>();

  const insets = useSafeAreaInsets();
  const { userId, ghostUsername } = useCurrentUser();
  const isVideo = callType !== "audio";
  const familyMode = isFamily === "1";

  const engineRef = useRef<GroupCallEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myName = ghostUsername || "You";
  const myId = userId ?? "me_" + Date.now().toString(36);

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: myId,
      name: myName,
      avatar: myName.substring(0, 2).toUpperCase(),
      color: COLORS.orange,
      audioEnabled: true,
      videoEnabled: isVideo,
      isSpeaking: false,
      isLocal: true,
      joinedAt: Date.now(),
    },
  ]);

  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(isVideo);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>(myId);
  const [showInvite, setShowInvite] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const invitePanelAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  useEffect(() => {
    const engine = new GroupCallEngine();
    engineRef.current = engine;

    engine.on("peer-joined", ({ peerId }: { peerId: string }) => {
      const demo = DEMO_JOINERS.find((d) => d.id === peerId);
      if (demo) {
        setParticipants((prev) =>
          prev.some((p) => p.id === peerId)
            ? prev
            : [...prev, { ...demo, audioEnabled: true, videoEnabled: isVideo, isSpeaking: false, isLocal: false, joinedAt: Date.now() }]
        );
      }
    });

    engine.on("peer-left", ({ peerId }: { peerId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== peerId));
    });

    if (engine.available) {
      engine.init(myId, roomId ?? "nexus_room_" + Date.now(), isVideo).then(() => {
        setCallStatus("connected");
        startTimer();
      }).catch(() => {
        setCallStatus("connected");
        startTimer();
      });
    } else {
      setTimeout(() => {
        setCallStatus("connected");
        startTimer();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500);
    }

    return () => {
      engine.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleInvitePanel = useCallback((show: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInvite(show);
    Animated.spring(invitePanelAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [invitePanelAnim]);

  const handleInvite = useCallback((contactId: string, contactName: string, avatar: string, index: number) => {
    if (invitedIds.has(contactId)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInvitedIds((prev) => new Set([...prev, contactId]));

    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
      setParticipants((prev) =>
        prev.some((p) => p.id === contactId)
          ? prev
          : [...prev, {
              id: contactId,
              name: contactName,
              avatar,
              color,
              audioEnabled: true,
              videoEnabled: false,
              isSpeaking: false,
              isLocal: false,
              joinedAt: Date.now(),
            }]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, delay);
  }, [invitedIds]);

  const handleEndCall = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    engineRef.current?.destroy();
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }, []);

  const handleToggleMic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !micEnabled;
    setMicEnabled(next);
    engineRef.current?.toggleMic(next);
    setParticipants((prev) =>
      prev.map((p) => p.isLocal ? { ...p, audioEnabled: next } : p)
    );
  }, [micEnabled]);

  const handleToggleCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !cameraEnabled;
    setCameraEnabled(next);
    engineRef.current?.toggleCamera(next);
    setParticipants((prev) =>
      prev.map((p) => p.isLocal ? { ...p, videoEnabled: next } : p)
    );
  }, [cameraEnabled]);

  const { cols, tileHeight } = useMemo(() => gridConfig(participants.length), [participants.length]);
  const tileWidth = SCREEN_W / cols;

  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId) ?? participants[0];
  const otherParticipants = participants.filter((p) => p.id !== activeSpeakerId);

  const panelTranslateY = invitePanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const contacts = CONVERSATIONS.filter((c) => !c.isGroup);

  if (familyMode) {
    return (
      <FamilyCallView
        participants={participants}
        elapsed={elapsed}
        callStatus={callStatus}
        micEnabled={micEnabled}
        onToggleMic={handleToggleMic}
        onEndCall={handleEndCall}
        topPad={topPad}
        botPad={botPad}
        roomName={roomName}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName} numberOfLines={1}>{roomName ?? "Group Call"}</Text>
          <View style={styles.participantCountRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.participantCount}>{participants.length} in call</Text>
            {callStatus === "connected" && (
              <Text style={styles.elapsedText}>{formatDuration(elapsed)}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === "grid" && styles.viewToggleActive]}
            onPress={() => { Haptics.selectionAsync(); setViewMode("grid"); }}
            testID="view-grid"
          >
            <Ionicons name="grid-outline" size={16} color={viewMode === "grid" ? COLORS.orange : "rgba(255,255,255,0.5)"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === "speaker" && styles.viewToggleActive]}
            onPress={() => { Haptics.selectionAsync(); setViewMode("speaker"); }}
            testID="view-speaker"
          >
            <Ionicons name="person-outline" size={16} color={viewMode === "speaker" ? COLORS.orange : "rgba(255,255,255,0.5)"} />
          </TouchableOpacity>
        </View>
      </View>

      {callStatus === "connecting" ? (
        <View style={styles.connecting}>
          <Ionicons name="radio-outline" size={32} color={COLORS.orange} />
          <Text style={styles.connectingText}>Setting up secure room…</Text>
          <Text style={styles.connectingSubText}>End-to-end encrypted · AV1 · Ghost Protocol</Text>
        </View>
      ) : viewMode === "grid" ? (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridWrap}>
            {participants.map((p, i) => (
              <ParticipantTile
                key={p.id}
                participant={p}
                size={{ width: tileWidth, height: tileHeight }}
                onPress={() => {
                  setActiveSpeakerId(p.id);
                  setViewMode("speaker");
                }}
                testID={`tile-${p.id}`}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.speakerView}>
          <View style={styles.speakerMain}>
            <ParticipantTile
              participant={activeSpeaker}
              size={{ width: SCREEN_W, height: SCREEN_H * 0.54 }}
              isSpeaker
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.speakerStrip}
            style={styles.speakerStripScroll}
          >
            {otherParticipants.map((p) => (
              <ParticipantTile
                key={p.id}
                participant={p}
                size={{ width: 100, height: 140 }}
                onPress={() => setActiveSpeakerId(p.id)}
                testID={`strip-tile-${p.id}`}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {showInvite && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => toggleInvitePanel(false)} />
      )}

      <Animated.View
        style={[styles.invitePanel, { transform: [{ translateY: panelTranslateY }] }]}
        pointerEvents={showInvite ? "auto" : "none"}
      >
        <View style={styles.panelHandle} />
        <Text style={styles.panelTitle}>Invite to Call</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.inviteList}
          renderItem={({ item, index }) => {
            const invited = invitedIds.has(item.id);
            const alreadyIn = participants.some((p) => p.id === item.id);
            return (
              <View style={styles.inviteRow}>
                <View style={[styles.inviteAvatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                  <Text style={styles.inviteAvatarText}>{item.avatar}</Text>
                </View>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteName}>{item.name}</Text>
                  <Text style={styles.inviteStatus}>
                    {alreadyIn ? "In call" : invited ? "Joining…" : item.online ? "Online" : "Offline"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.inviteBtn,
                    (invited || alreadyIn) && styles.inviteBtnSent,
                  ]}
                  onPress={() => handleInvite(item.id, item.name, item.avatar, index)}
                  disabled={invited || alreadyIn}
                  testID={`invite-${item.id}`}
                >
                  <Text style={[styles.inviteBtnText, (invited || alreadyIn) && { color: COLORS.orange }]}>
                    {alreadyIn ? "✓ In call" : invited ? "✓ Invited" : "Invite"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </Animated.View>

      <View style={[styles.controls, { paddingBottom: botPad + 16 }]}>
        <CtrlBtn icon={micEnabled ? "mic" : "mic-off"} label={micEnabled ? "Mute" : "Unmute"} active={!micEnabled} activeColor="#E74C3C" onPress={handleToggleMic} testID="ctrl-mic" />
        {isVideo && (
          <CtrlBtn icon={cameraEnabled ? "videocam" : "videocam-off"} label="Camera" active={!cameraEnabled} activeColor="#E74C3C" onPress={handleToggleCamera} testID="ctrl-camera" />
        )}
        <CtrlBtn
          icon="person-add-outline"
          label="Invite"
          active={showInvite}
          activeColor={COLORS.orange}
          badge={invitedIds.size > 0 ? String(invitedIds.size) : undefined}
          onPress={() => toggleInvitePanel(!showInvite)}
          testID="ctrl-invite"
        />
        <CtrlBtn icon={viewMode === "grid" ? "person-outline" : "grid-outline"} label="View" onPress={() => { Haptics.selectionAsync(); setViewMode(v => v === "grid" ? "speaker" : "grid"); }} testID="ctrl-view" />
        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.8} testID="end-call-btn">
          <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CtrlBtn({ icon, label, active = false, activeColor = "#E74C3C", badge, onPress, testID }: {
  icon: string; label: string; active?: boolean; activeColor?: string; badge?: string; onPress: () => void; testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.ctrlWrap} onPress={onPress} activeOpacity={0.75} testID={testID}>
      <View style={[styles.ctrlBtn, active && { backgroundColor: activeColor, borderColor: activeColor }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
        {badge ? <View style={styles.ctrlBadge}><Text style={styles.ctrlBadgeText}>{badge}</Text></View> : null}
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FamilyCallView({ participants, elapsed, callStatus, micEnabled, onToggleMic, onEndCall, topPad, botPad, roomName }: {
  participants: Participant[];
  elapsed: number;
  callStatus: string;
  micEnabled: boolean;
  onToggleMic: () => void;
  onEndCall: () => void;
  topPad: number;
  botPad: number;
  roomName?: string;
}) {
  return (
    <View style={styles.familyRoot}>
      <View style={[styles.familyHeader, { paddingTop: topPad + 16 }]}>
        <Text style={styles.familyTitle}>{roomName ?? "Family Call"}</Text>
        <Text style={styles.familySubtitle}>
          {callStatus === "connecting" ? "Connecting…" : `${participants.length} connected · ${formatDuration(elapsed)}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.familyGrid} showsVerticalScrollIndicator={false}>
        {participants.map((p) => (
          <View key={p.id} style={styles.familyCard}>
            <View style={[styles.familyAvatar, { backgroundColor: p.color }]}>
              <Text style={styles.familyAvatarText}>{p.avatar}</Text>
            </View>
            <Text style={styles.familyName}>{p.name}</Text>
            <View style={[styles.familyStatusDot, { backgroundColor: p.audioEnabled ? "#27AE60" : "#E74C3C" }]} />
            <Text style={styles.familyStatus}>{p.isLocal ? "You" : p.audioEnabled ? "Speaking" : "Muted"}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.familyControls, { paddingBottom: botPad + 24 }]}>
        <TouchableOpacity
          style={[styles.familyMicBtn, !micEnabled && styles.familyMicBtnMuted]}
          onPress={onToggleMic}
          testID="family-mic-btn"
        >
          <Ionicons name={micEnabled ? "mic" : "mic-off"} size={32} color="#fff" />
          <Text style={styles.familyBtnLabel}>{micEnabled ? "Mute" : "Unmute"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.familyEndBtn} onPress={onEndCall} testID="family-end-btn">
          <Ionicons name="call" size={38} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          <Text style={styles.familyBtnLabel}>Hang Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "rgba(0,0,0,0.6)" },
  headerLeft: { flex: 1, gap: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  roomName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#fff" },
  participantCountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(231,76,60,0.2)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E74C3C" },
  liveText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#E74C3C", letterSpacing: 1 },
  participantCount: { fontFamily: "Poppins_500Medium", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  elapsedText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.orange },
  viewToggle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  viewToggleActive: { backgroundColor: "rgba(230,126,34,0.2)", borderWidth: 1, borderColor: "rgba(230,126,34,0.4)" },

  connecting: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  connectingText: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: "#fff" },
  connectingSubText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.45)" },

  gridScroll: { flex: 1 },
  gridContent: { flexGrow: 1 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", flex: 1 },

  speakerView: { flex: 1 },
  speakerMain: { flex: 1 },
  speakerStripScroll: { maxHeight: 160, backgroundColor: "rgba(0,0,0,0.4)" },
  speakerStrip: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },

  tile: { flex: 1, backgroundColor: "#1A1A1A", borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 2 },
  tileSpeaker: { borderRadius: 0 },
  tileAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  tileAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 22, color: "#fff" },
  tileBottom: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(0,0,0,0.55)" },
  tileNameRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  tileName: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#fff", flex: 1 },
  youBadge: { backgroundColor: COLORS.orange, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  youText: { fontFamily: "Poppins_700Bold", fontSize: 8, color: "#fff" },
  tileMicIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  tileMicMuted: { backgroundColor: "rgba(231,76,60,0.2)" },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  invitePanel: {
    position: "absolute",
    bottom: 110,
    left: 12,
    right: 12,
    backgroundColor: "rgba(18,18,18,0.98)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    maxHeight: 360,
    overflow: "hidden",
  },
  panelHandle: { width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginTop: 10 },
  panelTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  inviteList: { maxHeight: 280 },
  inviteRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  inviteAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  inviteAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
  inviteInfo: { flex: 1, gap: 2 },
  inviteName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
  inviteStatus: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)" },
  inviteBtn: { backgroundColor: COLORS.orange, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  inviteBtnSent: { backgroundColor: "rgba(230,126,34,0.15)", borderWidth: 1, borderColor: "rgba(230,126,34,0.3)" },
  inviteBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#fff" },

  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 16, paddingHorizontal: 16, backgroundColor: "rgba(0,0,0,0.6)" },
  ctrlWrap: { alignItems: "center", gap: 5 },
  ctrlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  ctrlBadge: { position: "absolute", top: 4, right: 4, backgroundColor: COLORS.orange, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  ctrlBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#fff" },
  ctrlLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "rgba(255,255,255,0.6)" },
  endBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E74C3C", alignItems: "center", justifyContent: "center", shadowColor: "#E74C3C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },

  familyRoot: { flex: 1, backgroundColor: "#0D0D1A" },
  familyHeader: { paddingHorizontal: 24, paddingBottom: 24, alignItems: "center" },
  familyTitle: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff", textAlign: "center" },
  familySubtitle: { fontFamily: "Poppins_500Medium", fontSize: 16, color: "rgba(255,255,255,0.55)", marginTop: 4, textAlign: "center" },
  familyGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 16, paddingBottom: 24 },
  familyCard: { width: (SCREEN_W - 48) / 2, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  familyAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  familyAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff" },
  familyName: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#fff", textAlign: "center" },
  familyStatusDot: { width: 10, height: 10, borderRadius: 5 },
  familyStatus: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "rgba(255,255,255,0.5)" },
  familyControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  familyMicBtn: { alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 24, paddingVertical: 20, paddingHorizontal: 28 },
  familyMicBtnMuted: { backgroundColor: "rgba(231,76,60,0.2)" },
  familyEndBtn: { alignItems: "center", gap: 8, backgroundColor: "#E74C3C", borderRadius: 24, paddingVertical: 20, paddingHorizontal: 28, shadowColor: "#E74C3C", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
  familyBtnLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },
});
