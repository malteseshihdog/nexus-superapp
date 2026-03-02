import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  FlatList, TextInput, Modal, Pressable, ScrollView,
  Animated, Vibration, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import {
  fetchMessages, sendMessage, subscribeToMessages, markAsRead, PrivateMessage,
} from "@/lib/supabase";
import { MESSAGES, CONVERSATIONS, QUICK_REPLY_SUGGESTIONS, type Message, type MessageReaction } from "@/constants/mockData";
import { SUPPORTED_LANGUAGES, type Language } from "@/constants/peepData";
import * as Haptics from "expo-haptics";

const CHAT_TRANSLATE_LANGS = SUPPORTED_LANGUAGES.slice(0, 30);

function simulateTranslate(text: string, lang: Language): string {
  if (lang.code === "en") return text;
  const prefixes: Record<string, string> = {
    ar: "عربي: ", fa: "فارسی: ", ur: "اردو: ", "ku-kmr": "کوردی: ", "ku-ckb": "کوردی: ",
    fr: "FR: ", de: "DE: ", es: "ES: ", zh: "中: ", ru: "RU: ",
    ja: "JA: ", ko: "KO: ", tr: "TR: ", pt: "PT: ", hi: "HI: ",
  };
  const prefix = prefixes[lang.code] || `[${lang.nativeName}] `;
  return `${prefix}${text}`;
}

const AVATAR_COLORS = ["#E67E22","#8E44AD","#2980B9","#27AE60","#E74C3C","#16A085","#D35400","#2C3E50"];
const REACTIONS = ["❤️","👍","😂","😮","😢","🙏","🔥","🎉"];
const MAX_REPLY_PREVIEW = 60;

function msgId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 9); }

