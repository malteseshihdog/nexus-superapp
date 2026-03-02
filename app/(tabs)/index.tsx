import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import {
  CONVERSATIONS,
  STATUS_LIST,
  type Conversation,
  type Status,
} from "@/constants/mockData";
import { useCurrentUser } from "@/contexts/UserContext";
import * as Haptics from "expo-haptics";

const AVATAR_COLORS = [
  "#E67E22", "#8E44AD", "#2980B9", "#27AE60",
  "#E74C3C", "#16A085", "#D35400", "#2C3E50",
  "#F39C12", "#1ABC9C",
];

type ChatTab = "All" | "Unread" | "Groups" | "Contacts";
const TABS: ChatTab[] = ["All", "Unread", "Groups", "Contacts"];

function StatusItem({ item, onPress }: { item: Status; onPress: () => void }) {
  const ringColor = item.hasNew ? COLORS.orange : "rgba(255,255,255,0.2)";
  return (
    <TouchableOpacity style={styles.statusItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statusRing, { borderColor: ringColor }]}>
        {item.isMyStatus ? (
          <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.statusAvatar}>
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[styles.statusAvatar, { backgroundColor: item.color }]}>
            <Text style={styles.statusInitials}>{item.avatar}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statusName} numberOfLines={1}>
        {item.isMyStatus ? "My Status" : item.name.split(" ")[0]}
      </Text>
    </TouchableOpacity>
  );
}

