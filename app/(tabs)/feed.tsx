import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { StarryBackground } from "@/components/StarryBackground";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";
import {
  PEEP_POSTS,
  FOLLOWING_POSTS,
  PEEP_SPACES,
  TRENDING_TOPICS,
  PEEP_PROFILES,
  PEEP_NOTIFICATIONS,
  type PeepPost,
  type PeepSpace,
  type PeepProfile,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/constants/peepData";
import {
  PeepLanguageProvider,
  usePeepLanguage,
} from "@/contexts/PeepLanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_CHARS = 280;

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function maskSensitiveData(text: string): string {
  return text
    .replace(/\+?[\d][\d\s\-().]{7,}\d/g, "***-****")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "****@****.***")
    .replace(/@[\w]{1,5}\d{4,}/g, "@peep_user");
}

function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(#\w+|@\w+)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith("#") || part.startsWith("@") ? (
          <Text key={i} style={{ color: COLORS.orange }}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function LiveBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.liveBadge, small && styles.liveBadgeSmall]}>
      <View style={styles.liveDot} />
      <Text style={[styles.liveBadgeText, small && { fontSize: 8 }]}>LIVE</Text>
    </View>
  );
}

function LanguagePicker({
  visible, onClose, onSelect, current,
}: {
  visible: boolean; onClose: () => void; onSelect: (lang: Language) => void; current: Language;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>AI Translation Language</Text>
        <Text style={styles.sheetSub}>Posts will be AI-translated to your selected language</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langRow, current.code === lang.code && styles.langRowActive]}
              onPress={() => { Haptics.selectionAsync(); onSelect(lang); onClose(); }}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langNative}>{lang.nativeName}</Text>
              </View>
              {current.code === lang.code && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.orange} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity
      style={styles.action}
      onPress={() => {
        scale.value = withSequence(withTiming(1.5, { duration: 100 }), withTiming(1, { duration: 100 }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
      testID="like-button"
    >
      <Animated.View style={animStyle}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={19} color={liked ? "#E74C3C" : COLORS.textSecondary} />
      </Animated.View>
      <Text style={[styles.actionCount, liked && { color: "#E74C3C" }]}>{formatCount(count)}</Text>
    </TouchableOpacity>
  );
}

function PollCard({
  poll, postId, onVote,
}: {
  poll: NonNullable<PeepPost["poll"]>; postId: string; onVote: (postId: string, idx: number) => void;
}) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const hasVoted = poll.voted_index !== undefined;
  const isFinal = poll.ends_at === "Final results";
  return (
    <View style={styles.pollContainer}>
      {poll.options.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const isVoted = poll.voted_index === i;
        const isWinner = hasVoted && opt.votes === Math.max(...poll.options.map((o) => o.votes));
        return (
          <TouchableOpacity
            key={i}
            style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
            onPress={() => { if (!hasVoted) { Haptics.selectionAsync(); onVote(postId, i); } }}
            activeOpacity={hasVoted ? 1 : 0.7}
          >
            {hasVoted && (
              <View style={[styles.pollBar, { width: `${pct}%` as any, backgroundColor: isVoted ? COLORS.orange : "rgba(255,255,255,0.08)" }]} />
            )}
            <View style={styles.pollOptionRow}>
              <Text style={[styles.pollOptionText, isVoted && { color: COLORS.orange, fontFamily: "Poppins_600SemiBold" }]}>
                {opt.text}
              </Text>
              {hasVoted && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {isWinner && <Ionicons name="checkmark-circle" size={13} color={COLORS.orange} />}
                  <Text style={styles.pollPct}>{pct}%</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.pollMeta}>
        {formatCount(totalVotes)} votes · {isFinal ? "Final results" : poll.ends_at}
      </Text>
    </View>
  );
}

function QuotedPost({ post }: { post: NonNullable<PeepPost["quoted_post"]> }) {
  return (
    <View style={styles.quotedCard}>
      <View style={styles.quotedHeader}>
        <View style={[styles.quotedAvatar, { backgroundColor: post.avatar_color }]}>
          <Text style={styles.quotedAvatarText}>{post.avatar_initials}</Text>
        </View>
        <Text style={styles.quotedDisplayName}>{post.display_name}</Text>
        {post.is_verified && <Ionicons name="checkmark-circle" size={12} color={COLORS.orange} />}
        <Text style={styles.quotedUsername}>{post.peep_username}</Text>
        <Text style={styles.quotedTime}> · {post.created_at}</Text>
      </View>
      <Text style={styles.quotedContent} numberOfLines={3}>{post.content}</Text>
    </View>
  );
}

function SpacesBar({ spaces, onSpacePress }: { spaces: PeepSpace[]; onSpacePress: (s: PeepSpace) => void }) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.spacesBar}
      >
        {spaces.map((space) => (
          <TouchableOpacity
            key={space.id}
            style={styles.spaceItem}
            onPress={() => { Haptics.selectionAsync(); onSpacePress(space); }}
            activeOpacity={0.8}
          >
            <View style={styles.spaceAvatarWrap}>
              <View style={[styles.spaceAvatar, { backgroundColor: space.host_avatar_color }]}>
                <Text style={styles.spaceAvatarText}>{space.host_initials}</Text>
              </View>
              {space.is_live && (
                <View style={styles.spaceLiveDot} />
              )}
            </View>
            <Text style={styles.spaceName} numberOfLines={2}>{space.title}</Text>
            <Text style={styles.spaceListeners}>{formatCount(space.listeners)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.separatorFull} />
    </View>
  );
}

function FeedTabs({ activeTab, onTabChange }: { activeTab: "foryou" | "following"; onTabChange: (t: "foryou" | "following") => void }) {
  return (
    <View style={styles.feedTabs}>
      {(["foryou", "following"] as const).map((tab) => {
        const label = tab === "foryou" ? "For You" : "Following";
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.feedTab}
            onPress={() => { Haptics.selectionAsync(); onTabChange(tab); }}
            testID={`tab-${tab}`}
          >
            <Text style={[styles.feedTabText, isActive && styles.feedTabTextActive]}>{label}</Text>
            {isActive && <View style={styles.feedTabLine} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PeepCard({
  item, onLike, onRetweet, onBookmark, onOpenMore, onOpenRepost, onOpenProfile, onVote,
}: {
  item: PeepPost;
  onLike: (id: string) => void;
  onRetweet: (id: string) => void;
  onBookmark: (id: string) => void;
  onOpenMore: (post: PeepPost) => void;
  onOpenRepost: (post: PeepPost) => void;
  onOpenProfile: (username: string) => void;
  onVote: (postId: string, idx: number) => void;
}) {
  const { translateText, selectedLang } = usePeepLanguage();
  const safeContent = maskSensitiveData(item.content);
  const translated = selectedLang.code !== "en" ? translateText(safeContent, item.lang_origin) : safeContent;
  const isTranslated = translated !== safeContent;

  return (
    <View style={styles.card}>
      {item.reposted_by && (
        <View style={styles.repostedRow}>
          <MaterialCommunityIcons name="repeat-variant" size={14} color={COLORS.textMuted} />
          <Text style={styles.repostedText}>{item.reposted_by.display_name} reposted</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={() => onOpenProfile(item.peep_username)} activeOpacity={0.8}>
            <View style={[styles.avatar, { backgroundColor: item.avatar_color }]}>
              <Text style={styles.avatarText}>{item.avatar_initials}</Text>
            </View>
            {item.is_live && (
              <View style={styles.liveAvatarBadge}>
                <LiveBadge small />
              </View>
            )}
          </TouchableOpacity>
          {item.has_thread_line && <View style={styles.threadLine} />}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.cardMeta}>
            <View style={styles.userRow}>
              <TouchableOpacity onPress={() => onOpenProfile(item.peep_username)} activeOpacity={0.8}>
                <Text style={styles.displayName}>{item.display_name}</Text>
              </TouchableOpacity>
              {item.is_verified && (
                <Ionicons name="checkmark-circle" size={14} color={COLORS.orange} style={{ marginLeft: 3 }} />
              )}
              <Text style={styles.timeText}> · {item.created_at}</Text>
            </View>
            <Text style={styles.peepUsername}>{item.peep_username}</Text>
          </View>

          {isTranslated && (
            <View style={styles.translationBadge}>
              <Ionicons name="language" size={11} color={COLORS.orange} />
              <Text style={styles.translationText}>AI · {selectedLang.flag} {selectedLang.name}</Text>
            </View>
          )}

          <RichText text={translated} style={styles.content} />

          {item.is_thread_start && item.thread_count && (
            <TouchableOpacity style={styles.threadBadge} onPress={() => Haptics.selectionAsync()}>
              <Text style={styles.threadBadgeText}>Show this thread ({item.thread_count} peeps)</Text>
            </TouchableOpacity>
          )}

          {item.media_emoji && item.media_type && (
            <TouchableOpacity
              style={styles.mediaCard}
              onPress={() => item.is_live && router.push("/peep/live")}
              activeOpacity={item.is_live ? 0.8 : 1}
            >
              <LinearGradient colors={["#1A1A2E", "#0D0D1A"]} style={styles.mediaGradient}>
                <Text style={styles.mediaEmoji}>{item.media_emoji}</Text>
                {item.media_type === "4k" && (
                  <View style={styles.quality4kBadge}>
                    <Text style={styles.quality4kText}>4K UHD</Text>
                  </View>
                )}
                {item.is_live && <View style={styles.mediaLiveBadge}><LiveBadge /></View>}
                {item.is_live && (
                  <View style={styles.watchLiveRow}>
                    <Ionicons name="play-circle" size={18} color={COLORS.white} />
                    <Text style={styles.watchLiveText}>Watch Live</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {item.poll && (
            <PollCard poll={item.poll} postId={item.id} onVote={onVote} />
          )}

          {item.quoted_post && <QuotedPost post={item.quoted_post} />}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => Haptics.selectionAsync()} testID="reply-button">
              <Ionicons name="chatbubble-outline" size={17} color={COLORS.textSecondary} />
              <Text style={styles.actionCount}>{formatCount(item.replies_count)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenRepost(item); }}
              testID="repost-button"
            >
              <MaterialCommunityIcons
                name="repeat-variant"
                size={20}
                color={item.is_retweeted ? COLORS.success : COLORS.textSecondary}
              />
              <Text style={[styles.actionCount, item.is_retweeted && { color: COLORS.success }]}>
                {formatCount(item.retweets_count + (item.is_retweeted ? 1 : 0))}
              </Text>
            </TouchableOpacity>

            <LikeButton
              liked={item.is_liked}
              count={item.likes_count + (item.is_liked ? 1 : 0)}
              onPress={() => onLike(item.id)}
            />

            <TouchableOpacity
              style={styles.action}
              activeOpacity={0.7}
              onPress={() => { Haptics.selectionAsync(); onBookmark(item.id); }}
              testID="bookmark-button"
            >
              <Ionicons
                name={item.is_bookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={item.is_bookmarked ? COLORS.orange : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => Haptics.selectionAsync()}>
              <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onOpenMore(item); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="more-button">
              <Ionicons name="ellipsis-horizontal" size={17} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewsRow}>
            <Ionicons name="bar-chart-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.viewsText}>{formatCount(item.views_count)} views</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const AUDIENCES = ["Everyone", "Circle", "Mentioned only"] as const;

function ComposeModal({ visible, onClose, onPost }: {
  visible: boolean; onClose: () => void; onPost: (text: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { avatarUri, avatarEmoji, ghostUsername } = useCurrentUser();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<typeof AUDIENCES[number]>("Everyone");
  const [threadParts, setThreadParts] = useState<string[]>([]);

  function updateThreadPart(idx: number, val: string) {
    setThreadParts((prev) => prev.map((p, i) => (i === idx ? val : p)));
  }
  const remaining = MAX_CHARS - text.length;
  const pct = Math.min(text.length / MAX_CHARS, 1);
  const circumference = 2 * Math.PI * 11;
  const over = remaining < 0;
  const audienceIdx = AUDIENCES.indexOf(audience);

  function handlePost() {
    if (text.trim().length === 0 || over) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPost(text.trim());
    setText("");
    setThreadParts([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.composeModal, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.composeHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.composeCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.composeTitle}>New Peep</Text>
          <TouchableOpacity
            style={[styles.postBtn, (text.trim().length === 0 || over) && styles.postBtnDisabled]}
            onPress={handlePost}
            testID="compose-post-btn"
          >
            <Text style={[styles.postBtnText, (text.trim().length === 0 || over) && { opacity: 0.5 }]}>Peep</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.composeBody}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatar, { marginTop: 4, borderWidth: 2, borderColor: COLORS.orange }]} contentFit="cover" />
            ) : (
              <LinearGradient colors={[COLORS.orange, "#D35400"]} style={[styles.avatar, { marginTop: 4 }]}>
                <Text style={styles.avatarText}>{avatarEmoji || (ghostUsername || "ME").slice(0, 2).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.audiencePill}
                onPress={() => { Haptics.selectionAsync(); setAudience(AUDIENCES[(audienceIdx + 1) % AUDIENCES.length]); }}
                testID="audience-picker"
              >
                <Ionicons name="globe-outline" size={12} color={COLORS.orange} />
                <Text style={styles.audiencePillText}>{audience}</Text>
                <Ionicons name="chevron-down" size={11} color={COLORS.orange} />
              </TouchableOpacity>
              <TextInput
                style={styles.composeInput}
                placeholder="What's happening?"
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={text}
                onChangeText={setText}
                maxLength={MAX_CHARS + 50}
                testID="compose-input"
              />
              {threadParts.map((part, i) => (
                <View key={i} style={styles.threadPartRow}>
                  <View style={styles.threadPartLine} />
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: COLORS.orange }} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={[COLORS.orange, "#D35400"]} style={[styles.avatar, { width: 32, height: 32, borderRadius: 16, marginRight: 10 }]}>
                      <Text style={[styles.avatarText, { fontSize: 10 }]}>{avatarEmoji || "ME"}</Text>
                    </LinearGradient>
                  )}
                  <TextInput
                    style={[styles.composeInput, { flex: 1, marginBottom: 0, minHeight: 40 }]}
                    placeholder="Add to thread..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    value={part}
                    onChangeText={(v) => updateThreadPart(i, v)}
                    testID={`thread-input-${i}`}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.composeToolbar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
          <View style={styles.composeTools}>
            {["image", "bar-chart-outline", "location-outline", "happy-outline", "calendar-outline"].map((icon, i) => (
              <TouchableOpacity key={i} onPress={() => Haptics.selectionAsync()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={icon as any} size={22} color={COLORS.orange} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.composeRight}>
            {text.length > 0 && (
              <View style={styles.charCounter}>
                <View style={[styles.charCircle, { borderColor: over ? "#E74C3C" : remaining < 20 ? "#F7931A" : COLORS.orange }]}>
                  <Text style={[styles.charNum, { color: over ? "#E74C3C" : remaining < 20 ? "#F7931A" : COLORS.textSecondary }]}>
                    {remaining < 20 ? remaining : ""}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.dividerV} />
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setThreadParts((p) => [...p, ""]); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="add-thread-btn"
            >
              <Ionicons name="add-circle-outline" size={24} color={COLORS.orange} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const MORE_MENU_ITEMS = [
  { key: "mute", icon: "volume-mute-outline", label: "Mute @user" },
  { key: "block", icon: "ban-outline", label: "Block @user" },
  { key: "report", icon: "flag-outline", label: "Report" },
  { key: "copy", icon: "link-outline", label: "Copy link" },
  { key: "list", icon: "list-outline", label: "Add to List" },
  { key: "bookmark", icon: "bookmark-outline", label: "Bookmark" },
  { key: "follow", icon: "person-add-outline", label: "Follow @user" },
  { key: "embed", icon: "code-outline", label: "Embed Peep" },
] as const;

function MoreMenuSheet({ post, visible, onClose, onAction }: {
  post: PeepPost | null; visible: boolean; onClose: () => void; onAction: (key: string, post: PeepPost) => void;
}) {
  if (!post) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{post.display_name}</Text>
        <Text style={styles.sheetSub}>{post.peep_username}</Text>
        <View style={{ marginTop: 8 }}>
          {MORE_MENU_ITEMS.map((item) => {
            const label = item.label.replace("@user", post.peep_username);
            const isDanger = item.key === "mute" || item.key === "block" || item.key === "report";
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.menuRow}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAction(item.key, post); onClose(); }}
                testID={`more-${item.key}`}
              >
                <Ionicons name={item.icon as any} size={20} color={isDanger ? "#E74C3C" : COLORS.white} />
                <Text style={[styles.menuLabel, isDanger && { color: "#E74C3C" }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function RepostMenuSheet({ post, visible, onClose, onRepost, onQuote }: {
  post: PeepPost | null; visible: boolean; onClose: () => void; onRepost: (id: string) => void; onQuote: (post: PeepPost) => void;
}) {
  if (!post) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.bottomSheet, { paddingBottom: 32 }]}>
        <View style={styles.sheetHandle} />
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRepost(post.id); onClose(); }}
          testID="repost-confirm"
        >
          <MaterialCommunityIcons name="repeat-variant" size={22} color={post.is_retweeted ? COLORS.success : COLORS.white} />
          <Text style={[styles.menuLabel, post.is_retweeted && { color: COLORS.success }]}>
            {post.is_retweeted ? "Undo Repost" : "Repost"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onQuote(post); onClose(); }}
          testID="quote-peep"
        >
          <Ionicons name="create-outline" size={22} color={COLORS.white} />
          <Text style={styles.menuLabel}>Quote Peep</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ProfileSheet({ profile, visible, onClose, onFollow, onOpenProfile }: {
  profile: PeepProfile | null; visible: boolean; onClose: () => void; onFollow: (username: string) => void; onOpenProfile: () => void;
}) {
  if (!profile) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.bottomSheet, { paddingBottom: 36 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.profileSheetHeader}>
          <View style={[styles.profileSheetAvatar, { backgroundColor: profile.avatar_color }]}>
            <Text style={styles.profileSheetAvatarText}>{profile.avatar_initials}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, profile.is_following && styles.followingBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onFollow(profile.peep_username); }}
            testID="profile-follow-btn"
          >
            <Text style={[styles.followBtnText, profile.is_following && { color: COLORS.white }]}>
              {profile.is_following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
          <Text style={styles.profileName}>{profile.display_name}</Text>
          {profile.is_verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.orange} />}
        </View>
        <Text style={styles.profileUsername}>{profile.peep_username}</Text>
        {profile.bio ? <Text style={styles.profileBio}>{profile.bio}</Text> : null}
        {profile.location && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.profileMeta}>{profile.location}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.profileMeta}>Joined {profile.joined}</Text>
        </View>
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{formatCount(profile.following_count)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{formatCount(profile.followers_count)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{formatCount(profile.posts_count)}</Text>
            <Text style={styles.statLabel}>Peeps</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewProfileBtn} onPress={() => { onClose(); onOpenProfile(); }} testID="view-full-profile-btn">
          <Text style={styles.viewProfileText}>View full profile</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function SearchSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.searchModal, { paddingTop: topPad }]}>
        <View style={styles.searchHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Peep"
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
              testID="search-input"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.trendingHeader}>Trends for you</Text>
          {TRENDING_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.trendingRow}
              onPress={() => { Haptics.selectionAsync(); setSearchText(topic.hashtag); }}
              testID={`trending-${topic.id}`}
            >
              <View style={{ flex: 1 }}>
                {topic.promoted ? (
                  <Text style={styles.promotedLabel}>Promoted</Text>
                ) : (
                  <Text style={styles.trendingCategory}>{topic.category}</Text>
                )}
                <Text style={styles.trendingHashtag}>{topic.hashtag}</Text>
                {!topic.promoted && (
                  <Text style={styles.trendingCount}>{formatCount(topic.posts_count)} peeps</Text>
                )}
              </View>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.showMoreBtn} onPress={() => Haptics.selectionAsync()}>
            <Text style={styles.showMoreText}>Show more</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
  like: { icon: "heart", color: "#E74C3C" },
  repost: { icon: "repeat-variant", color: COLORS.success },
  follow: { icon: "person-add", color: COLORS.orange },
  mention: { icon: "at", color: "#2980B9" },
  reply: { icon: "chatbubble", color: "#9B59B6" },
  quote: { icon: "chatbubble-ellipses", color: "#F7931A" },
};

function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const [notifs, setNotifs] = useState(PEEP_NOTIFICATIONS);
  const unread = notifs.filter((n) => !n.is_read).length;

  function markAllRead() {
    Haptics.selectionAsync();
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.searchModal, { paddingTop: topPad }]}>
        <View style={styles.notifHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.notifTitle}>Notifications</Text>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead} testID="mark-all-read">
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {notifs.map((notif) => {
            const icon = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.like;
            const useMCI = notif.type === "repost";
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifRow, !notif.is_read && styles.notifRowUnread]}
                onPress={() => { Haptics.selectionAsync(); setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)); }}
                testID={`notif-${notif.id}`}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: icon.color + "22" }]}>
                  {useMCI ? (
                    <MaterialCommunityIcons name={icon.icon as any} size={18} color={icon.color} />
                  ) : (
                    <Ionicons name={icon.icon as any} size={18} color={icon.color} />
                  )}
                </View>
                <View style={[styles.notifAvatarSmall, { backgroundColor: notif.actor_color }]}>
                  <Text style={styles.notifAvatarText}>{notif.actor_initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifActor}>
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>{notif.actor_display_name}</Text>
                    {notif.type === "like" ? " liked your peep" : notif.type === "repost" ? " reposted your peep" : notif.type === "follow" ? " followed you" : notif.type === "mention" ? " mentioned you" : notif.type === "reply" ? " replied to you" : " quoted your peep"}
                  </Text>
                  {notif.preview_text && (
                    <Text style={styles.notifPreview} numberOfLines={1}>{notif.preview_text}</Text>
                  )}
                </View>
                <Text style={styles.notifTime}>{notif.time}</Text>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function PeepFeedContent() {
  const insets = useSafeAreaInsets();
  const { ghostUsername, avatarUri, avatarEmoji } = useCurrentUser();
  const [posts, setPosts] = useState<PeepPost[]>(PEEP_POSTS);
  const [followingPosts, setFollowingPosts] = useState<PeepPost[]>(FOLLOWING_POSTS);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [refreshing, setRefreshing] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [moreMenuPost, setMoreMenuPost] = useState<PeepPost | null>(null);
  const [repostMenuPost, setRepostMenuPost] = useState<PeepPost | null>(null);
  const [profileUser, setProfileUser] = useState<PeepProfile | null>(null);
  const [quotingPost, setQuotingPost] = useState<PeepPost | null>(null);
  const [profiles, setProfiles] = useState(PEEP_PROFILES);

  const { selectedLang, setLanguage, isTranslating } = usePeepLanguage();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom;

  const displayPosts = activeTab === "foryou" ? posts : followingPosts;

  const unreadNotifCount = PEEP_NOTIFICATIONS.filter((n) => !n.is_read).length;
  const liveCount = useMemo(() => posts.filter((p) => p.is_live).length, [posts]);

  function updatePost(id: string, updater: (p: PeepPost) => PeepPost) {
    setPosts((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
    setFollowingPosts((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }

  const handleLike = useCallback((id: string) => {
    updatePost(id, (p) => ({ ...p, is_liked: !p.is_liked }));
  }, []);

  const handleRetweet = useCallback((id: string) => {
    updatePost(id, (p) => ({ ...p, is_retweeted: !p.is_retweeted }));
  }, []);

  const handleBookmark = useCallback((id: string) => {
    updatePost(id, (p) => ({ ...p, is_bookmarked: !p.is_bookmarked }));
  }, []);

  const handleVote = useCallback((postId: string, idx: number) => {
    updatePost(postId, (p) => {
      if (!p.poll || p.poll.voted_index !== undefined) return p;
      const newOptions = p.poll.options.map((o, i) =>
        i === idx ? { ...o, votes: o.votes + 1 } : o
      );
      return { ...p, poll: { ...p.poll, options: newOptions, voted_index: idx } };
    });
  }, []);

  const handlePost = useCallback((text: string) => {
    const uname = ghostUsername || "me";
    const newPost: PeepPost = {
      id: `user_${Date.now()}`,
      peep_username: `@${uname}`,
      display_name: uname,
      avatar_initials: uname.slice(0, 2).toUpperCase(),
      avatar_color: COLORS.orange,
      content: text,
      created_at: "now",
      likes_count: 0,
      retweets_count: 0,
      replies_count: 0,
      views_count: 0,
      is_liked: false,
      is_retweeted: false,
      is_bookmarked: false,
      is_verified: false,
      lang_origin: "en",
      ...(quotingPost ? { quoted_post: { ...quotingPost } } : {}),
    };
    setPosts((prev) => [newPost, ...prev]);
    setQuotingPost(null);
  }, [quotingPost]);

  const handleFollow = useCallback((username: string) => {
    setProfiles((prev) => ({
      ...prev,
      [username]: prev[username]
        ? { ...prev[username], is_following: !prev[username].is_following }
        : prev[username],
    }));
    if (profileUser?.peep_username === username) {
      setProfileUser((p) => p ? { ...p, is_following: !p.is_following } : p);
    }
  }, [profileUser]);

  const handleMoreAction = useCallback((key: string, post: PeepPost) => {
    if (key === "mute" || key === "block") {
      setPosts((prev) => prev.filter((p) => p.peep_username !== post.peep_username));
      setFollowingPosts((prev) => prev.filter((p) => p.peep_username !== post.peep_username));
    } else if (key === "bookmark") {
      handleBookmark(post.id);
    } else if (key === "follow") {
      handleFollow(post.peep_username);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [handleBookmark, handleFollow]);

  const handleOpenProfile = useCallback((username: string) => {
    const profile = profiles[username];
    if (profile) { setProfileUser(profile); }
    else {
      setProfileUser({ peep_username: username, display_name: username.replace("@", ""), avatar_initials: username.slice(1, 3).toUpperCase(), avatar_color: "#555", bio: "", following_count: 0, followers_count: 0, posts_count: 0, is_verified: false, joined: "2024", is_following: false });
    }
  }, [profiles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <StarryBackground>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.push("/profile")} activeOpacity={0.8} testID="my-avatar">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderWidth: 2, borderColor: COLORS.orange }]} contentFit="cover" />
          ) : (
            <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarEmoji || (ghostUsername || "NX").slice(0, 2).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Peep</Text>
          {liveCount > 0 && (
            <Text style={styles.headerLiveSub}>{liveCount} live now</Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, selectedLang.code !== "en" && styles.headerBtnActive]}
            onPress={() => setShowLangPicker(true)}
            testID="lang-picker-btn"
          >
            <Text style={styles.langFlag}>{selectedLang.flag}</Text>
            {isTranslating && <Ionicons name="sync" size={11} color={COLORS.orange} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(true)} testID="search-btn">
            <Ionicons name="search" size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowNotifications(true)}
            testID="notifications-btn"
          >
            <Ionicons name="notifications-outline" size={18} color={COLORS.white} />
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goLiveBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/peep/live"); }}
            testID="go-live-btn"
          >
            <View style={styles.goLiveDot} />
            <Text style={styles.goLiveText}>Live</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedLang.code !== "en" && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.translateBar}>
          <Ionicons name="language" size={14} color={COLORS.orange} />
          <Text style={styles.translateBarText}>AI translating to {selectedLang.flag} {selectedLang.name}</Text>
          <TouchableOpacity onPress={() => setLanguage(SUPPORTED_LANGUAGES[0])}>
            <Text style={styles.translateBarOff}>Turn off</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<SpacesBar spaces={PEEP_SPACES} onSpacePress={() => Haptics.selectionAsync()} />}
        renderItem={({ item }) => (
          <PeepCard
            item={item}
            onLike={handleLike}
            onRetweet={handleRetweet}
            onBookmark={handleBookmark}
            onOpenMore={setMoreMenuPost}
            onOpenRepost={setRepostMenuPost}
            onOpenProfile={handleOpenProfile}
            onVote={handleVote}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.orange} colors={[COLORS.orange]} />
        }
        scrollEnabled
      />

      <TouchableOpacity
        style={[styles.composeFab, { bottom: bottomPad + 76 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCompose(true); }}
        testID="compose-fab"
        accessibilityLabel="Compose new Peep"
        accessibilityRole="button"
      >
        <LinearGradient colors={[COLORS.orange, "#D35400"]} style={styles.composeFabInner}>
          <Ionicons name="create-outline" size={24} color={COLORS.white} />
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 9, color: "#fff", marginTop: 1 }}>NEW</Text>
        </LinearGradient>
      </TouchableOpacity>

      <LanguagePicker visible={showLangPicker} onClose={() => setShowLangPicker(false)} onSelect={setLanguage} current={selectedLang} />
      <ComposeModal visible={showCompose} onClose={() => { setShowCompose(false); setQuotingPost(null); }} onPost={handlePost} />
      <MoreMenuSheet post={moreMenuPost} visible={!!moreMenuPost} onClose={() => setMoreMenuPost(null)} onAction={handleMoreAction} />
      <RepostMenuSheet
        post={repostMenuPost}
        visible={!!repostMenuPost}
        onClose={() => setRepostMenuPost(null)}
        onRepost={handleRetweet}
        onQuote={(p) => { setQuotingPost(p); setShowCompose(true); }}
      />
      <ProfileSheet
        profile={profileUser}
        visible={!!profileUser}
        onClose={() => setProfileUser(null)}
        onFollow={handleFollow}
        onOpenProfile={() => setProfileUser(null)}
      />
      <SearchSheet visible={showSearch} onClose={() => setShowSearch(false)} />
      <NotificationsSheet visible={showNotifications} onClose={() => setShowNotifications(false)} />
    </StarryBackground>
  );
}

export default function FeedScreen() {
  return (
    <PeepLanguageProvider>
      <PeepFeedContent />
    </PeepLanguageProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  headerLiveSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#E74C3C",
    marginTop: -3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    gap: 3,
    position: "relative",
  },
  headerBtnActive: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeDim,
  },
  langFlag: { fontSize: 16 },
  goLiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E74C3C",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  goLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  goLiveText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#fff" },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },
  feedTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 0,
  },
  feedTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  feedTabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  feedTabTextActive: {
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
  },
  feedTabLine: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },
  spacesBar: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 16,
  },
  spaceItem: {
    alignItems: "center",
    width: 64,
    gap: 4,
  },
  spaceAvatarWrap: { position: "relative" },
  spaceAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.orange,
  },
  spaceAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.white,
  },
  spaceLiveDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#E74C3C",
    borderWidth: 2,
    borderColor: "#111",
  },
  spaceName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 13,
  },
  spaceListeners: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: COLORS.textMuted,
  },
  translateBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.orangeDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(230,126,34,0.25)",
  },
  translateBarText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.orange,
    flex: 1,
  },
  translateBarOff: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.orange,
    textDecorationLine: "underline",
  },
  list: { paddingTop: 0 },
  separator: { height: 1, backgroundColor: COLORS.border },
  separatorFull: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 0 },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  repostedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 52,
    marginBottom: 4,
  },
  repostedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: COLORS.white,
  },
  liveAvatarBadge: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  threadLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: COLORS.border,
    marginTop: 4,
    borderRadius: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E74C3C",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  liveBadgeSmall: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#fff" },
  liveBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.5,
  },
  cardMeta: { flexDirection: "column" },
  userRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  displayName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
  },
  timeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  peepUsername: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  content: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 22,
    marginBottom: 8,
    marginTop: 4,
  },
  translationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  translationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.orange,
  },
  threadBadge: {
    marginBottom: 8,
  },
  threadBadgeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.orange,
    textDecorationLine: "underline",
  },
  mediaCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    height: 140,
  },
  mediaGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaEmoji: { fontSize: 42 },
  quality4kBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#F7931A",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  quality4kText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  mediaLiveBadge: { position: "absolute", top: 10, left: 10 },
  watchLiveRow: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  watchLiveText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#fff" },
  pollContainer: { marginBottom: 10, gap: 8 },
  pollOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    minHeight: 40,
    justifyContent: "center",
  },
  pollOptionVoted: { borderColor: COLORS.orange },
  pollBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pollOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.white,
    flex: 1,
  },
  pollPct: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pollMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quotedCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  quotedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  quotedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quotedAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 8, color: COLORS.white },
  quotedDisplayName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.white,
  },
  quotedUsername: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  quotedTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.textMuted,
  },
  quotedContent: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  viewsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.textMuted,
  },
  composeFab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  composeFabInner: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  composeModal: {
    flex: 1,
    backgroundColor: "#111111",
  },
  composeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  composeCancel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: COLORS.white,
  },
  composeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: COLORS.white,
  },
  postBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  postBtnDisabled: { backgroundColor: COLORS.orangeDim },
  postBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
  },
  composeBody: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.orangeDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  audiencePillText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: COLORS.orange,
  },
  composeInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
    minHeight: 100,
    textAlignVertical: "top",
  },
  threadPartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    position: "relative",
  },
  threadPartLine: {
    position: "absolute",
    left: 15,
    top: -12,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
  },
  composeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  composeTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  composeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  charCounter: { alignItems: "center", justifyContent: "center" },
  charCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  charNum: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },
  dividerV: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bottomSheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingHorizontal: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: "#2E2E2E",
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 2,
  },
  sheetSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  langRowActive: { backgroundColor: COLORS.orangeDim },
  langName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
  },
  langNative: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: COLORS.white,
  },
  profileSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  profileSheetAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSheetAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.white,
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  followingBtn: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  followBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
  },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.white,
  },
  profileUsername: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBio: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    marginTop: 8,
  },
  profileMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textMuted,
  },
  profileStats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: { alignItems: "flex-start" },
  statNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.white,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  viewProfileBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  viewProfileText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: COLORS.white,
  },
  searchModal: {
    flex: 1,
    backgroundColor: "#111111",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: COLORS.white,
  },
  trendingHeader: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
  },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  promotedLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  trendingCategory: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  trendingHashtag: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 2,
  },
  trendingCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  showMoreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  showMoreText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: COLORS.orange,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.white,
    flex: 1,
  },
  markAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: COLORS.orange,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifRowUnread: {
    backgroundColor: "rgba(230,126,34,0.05)",
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: COLORS.white,
  },
  notifActor: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
  },
  notifPreview: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
    marginTop: 6,
    flexShrink: 0,
  },
});