function timeLabel(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 86400) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 172800) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function TypingIndicator({ name }: { name: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(200, dots.map((d) =>
        Animated.sequence([
          Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ))
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
      <Text style={styles.typingLabel}>{name} is typing…</Text>
    </View>
  );
}

function DeliveryStatus({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status) return null;
  const color = status === "read" ? "#4FC3F7" : "rgba(255,255,255,0.55)";
  return (
    <Ionicons
      name={status === "sent" ? "checkmark" : "checkmark-done"}
      size={13}
      color={color}
      style={{ marginLeft: 3 }}
    />
  );
}

function ReactionBubbles({ reactions }: { reactions: MessageReaction[] }) {
  if (!reactions?.length) return null;
  return (
    <View style={styles.reactionsRow}>
      {reactions.map((r, i) => (
        <View key={i} style={[styles.reactionBadge, r.mine && styles.reactionMine]}>
          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
          {r.count > 1 && <Text style={styles.reactionCount}>{r.count}</Text>}
        </View>
      ))}
    </View>
  );
}

function ReplyPreviewInBubble({ reply }: { reply: { id: string; text: string; sender: string } }) {
  return (
    <View style={styles.inBubbleReply}>
      <View style={styles.inBubbleReplyBar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.inBubbleReplySender}>{reply.sender === "me" ? "You" : reply.sender}</Text>
        <Text style={styles.inBubbleReplyText} numberOfLines={1}>
          {reply.text.length > MAX_REPLY_PREVIEW ? reply.text.substring(0, MAX_REPLY_PREVIEW) + "…" : reply.text}
        </Text>
      </View>
    </View>
  );
}

interface MsgBubbleProps {
  msg: Message;
  contactName: string;
  onLongPress: (msg: Message, pos: { x: number; y: number }) => void;
  isStarred?: boolean;
  translatedText?: string;
  translateLang?: Language | null;
}

function MessageBubble({ msg, contactName, onLongPress, isStarred, translatedText, translateLang }: MsgBubbleProps) {
  const isMe = msg.sender === "me";
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const ref = useRef<any>(null);

  function handleLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    ref.current?.measure((_fx: number, _fy: number, _w: number, _h: number, px: number, py: number) => {
      onLongPress(msg, { x: px, y: py });
    });
  }

  if (msg.isDeleted) {
    return (
      <View style={[styles.deletedBubble, isMe ? styles.deletedRight : styles.deletedLeft]}>
        <Ionicons name="ban-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.deletedText}>{isMe ? "You deleted this message" : "This message was deleted"}</Text>
      </View>
    );
  }

  return (
    <Animated.View
      ref={ref}
      style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft, { transform: [{ scale: pressAnim }] }]}
    >
      {!isMe && (
        <View style={styles.msgAvatarSmall}>
          <Text style={styles.msgAvatarText}>{contactName.slice(0, 1)}</Text>
        </View>
      )}
      <View style={[styles.bubbleMax, isMe ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
        {isStarred && (
          <View style={styles.starBadge}>
            <Ionicons name="star" size={10} color={COLORS.orange} />
          </View>
        )}
        {msg.forwardedFrom && (
          <View style={styles.forwardedLabel}>
            <Ionicons name="arrow-redo-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.forwardedText}>Forwarded from {msg.forwardedFrom}</Text>
          </View>
        )}
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={350}
          style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}
        >
          {msg.replyTo && <ReplyPreviewInBubble reply={msg.replyTo} />}
          {msg.type === "voice" ? (
            <View style={styles.voiceRow}>
              <Ionicons name="play-circle" size={32} color={isMe ? "#fff" : COLORS.orange} />
              <View style={styles.voiceWave}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.voiceBar,
                      { height: 6 + Math.sin(i * 0.9) * 10, backgroundColor: isMe ? "rgba(255,255,255,0.6)" : COLORS.orange },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.voiceDuration, { color: isMe ? "rgba(255,255,255,0.7)" : COLORS.textMuted }]}>
                {msg.duration ? `${Math.floor(msg.duration / 60)}:${String(msg.duration % 60).padStart(2, "0")}` : "0:15"}
              </Text>
            </View>
          ) : msg.type === "file" ? (
            <View style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Ionicons name="document" size={24} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fileName, { color: isMe ? "#fff" : COLORS.white }]} numberOfLines={1}>
                  {msg.fileName || "document.pdf"}
                </Text>
                <Text style={[styles.fileSize, { color: isMe ? "rgba(255,255,255,0.6)" : COLORS.textMuted }]}>
                  {msg.fileSize || "2.4 MB"}
                </Text>
              </View>
              <Ionicons name="cloud-download-outline" size={20} color={isMe ? "rgba(255,255,255,0.8)" : COLORS.orange} />
            </View>
          ) : msg.type === "location" ? (
            <View style={styles.locationRow}>
              <View style={styles.locationMapThumb}>
                <Ionicons name="map" size={28} color={COLORS.orange} />
              </View>
              <View>
                <Text style={[styles.locationName, { color: isMe ? "#fff" : COLORS.white }]}>
                  {msg.locationName || "Shared Location"}
                </Text>
                <Text style={[styles.locationCoords, { color: isMe ? "rgba(255,255,255,0.6)" : COLORS.textMuted }]}>
                  Tap to open in maps
                </Text>
              </View>
            </View>
          ) : msg.type === "money" ? (
            <View style={styles.moneyBubble}>
              <View style={styles.moneyBubbleTop}>
                <View style={[styles.moneyBubbleIcon, { backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(39,174,96,0.25)" }]}>
                  <Ionicons name="cash" size={22} color={isMe ? "#fff" : "#27AE60"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moneyBubbleAmount, { color: isMe ? "#fff" : COLORS.white }]}>
                    {msg.amount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </Text>
                  <Text style={[styles.moneyBubbleCurrency, { color: isMe ? "rgba(255,255,255,0.7)" : COLORS.textMuted }]}>
                    {msg.currency ?? "USD"}
                  </Text>
                </View>
              </View>
              {!!msg.note && (
                <Text style={[styles.moneyBubbleNote, { color: isMe ? "rgba(255,255,255,0.75)" : COLORS.textSecondary }]}>
                  "{msg.note}"
                </Text>
              )}
              <View style={styles.moneyBubbleStatus}>
                <View style={[styles.moneyStatusDot, {
                  backgroundColor: msg.transferStatus === "completed" ? "#27AE60"
                    : msg.transferStatus === "sent" ? "#F39C12" : "#8E44AD"
                }]} />
                <Text style={[styles.moneyStatusText, { color: isMe ? "rgba(255,255,255,0.65)" : COLORS.textMuted }]}>
                  {msg.transferStatus === "completed" ? "Completed" : msg.transferStatus === "sent" ? "Processing" : "Pending"}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>
                {msg.text}
              </Text>
              {translatedText && translateLang && (
                <View style={styles.translationBlock}>
                  <View style={styles.translationDivider} />
                  <View style={styles.translationHeader}>
                    <Ionicons name="language" size={10} color={isMe ? "rgba(255,255,255,0.6)" : COLORS.orange} />
                    <Text style={[styles.translationLang, { color: isMe ? "rgba(255,255,255,0.55)" : COLORS.orange }]}>
                      {translateLang.flag} {translateLang.name}
                    </Text>
                  </View>
                  <Text style={[styles.translationText, { color: isMe ? "rgba(255,255,255,0.85)" : COLORS.white }]}>
                    {translatedText}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.msgMeta}>
            <Text style={[styles.msgTime, { color: isMe ? "rgba(255,255,255,0.55)" : COLORS.textMuted }]}>
              {msg.time}
            </Text>
            {isMe && <DeliveryStatus status={msg.deliveryStatus || (msg.read ? "read" : "delivered")} />}
          </View>
        </Pressable>
        <ReactionBubbles reactions={msg.reactions || []} />
      </View>
    </Animated.View>
  );
}

interface AttachSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

function AttachSheet({ visible, onClose, onSelect }: AttachSheetProps) {
  const items = [
    { icon: "camera", label: "Camera", color: "#E74C3C", type: "camera" },
    { icon: "image", label: "Gallery", color: "#8E44AD", type: "image" },
    { icon: "document-text", label: "Document", color: "#2980B9", type: "file" },
    { icon: "location", label: "Location", color: "#27AE60", type: "location" },
    { icon: "person", label: "Contact", color: "#E67E22", type: "contact" },
    { icon: "musical-notes", label: "Audio", color: "#16A085", type: "audio" },
    { icon: "videocam", label: "Video", color: "#D35400", type: "video" },
    { icon: "happy", label: "GIF", color: "#F39C12", type: "gif" },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.attachOverlay} onPress={onClose}>
        <View style={styles.attachSheet}>
          <View style={styles.attachHandle} />
          <Text style={styles.attachTitle}>Share</Text>
          <View style={styles.attachGrid}>
            {items.map((it) => (
              <TouchableOpacity
                key={it.type}
                style={styles.attachItem}
                onPress={() => { onSelect(it.type); onClose(); }}
                activeOpacity={0.8}
              >
                <View style={[styles.attachIcon, { backgroundColor: it.color + "22" }]}>
                  <Ionicons name={it.icon as any} size={26} color={it.color} />
                </View>
                <Text style={styles.attachLabel}>{it.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

interface ContextMenuProps {
  visible: boolean;
  msg: Message | null;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onStar: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onTranslate: () => void;
  hasTranslation: boolean;
}

function MessageContextMenu({ visible, msg, onClose, onReply, onCopy, onForward, onStar, onDelete, onReact, onTranslate, hasTranslation }: ContextMenuProps) {
  if (!msg) return null;
  const actions = [
    { icon: "arrow-undo", label: "Reply", onPress: onReply, color: COLORS.white },
    { icon: "language", label: hasTranslation ? "Remove Translation" : "Translate", onPress: onTranslate, color: COLORS.orange },
    { icon: "copy-outline", label: "Copy", onPress: onCopy, color: COLORS.white },
    { icon: "arrow-redo-outline", label: "Forward", onPress: onForward, color: COLORS.white },
    { icon: msg.isStarred ? "star" : "star-outline", label: msg.isStarred ? "Unstar" : "Star", onPress: onStar, color: "#F39C12" },
    { icon: "trash-outline", label: "Delete", onPress: onDelete, color: "#E74C3C" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.ctxOverlay} onPress={onClose}>
        <View style={styles.ctxMenu}>
          <View style={styles.ctxReactions}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => { onReact(emoji); onClose(); }} style={styles.ctxReactionBtn}>
                <Text style={styles.ctxReactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ctxDivider} />
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.ctxItem} onPress={() => { a.onPress(); onClose(); }}>
              <Ionicons name={a.icon as any} size={19} color={a.color} />
              <Text style={[styles.ctxLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function QuickReplySuggestions({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickReplies}
      style={styles.quickRepliesScroll}
    >
      {suggestions.map((s, i) => (
        <TouchableOpacity key={i} style={styles.quickReplyBtn} onPress={() => onSelect(s)} activeOpacity={0.8}>
          <Text style={styles.quickReplyText}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const SEND_CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "AED", symbol: "د.إ", flag: "🇦🇪" },
  { code: "IQD", symbol: "د.ع", flag: "🇮🇶" },
  { code: "BTC", symbol: "₿", flag: "₿" },
  { code: "ETH", symbol: "Ξ", flag: "Ξ" },
  { code: "USDT", symbol: "₮", flag: "💵" },
];

function SendMoneySheet({ visible, onClose, onSend, recipientName }: {
  visible: boolean;
  onClose: () => void;
  onSend: (amount: number, currency: string, note: string) => void;
  recipientName: string;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const insets = useSafeAreaInsets();
  const sel = SEND_CURRENCIES.find((c) => c.code === currency) ?? SEND_CURRENCIES[0];

  function handleSend() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSend(num, currency, note.trim());
    setAmount("");
    setNote("");
    setCurrency("USD");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.attachOverlay} onPress={onClose}>
        <Pressable style={[styles.moneySheet, { paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.attachHandle} />
          <View style={styles.moneySheetHeader}>
            <View style={styles.moneySheetIconWrap}>
              <Ionicons name="cash" size={28} color="#27AE60" />
            </View>
            <Text style={styles.moneySheetTitle}>Send Money</Text>
            <Text style={styles.moneySheetTo}>to {recipientName}</Text>
          </View>

          <View style={styles.moneyAmountRow}>
            <Text style={styles.moneyCurrSymbol}>{sel.symbol}</Text>
            <TextInput
              style={styles.moneyAmountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              autoFocus={visible}
              selectionColor={COLORS.orange}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moneyCurrRow}>
            {SEND_CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.moneyCurrBtn, currency === c.code && styles.moneyCurrBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setCurrency(c.code); }}
                activeOpacity={0.8}
              >
                <Text style={styles.moneyCurrFlag}>{c.flag}</Text>
                <Text style={[styles.moneyCurrLabel, currency === c.code && { color: COLORS.orange }]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.moneyNoteRow}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.moneyNoteInput}
              placeholder="Add a note (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={100}
            />
          </View>

          <TouchableOpacity
            style={[styles.moneySendBtn, !parseFloat(amount) && styles.moneySendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#27AE60", "#1E8449"]} style={styles.moneySendGradient}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.moneySendText}>
                Send {sel.symbol}{parseFloat(amount) > 0 ? parseFloat(amount).toLocaleString() : "0"} {currency}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ChatDetailScreen() {
  const { id, name, avatar, color } = useLocalSearchParams<{ id: string; name: string; avatar: string; color: string }>();
  const { userId } = useCurrentUser();
  const { isConfigured } = useAppConfig();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>(() => {
    const base = MESSAGES[id ?? ""] ?? [];
    return [...base].reverse();
  });
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [showMoneySheet, setShowMoneySheet] = useState(false);
  const [showCtxMenu, setShowCtxMenu] = useState(false);
  const [ctxMsg, setCtxMsg] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set(messages.filter((m) => m.isStarred).map((m) => m.id)));
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [translateLang, setTranslateLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [translatedMsgs, setTranslatedMsgs] = useState<Record<string, string>>({});
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordAnim = useRef(new Animated.Value(1)).current;
  const flatRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof subscribeToMessages> | null>(null);

  const conv = CONVERSATIONS.find((c) => c.id === id);
  const avatarColor = color || AVATAR_COLORS[Math.abs((id?.charCodeAt(0) ?? 0)) % AVATAR_COLORS.length];
  const contactName = name ?? "Contact";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery]);

  const quickReplies = QUICK_REPLY_SUGGESTIONS.default;

  useEffect(() => {
    if (!isConfigured || !userId || !id) return;
    setIsSupabaseActive(true);
    let mounted = true;
    fetchMessages(userId, id).then((raw) => {
      if (!mounted) return;
      const converted: Message[] = raw.reverse().map((m: PrivateMessage) => ({
        id: m.id,
        text: m.content,
        sender: m.sender_id === userId ? "me" : "them",
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: !!m.read_at,
        type: (m.message_type as any) || "text",
        deliveryStatus: m.sender_id === userId ? (m.read_at ? "read" : "delivered") : undefined,
      }));
      setMessages(converted.length ? converted : messages);
    });
    markAsRead(userId, id);
    channelRef.current = subscribeToMessages(userId, id, (newMsg: PrivateMessage) => {
      if (newMsg.sender_id === userId) return;
      setMessages((prev) => [
        {
          id: newMsg.id,
          text: newMsg.content,
          sender: "them",
          time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
          type: (newMsg.message_type as any) || "text",
        },
        ...prev,
      ]);
      setShowTyping(false);
    });
    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, [isConfigured, userId, id]);

  useEffect(() => {
    if (!showTyping) return;
    const t = setTimeout(() => setShowTyping(false), 3000);
    return () => clearTimeout(t);
  }, [showTyping]);

  const startRecording = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    setRecordSecs(0);
    recordTimer.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(recordAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const stopRecording = useCallback((send: boolean) => {
    setIsRecording(false);
    if (recordTimer.current) clearInterval(recordTimer.current);
    recordAnim.stopAnimation();
    recordAnim.setValue(1);
    if (send && recordSecs > 0) {
      const voiceMsg: Message = {
        id: msgId(),
        text: "",
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
        type: "voice",
        duration: recordSecs,
        deliveryStatus: "sent",
      };
      setMessages((prev) => [voiceMsg, ...prev]);
    }
    setRecordSecs(0);
  }, [recordSecs]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: msgId(),
      text,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "text",
      deliveryStatus: "sent",
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, sender: replyTo.sender } : undefined,
    };
    setMessages((prev) => [newMsg, ...prev]);
    setInputText("");
    setReplyTo(null);
    if (isConfigured && userId && id) {
      try { await sendMessage(userId, id, text); } catch {}
    }
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, deliveryStatus: "delivered" } : m)), 1200);
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, deliveryStatus: "read" } : m)), 3000);
  }, [inputText, replyTo, isConfigured, userId, id]);

  const handleLongPress = useCallback((msg: Message) => {
    setCtxMsg(msg);
    setShowCtxMenu(true);
  }, []);

  const handleReact = useCallback((emoji: string) => {
    if (!ctxMsg) return;
    setMessages((prev) => prev.map((m) => {
      if (m.id !== ctxMsg.id) return m;
      const existing = m.reactions?.find((r) => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions?.filter((r) => r.emoji !== emoji) };
      }
      return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1, mine: true }] };
    }));
  }, [ctxMsg]);

  const handleStar = useCallback(() => {
    if (!ctxMsg) return;
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(ctxMsg.id) ? next.delete(ctxMsg.id) : next.add(ctxMsg.id);
      return next;
    });
  }, [ctxMsg]);

  const handleDelete = useCallback(() => {
    if (!ctxMsg) return;
    setMessages((prev) => prev.map((m) => m.id === ctxMsg.id ? { ...m, isDeleted: true } : m));
  }, [ctxMsg]);

  const handleTranslate = useCallback(() => {
    if (!ctxMsg || !ctxMsg.text) return;
    setTranslatedMsgs((prev) => {
      if (prev[ctxMsg.id]) {
        const next = { ...prev };
        delete next[ctxMsg.id];
        return next;
      }
      return { ...prev, [ctxMsg.id]: simulateTranslate(ctxMsg.text, translateLang) };
    });
    Haptics.selectionAsync();
  }, [ctxMsg, translateLang]);

  const filteredTranslateLangs = CHAT_TRANSLATE_LANGS.filter(
    (l) => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleAttach = useCallback((type: string) => {
    const typeLabels: Record<string, string> = {
      image: "📷 Photo",
      file: "📄 Document",
      location: "📍 Location",
      contact: "👤 Contact",
      camera: "📸 Camera",
      audio: "🎵 Audio",
      video: "🎬 Video",
      gif: "GIF",
    };
    const mockMsg: Message = {
      id: msgId(),
      text: typeLabels[type] || type,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: type as any,
      fileName: type === "file" ? "document.pdf" : undefined,
      fileSize: type === "file" ? "2.4 MB" : undefined,
      locationName: type === "location" ? "Current Location" : undefined,
      deliveryStatus: "sent",
    };
    setMessages((prev) => [mockMsg, ...prev]);
  }, []);

  const handleSendMoney = useCallback(async (amount: number, currency: string, note: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const moneyMsg: Message = {
      id: msgId(),
      text: `💸 Sent ${amount} ${currency}${note ? ` · ${note}` : ""}`,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "money",
      amount,
      currency,
      note: note || undefined,
      transferStatus: "pending",
      deliveryStatus: "sent",
    };
    setMessages((prev) => [moneyMsg, ...prev]);
    if (isConfigured && userId && id) {
      const encoded = `NEXUS_MONEY:${JSON.stringify({ a: amount, c: currency, n: note })}`;
      try { await sendMessage(userId, id, encoded); } catch {}
    }
    setTimeout(() => setMessages((prev) => prev.map((m) =>
      m.id === moneyMsg.id ? { ...m, deliveryStatus: "delivered", transferStatus: "sent" } : m
    )), 1500);
    setTimeout(() => setMessages((prev) => prev.map((m) =>
      m.id === moneyMsg.id ? { ...m, deliveryStatus: "read", transferStatus: "completed" } : m
    )), 4000);
  }, [isConfigured, userId, id]);

  const disappearingLabel = conv?.disappearing && conv.disappearing !== "off"
    ? `Messages disappear in ${conv.disappearing}`
    : null;

  return (
    <StarryBackground>
      <View style={[styles.header, { paddingTop: topPad + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerUser} activeOpacity={0.8}>
          <View style={[styles.headerAvatar, { backgroundColor: avatarColor }]}>
            {conv?.isGroup
              ? <Ionicons name="people" size={18} color="#fff" />
              : <Text style={styles.headerAvatarText}>{avatar || contactName.slice(0, 2)}</Text>
            }
          </View>
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
            <View style={styles.statusRow}>
              {conv?.online && !conv?.isGroup
                ? <><View style={styles.onlineDot} /><Text style={styles.headerStatus}>Active now</Text></>
                : conv?.isGroup
                ? <Text style={styles.headerStatus}>{conv.members?.join(", ").substring(0, 30)}</Text>
                : <Text style={styles.headerStatus}>{conv?.lastSeen || "last seen recently"}</Text>
              }
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {showSearch ? (
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => { setShowSearch(false); setSearchQuery(""); }}>
              <Ionicons name="close" size={20} color={COLORS.orange} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.headerActionBtn, autoTranslate && styles.headerActionBtnActive]}
                onPress={() => setShowLangPicker(true)}
              >
                <Ionicons name="language" size={18} color={autoTranslate ? COLORS.orange : COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowSearch(true)}>
                <Ionicons name="search" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: "/chat/call", params: { name, avatar, color, callType: "video" } }); }}
              >
                <Ionicons name="videocam" size={19} color={COLORS.orange} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: "/chat/call", params: { name, avatar, color, callType: "audio" } }); }}
              >
                <Ionicons name="call" size={18} color={COLORS.orange} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in chat..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {disappearingLabel && (
        <View style={styles.disappearBanner}>
          <Ionicons name="timer-outline" size={13} color={COLORS.orange} />
          <Text style={styles.disappearText}>{disappearingLabel}</Text>
        </View>
      )}

      <View style={styles.encryptionBar}>
        <Ionicons name="lock-closed" size={11} color={COLORS.textMuted} />
        <Text style={styles.encryptionText}>End-to-end encrypted · Ghost Protocol AES-256</Text>
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              contactName={contactName}
              onLongPress={handleLongPress}
              isStarred={starred.has(item.id)}
              translatedText={translatedMsgs[item.id] || (autoTranslate && item.text && translateLang.code !== "en" ? simulateTranslate(item.text, translateLang) : undefined)}
              translateLang={translateLang}
            />
          )}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={showTyping ? <TypingIndicator name={contactName.split(" ")[0]} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIcon, { backgroundColor: avatarColor }]}>
                <Text style={styles.emptyChatInitials}>{avatar || contactName.slice(0, 2)}</Text>
              </View>
              <Text style={styles.emptyChatName}>{contactName}</Text>
              <Text style={styles.emptyChatSub}>Send a message to start a conversation</Text>
            </View>
          }
        />

        {!inputText && quickReplies.length > 0 && messages.length > 0 && messages[0]?.sender === "them" && (
          <QuickReplySuggestions suggestions={quickReplies} onSelect={(s) => setInputText(s)} />
        )}

        {replyTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyBarAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyBarTo}>Replying to {replyTo.sender === "me" ? "yourself" : contactName}</Text>
              <Text style={styles.replyBarText} numberOfLines={1}>{replyTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: bottomPad + 6 }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setShowAttach(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={28} color={COLORS.orange} />
          </TouchableOpacity>

          {!isRecording && (
            <TouchableOpacity
              testID="send-money-btn"
              accessibilityLabel="send money"
              style={styles.moneyInputBtn}
              onPress={() => {
                setShowMoneySheet(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
              activeOpacity={0.65}
            >
              <Ionicons name="cash-outline" size={24} color="#27AE60" />
            </TouchableOpacity>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="اكتب رسالتك المشفرة..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4096}
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <Ionicons name="happy-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {isRecording ? (
            <View style={styles.recordingArea}>
              <Animated.View style={[styles.recordDot, { transform: [{ scale: recordAnim }] }]} />
              <Text style={styles.recordTimer}>
                {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
              </Text>
              <TouchableOpacity onPress={() => stopRecording(false)} style={styles.recordCancel}>
                <Ionicons name="trash-outline" size={20} color="#E74C3C" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => stopRecording(true)} style={styles.recordSend}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.sendBtnGradient}>
                <Ionicons name="send" size={17} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.micBtn}
              onLongPress={startRecording}
              onPressOut={() => isRecording && stopRecording(true)}
              delayLongPress={300}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.micBtnGradient}>
                <Ionicons name="mic" size={19} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <AttachSheet visible={showAttach} onClose={() => setShowAttach(false)} onSelect={handleAttach} />

      <SendMoneySheet
        visible={showMoneySheet}
        onClose={() => setShowMoneySheet(false)}
        onSend={handleSendMoney}
        recipientName={contactName}
      />

      <MessageContextMenu
        visible={showCtxMenu}
        msg={ctxMsg}
        onClose={() => setShowCtxMenu(false)}
        onReply={() => ctxMsg && setReplyTo(ctxMsg)}
        onCopy={() => {}}
        onForward={() => {}}
        onStar={handleStar}
        onDelete={handleDelete}
        onReact={handleReact}
        onTranslate={handleTranslate}
        hasTranslation={!!(ctxMsg && translatedMsgs[ctxMsg.id])}
      />

      {showLangPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
          <Pressable style={styles.ctxOverlay} onPress={() => setShowLangPicker(false)}>
            <Pressable style={styles.langPickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.langPickerHandle} />
              <Text style={styles.langPickerTitle}>Chat Translation Language</Text>
              <Text style={styles.langPickerSub}>
                Select language · Tap message → Translate · or enable Auto Translate
              </Text>
              <View style={styles.autoTranslateRow}>
                <View>
                  <Text style={styles.autoTranslateLabel}>Auto Translate All Messages</Text>
                  <Text style={styles.autoTranslateSub}>{translateLang.flag} {translateLang.name}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleBtn, autoTranslate && styles.toggleBtnActive]}
                  onPress={() => { setAutoTranslate(!autoTranslate); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.toggleText, autoTranslate && { color: COLORS.orange }]}>
                    {autoTranslate ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.langSearchRow}>
                <Ionicons name="search" size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.langSearchInput}
                  value={langSearch}
                  onChangeText={setLangSearch}
                  placeholder="Search language..."
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                {filteredTranslateLangs.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langRow, translateLang.code === lang.code && styles.langRowActive]}
                    onPress={() => {
                      setTranslateLang(lang);
                      if (autoTranslate) setTranslatedMsgs({});
                      setShowLangPicker(false);
                      setLangSearch("");
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.langName}>{lang.name}</Text>
                      <Text style={styles.langNative}>{lang.nativeName}</Text>
                    </View>
                    {translateLang.code === lang.code && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.orange} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 10, gap: 4 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.white },
  headerName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white, maxWidth: 160 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#27AE60" },
  headerStatus: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary, maxWidth: 160 },
  headerActions: { flexDirection: "row", gap: 2 },
  headerActionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  headerActionBtnActive: { backgroundColor: "rgba(230,126,34,0.15)", borderWidth: 1, borderColor: COLORS.orange },
  divider: { height: 1, backgroundColor: COLORS.border },
  encryptionBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 5, backgroundColor: "rgba(0,0,0,0.2)" },
  encryptionText: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  disappearBanner: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 4, backgroundColor: "rgba(230,126,34,0.1)" },
  disappearText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.orange },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.white, fontFamily: "Poppins_400Regular", fontSize: 14, padding: 0 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },
  msgRow: { flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  msgRowRight: { justifyContent: "flex-end" },
  msgRowLeft: { justifyContent: "flex-start" },
  msgAvatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.borderLight, alignItems: "center", justifyContent: "center", marginRight: 6, marginBottom: 4 },
  msgAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: COLORS.white },
  bubbleMax: { maxWidth: "78%" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, elevation: 1 },
  bubbleRight: { backgroundColor: COLORS.orange, borderBottomRightRadius: 4 },
  bubbleLeft: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  msgText: { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  msgTextRight: { color: "#fff" },
  msgTextLeft: { color: COLORS.white },
  msgMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 3, gap: 2 },
  msgTime: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  deletedBubble: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed" },
  deletedRight: { alignSelf: "flex-end" },
  deletedLeft: { alignSelf: "flex-start" },
  deletedText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },
  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3, marginLeft: 4 },
  reactionBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.borderLight },
  reactionMine: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeDim },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: COLORS.white },
  inBubbleReply: { flexDirection: "row", gap: 8, marginBottom: 6, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 8, padding: 6 },
  inBubbleReplyBar: { width: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  inBubbleReplySender: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 1 },
  inBubbleReplyText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  starBadge: { position: "absolute", top: -6, right: -4, zIndex: 1, backgroundColor: COLORS.card, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: COLORS.orange },
  forwardedLabel: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  forwardedText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.55)", fontStyle: "italic" },
  voiceRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  voiceWave: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2 },
  voiceBar: { width: 2, borderRadius: 1 },
  voiceDuration: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  fileIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  fileName: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  fileSize: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  locationMapThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  locationName: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  locationCoords: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  typingBubble: { flexDirection: "row", gap: 3, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  typingLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },
  emptyChat: { alignItems: "center", paddingTop: 60, gap: 12, transform: [{ scaleY: -1 }] },
  emptyChatIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyChatInitials: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff" },
  emptyChatName: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: COLORS.white },
  emptyChatSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textMuted, textAlign: "center" },
  quickRepliesScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: COLORS.border },
  quickReplies: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: "center" },
  quickReplyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, backgroundColor: COLORS.orangeDim, borderWidth: 1, borderColor: COLORS.orange },
  quickReplyText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.orange },
  replyBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(230,126,34,0.08)", borderTopWidth: 1, borderTopColor: COLORS.orange + "44" },
  replyBarAccent: { width: 3, height: "100%", borderRadius: 2, backgroundColor: COLORS.orange },
  replyBarTo: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.orange, marginBottom: 2 },
  replyBarText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
  replyClose: { padding: 4 },
  inputArea: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 8, backgroundColor: "rgba(17,17,17,0.97)", borderTopWidth: 1, borderTopColor: COLORS.border },
  attachBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  inputWrapper: { flex: 1, flexDirection: "row", alignItems: "flex-end", backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: 12, paddingVertical: 8, minHeight: 42 },
  input: { flex: 1, color: COLORS.white, fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 120, padding: 0 },
  emojiBtn: { width: 28, alignItems: "center", justifyContent: "flex-end", paddingBottom: 2 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", marginBottom: 1, shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  sendBtnGradient: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  micBtn: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", marginBottom: 1 },
  micBtnGradient: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  recordingArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(231,76,60,0.1)", borderRadius: 22, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(231,76,60,0.3)" },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E74C3C" },
  recordTimer: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E74C3C", flex: 1 },
  recordCancel: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  recordSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  attachOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  attachSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, paddingTop: 12 },
  attachHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: "center", marginBottom: 14 },
  attachTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white, paddingHorizontal: 20, marginBottom: 16 },
  attachGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  attachItem: { width: "22%", alignItems: "center", gap: 6 },
  attachIcon: { width: 58, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  attachLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
  ctxOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" },
  ctxMenu: { backgroundColor: COLORS.card, borderRadius: 18, width: 300, overflow: "hidden", borderWidth: 1, borderColor: COLORS.borderLight },
  ctxReactions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "rgba(255,255,255,0.04)" },
  ctxReactionBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  ctxReactionEmoji: { fontSize: 22 },
  ctxDivider: { height: 1, backgroundColor: COLORS.border },
  ctxItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  ctxLabel: { fontFamily: "Poppins_400Regular", fontSize: 15 },
  moneyBubble: { gap: 8, paddingVertical: 4 },
  moneyBubbleTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  moneyBubbleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  moneyBubbleAmount: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  moneyBubbleCurrency: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  moneyBubbleNote: { fontFamily: "Poppins_400Regular", fontSize: 13, fontStyle: "italic" },
  moneyBubbleStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  moneyStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  moneyStatusText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  moneyInputBtn: { width: 36, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  moneySheet: { backgroundColor: "#161616", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20 },
  moneySheetHeader: { alignItems: "center", gap: 4, paddingBottom: 20, paddingTop: 4 },
  moneySheetIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(39,174,96,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  moneySheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white },
  moneySheetTo: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted },
  moneyAmountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 20 },
  moneyCurrSymbol: { fontFamily: "Poppins_700Bold", fontSize: 36, color: COLORS.textMuted },
  moneyAmountInput: { fontFamily: "Poppins_700Bold", fontSize: 48, color: COLORS.white, minWidth: 80, textAlign: "center" },
  moneyCurrRow: { paddingHorizontal: 4, gap: 8, paddingBottom: 4, alignItems: "center" },
  moneyCurrBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: "center", gap: 2 },
  moneyCurrBtnActive: { backgroundColor: "rgba(39,174,96,0.12)", borderColor: "#27AE60" },
  moneyCurrFlag: { fontSize: 20 },
  moneyCurrLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textSecondary },
  moneyNoteRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  moneyNoteInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.white },
  moneySendBtn: { marginTop: 20, borderRadius: 18, overflow: "hidden", shadowColor: "#27AE60", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  moneySendBtnDisabled: { opacity: 0.45 },
  moneySendGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  moneySendText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  translationBlock: { marginTop: 6, paddingTop: 6 },
  translationDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 5 },
  translationHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  translationLang: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
  translationText: { fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 18, fontStyle: "italic" },

  langPickerSheet: {
    backgroundColor: "#1A1A1A", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, maxHeight: "75%",
  },
  langPickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  langPickerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: COLORS.white, marginBottom: 4 },
  langPickerSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  autoTranslateRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  autoTranslateLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white, marginBottom: 2 },
  autoTranslateSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  toggleBtnActive: { backgroundColor: "rgba(230,126,34,0.15)", borderColor: COLORS.orange },
  toggleText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary },
  langSearchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  langSearchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.white },
  langRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  langRowActive: { backgroundColor: "rgba(230,126,34,0.08)", borderRadius: 10, paddingHorizontal: 6 },
  langFlag: { fontSize: 22 },
  langName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.white },
  langNative: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)" },
});