function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(160, [
        Animated.sequence([
          Animated.timing(d1, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(d1, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(d2, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(d2, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(d3, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(d3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: COLORS.orange,
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
}

function DeliveryTick({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status) return null;
  const color = status === "read" ? "#27AE60" : COLORS.textMuted;
  if (status === "sent") return <Ionicons name="checkmark" size={12} color={color} />;
  return <Ionicons name="checkmark-done" size={12} color={color} />;
}

function MessageTypeIcon({ type }: { type?: string }) {
  if (!type || type === "text") return null;
  const icons: Record<string, string> = {
    image: "image-outline",
    voice: "mic-outline",
    file: "document-outline",
    location: "location-outline",
    contact: "person-outline",
  };
  return (
    <Ionicons name={icons[type] as any} size={13} color={COLORS.textMuted} style={{ marginRight: 3 }} />
  );
}

function ConversationItem({
  item,
  index,
  onLongPress,
}: {
  item: Conversation;
  index: number;
  onLongPress: (item: Conversation) => void;
}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const isSentByMe = !item.unread && item.lastMessageStatus;

  return (
    <Pressable
      style={({ pressed }) => [styles.convItem, pressed && { backgroundColor: "rgba(255,255,255,0.05)" }]}
      onPress={() =>
        router.push({ pathname: "/chat/[id]", params: { id: item.id, name: item.name, avatar: item.avatar, color } })
      }
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(item);
      }}
    >
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          {item.isGroup ? (
            <Ionicons name="people" size={22} color="#fff" />
          ) : (
            <Text style={styles.avatarText}>{item.avatar}</Text>
          )}
        </View>
        {item.online && !item.isGroup && <View style={styles.onlineDot} />}
        {item.isMuted && (
          <View style={styles.mutedBadge}>
            <Ionicons name="volume-mute" size={8} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.convContent}>
        <View style={styles.convTop}>
          <View style={styles.convNameRow}>
            {item.isPinned && (
              <Ionicons name="pin" size={11} color={COLORS.orange} style={{ marginRight: 3 }} />
            )}
            <Text style={styles.convName} numberOfLines={1}>{item.name}</Text>
            {item.disappearing && item.disappearing !== "off" && (
              <Ionicons name="timer-outline" size={12} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.convTime}>{item.time}</Text>
        </View>

        <View style={styles.convBottom}>
          <View style={styles.lastMsgRow}>
            {isSentByMe && <DeliveryTick status={item.lastMessageStatus} />}
            {item.isTyping ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.convLast, { color: COLORS.orange }]}>typing</Text>
                <TypingDots />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <MessageTypeIcon type={item.lastMessageType} />
                <Text style={styles.convLast} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
            )}
          </View>
          {item.unread > 0 ? (
            <View style={[styles.unreadBadge, item.isMuted && styles.unreadMuted]}>
              <Text style={styles.unreadText}>{item.unread > 99 ? "99+" : item.unread}</Text>
            </View>
          ) : item.isTyping ? null : (
            <View style={{ width: 20 }} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ConversationContextMenu({
  visible,
  item,
  onClose,
  onPin,
  onMute,
  onArchive,
  onDelete,
  onMark,
}: {
  visible: boolean;
  item: Conversation | null;
  onClose: () => void;
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMark: () => void;
}) {
  if (!item) return null;
  const actions = [
    { icon: item.isPinned ? "pin-outline" : "pin", label: item.isPinned ? "Unpin" : "Pin", onPress: onPin, color: COLORS.white },
    { icon: item.isMuted ? "volume-high-outline" : "volume-mute-outline", label: item.isMuted ? "Unmute" : "Mute", onPress: onMute, color: COLORS.white },
    { icon: "archive-outline", label: "Archive", onPress: onArchive, color: COLORS.white },
    { icon: "checkmark-done", label: "Mark as Read", onPress: onMark, color: COLORS.white },
    { icon: "trash-outline", label: "Delete", onPress: onDelete, color: "#E74C3C" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.contextMenu}>
          <Text style={styles.contextMenuName} numberOfLines={1}>{item.name}</Text>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.contextMenuItem}
              onPress={() => { a.onPress(); onClose(); }}
            >
              <Ionicons name={a.icon as any} size={20} color={a.color} />
              <Text style={[styles.contextMenuLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("All");
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { ghostUsername, isGhostMode, avatarUri, avatarEmoji } = useCurrentUser();
  const tabAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const avatarInitials = (ghostUsername || "NX").slice(0, 2).toUpperCase();

  const filtered = conversations.filter((c) => {
    if (c.isArchived) return false;
    const matchesSearch = search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesTab =
      activeTab === "All" ? true
      : activeTab === "Unread" ? c.unread > 0
      : activeTab === "Groups" ? !!c.isGroup
      : activeTab === "Contacts" ? !c.isGroup
      : true;
    return matchesSearch && matchesTab;
  });

  const pinned = filtered.filter((c) => c.isPinned);
  const unpinned = filtered.filter((c) => !c.isPinned);
  const sorted = [...pinned, ...unpinned];

  const handleTab = useCallback((tab: ChatTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  const handleLongPress = useCallback((item: Conversation) => {
    setSelectedConv(item);
    setShowMenu(true);
  }, []);

  const mutateConv = (id: string, changes: Partial<Conversation>) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));

  const archiveCount = conversations.filter((c) => c.isArchived).length;

  return (
    <StarryBackground>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/profile")} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatarImg} contentFit="cover" />
          ) : (
            <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{avatarEmoji || avatarInitials}</Text>
            </LinearGradient>
          )}
          {isGhostMode && (
            <View style={styles.ghostDot}>
              <Ionicons name="shield-checkmark" size={9} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/chat/family")} testID="family-btn" activeOpacity={0.7}>
            <Ionicons name="people" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push({ pathname: "/chat/group-call", params: { roomName: "New Group Call", roomId: "room_" + Date.now().toString(36), callType: "video" } })}
            testID="group-call-btn"
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hubBtn} onPress={() => router.push("/dashboard")} testID="hub-button" activeOpacity={0.7}>
            <Ionicons name="grid-outline" size={20} color={COLORS.white} />
            <Text style={styles.hubBtnLabel}>Hub</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => handleTab(tab)} activeOpacity={0.8}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
            {tab === "Unread" && conversations.filter((c) => c.unread > 0).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{conversations.filter((c) => c.unread > 0).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ConversationItem item={item} index={index} onLongPress={handleLongPress} />
        )}
        ListHeaderComponent={
          activeTab === "All" && !search ? (
            <View>
              <View style={styles.statusSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScroll}>
                  {STATUS_LIST.map((s) => (
                    <StatusItem key={s.id} item={s} onPress={() => {}} />
                  ))}
                </ScrollView>
              </View>
              <View style={styles.sectionDivider} />
            </View>
          ) : null
        }
        ListFooterComponent={
          archiveCount > 0 ? (
            <TouchableOpacity style={styles.archiveBtn} activeOpacity={0.8}>
              <Ionicons name="archive-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.archiveBtnText}>Archived ({archiveCount})</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={[styles.list, { paddingBottom: (Platform.OS === "web" ? 84 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubText}>Start a new chat below</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: (Platform.OS === "web" ? 84 : insets.bottom) + 90 }]}
        onPress={() => {}}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.fabGradient}>
          <Ionicons name="create-outline" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <ConversationContextMenu
        visible={showMenu}
        item={selectedConv}
        onClose={() => setShowMenu(false)}
        onPin={() => selectedConv && mutateConv(selectedConv.id, { isPinned: !selectedConv.isPinned })}
        onMute={() => selectedConv && mutateConv(selectedConv.id, { isMuted: !selectedConv.isMuted })}
        onArchive={() => selectedConv && mutateConv(selectedConv.id, { isArchived: true })}
        onDelete={() => setConversations((prev) => prev.filter((c) => c.id !== selectedConv?.id))}
        onMark={() => selectedConv && mutateConv(selectedConv.id, { unread: 0 })}
      />
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  hubBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  hubBtnLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.white },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  profileBtn: { position: "relative", width: 40, height: 40 },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  profileAvatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.orange },
  profileInitials: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
  ghostDot: { position: "absolute", bottom: -1, right: -1, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.orange, borderWidth: 2, borderColor: "#111111", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.white, letterSpacing: -0.5 },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.white, fontFamily: "Poppins_400Regular", fontSize: 14, padding: 0 },
  tabsScroll: { maxHeight: 44 },
  tabsContainer: { paddingHorizontal: 16, gap: 8, alignItems: "center", paddingBottom: 4 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "transparent" },
  tabBtnActive: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange },
  tabLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.orange },
  tabBadge: { backgroundColor: COLORS.orange, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#fff" },
  statusSection: { paddingTop: 12, paddingBottom: 4 },
  statusScroll: { paddingHorizontal: 16, gap: 14 },
  statusItem: { alignItems: "center", width: 66 },
  statusRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, padding: 2.5, marginBottom: 5 },
  statusAvatar: { flex: 1, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  statusInitials: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  statusName: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 4 },
  list: { paddingTop: 4 },
  convItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, gap: 12 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white, letterSpacing: 0.5 },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: 6.5, backgroundColor: "#27AE60", borderWidth: 2, borderColor: "#111111" },
  mutedBadge: { position: "absolute", top: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.textMuted, borderWidth: 1.5, borderColor: "#111111", alignItems: "center", justifyContent: "center" },
  convContent: { flex: 1 },
  convTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  convNameRow: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
  convName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white, flex: 1 },
  convTime: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  convBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastMsgRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, marginRight: 8 },
  convLast: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  unreadBadge: { backgroundColor: COLORS.orange, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  unreadMuted: { backgroundColor: COLORS.textMuted },
  unreadText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.white },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 80 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  emptySubText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted },
  archiveBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  archiveBtnText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  contextMenu: { backgroundColor: COLORS.card, borderRadius: 16, width: 280, padding: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  contextMenuName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 4 },
  contextMenuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10 },
  contextMenuLabel: { fontFamily: "Poppins_400Regular", fontSize: 15 },
});
