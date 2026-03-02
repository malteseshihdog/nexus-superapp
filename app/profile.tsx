import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "@/constants/colors";
import { useCurrentUser } from "@/contexts/UserContext";

const { width } = Dimensions.get("window");

const IDENTITY_SHIELDS = [
  { icon: "phone-portrait-outline", label: "Phone Number", status: "مخفي تماماً", hidden: true },
  { icon: "mail-outline", label: "Email Address", status: "مخفي تماماً", hidden: true },
  { icon: "location-outline", label: "IP Address", status: "مُقنَّع", hidden: true },
  { icon: "person-outline", label: "Real Name", status: "غير مرتبط", hidden: true },
];

const AVATAR_PRESETS = [
  { emoji: "👻", label: "Ghost" },
  { emoji: "🦅", label: "Eagle" },
  { emoji: "🌙", label: "Moon" },
  { emoji: "⚡", label: "Flash" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "🛡️", label: "Shield" },
  { emoji: "🌊", label: "Wave" },
  { emoji: "🎭", label: "Mask" },
];

function ShieldPulse({ active }: { active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(withTiming(1.12, { duration: 1200 }), withTiming(1, { duration: 1200 })),
        -1
      );
      opacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1200 }), withTiming(0.4, { duration: 1200 })),
        -1
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.2);
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.shieldGlow, { backgroundColor: active ? COLORS.orange : "#555" }, style]}
    />
  );
}

function PhotoPickerSheet({ visible, onClose, onPickGallery, onPickCamera, onRemove, hasPhoto }: {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onPickCamera: () => void;
  onRemove: () => void;
  hasPhoto: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>تغيير صورة الملف الشخصي</Text>

          <TouchableOpacity style={styles.pickerOption} onPress={onPickCamera} activeOpacity={0.8}>
            <View style={[styles.pickerOptionIcon, { backgroundColor: "rgba(41,128,185,0.15)" }]}>
              <Ionicons name="camera" size={22} color="#2980B9" />
            </View>
            <Text style={styles.pickerOptionText}>التقاط صورة</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerOption} onPress={onPickGallery} activeOpacity={0.8}>
            <View style={[styles.pickerOptionIcon, { backgroundColor: "rgba(142,68,173,0.15)" }]}>
              <Ionicons name="images" size={22} color="#8E44AD" />
            </View>
            <Text style={styles.pickerOptionText}>اختيار من المعرض</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {hasPhoto && (
            <TouchableOpacity style={styles.pickerOption} onPress={onRemove} activeOpacity={0.8}>
              <View style={[styles.pickerOptionIcon, { backgroundColor: "rgba(231,76,60,0.15)" }]}>
                <Ionicons name="trash-outline" size={22} color="#E74C3C" />
              </View>
              <Text style={[styles.pickerOptionText, { color: "#E74C3C" }]}>حذف الصورة</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.pickerCancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.pickerCancelText}>إلغاء</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    ghostUsername, ghostBio, isGhostMode,
    setGhostUsername, setGhostBio, setIsGhostMode,
    userId, avatarUri, avatarEmoji,
    setAvatarUri, setAvatarEmoji,
  } = useCurrentUser();

  const [usernameInput, setUsernameInput] = useState(ghostUsername);
  const [bioInput, setBioInput] = useState(ghostBio);
  const [selectedEmoji, setSelectedEmoji] = useState(avatarEmoji);
  const [saved, setSaved] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const peepHandle = `@${usernameInput || "ghost_user"}`;
  const initials = (usernameInput || "G").slice(0, 2).toUpperCase();

  const handleSave = useCallback(async () => {
    if (!usernameInput.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم مستخدم صالح");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setGhostUsername(usernameInput.trim());
    await setGhostBio(bioInput.trim());
    await setAvatarEmoji(selectedEmoji);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [usernameInput, bioInput, selectedEmoji, setGhostUsername, setGhostBio, setAvatarEmoji]);

  const handleToggleGhostMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await setIsGhostMode(!isGhostMode);
  }, [isGhostMode, setIsGhostMode]);

  const pickFromGallery = useCallback(async () => {
    setShowPhotoPicker(false);
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("إذن مطلوب", "يحتاج التطبيق إذن الوصول إلى معرض الصور");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("خطأ", "تعذّر اختيار الصورة");
    }
  }, [setAvatarUri]);

  const pickFromCamera = useCallback(async () => {
    setShowPhotoPicker(false);
    if (Platform.OS === "web") {
      Alert.alert("غير مدعوم", "الكاميرا غير متاحة على الويب");
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("إذن مطلوب", "يحتاج التطبيق إذن الوصول إلى الكاميرا");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("خطأ", "تعذّر فتح الكاميرا");
    }
  }, [setAvatarUri]);

  const removePhoto = useCallback(async () => {
    setShowPhotoPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setAvatarUri(null);
  }, [setAvatarUri]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A0008", "#0D0D0D", "#111111"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, saved && styles.saveHeaderBtnDone]}
          onPress={handleSave}
        >
          <Text style={styles.saveHeaderBtnText}>{saved ? "✓ تم" : "حفظ"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPhotoPicker(true); }}
            activeOpacity={0.85}
          >
            <ShieldPulse active={isGhostMode} />
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={isGhostMode ? [COLORS.orange, "#D35400"] : ["#2A2A2A", "#1A1A1A"]}
                style={styles.avatarCircle}
              >
                <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
            {isGhostMode && (
              <View style={styles.shieldBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.editPhotoHint}>اضغط لتغيير الصورة</Text>
          <Text style={styles.peepHandle}>{peepHandle}</Text>
          <Text style={styles.userId} numberOfLines={1} ellipsizeMode="middle">
            ID: {userId}
          </Text>
        </View>

        {!avatarUri && (
          <View style={styles.emojiSection}>
            <Text style={styles.emojiSectionTitle}>أو اختر رمزاً</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarPresets}
            >
              {AVATAR_PRESETS.map((av) => (
                <TouchableOpacity
                  key={av.emoji}
                  style={[styles.avatarPreset, selectedEmoji === av.emoji && styles.avatarPresetActive]}
                  onPress={() => { setSelectedEmoji(av.emoji); Haptics.selectionAsync(); }}
                >
                  <Text style={styles.avatarPresetEmoji}>{av.emoji}</Text>
                  <Text style={styles.avatarPresetLabel}>{av.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>اسم المستخدم العالمي (@)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputAt}>@</Text>
            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="اختر اسم الشبح الخاص بك"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text style={styles.inputCount}>{usernameInput.length}/30</Text>
          </View>
          <Text style={styles.inputHint}>
            هذا هو الاسم الوحيد الذي سيظهر في Peep والدردشة. رقم هاتفك غير مرتبط أبداً.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>نبذة شخصية (اختياري)</Text>
          <TextInput
            style={styles.bioInput}
            value={bioInput}
            onChangeText={setBioInput}
            placeholder="اكتب نبذة مختصرة عنك..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.inputCount}>{bioInput.length}/200</Text>
        </View>

        <TouchableOpacity
          style={[styles.ghostToggle, isGhostMode && styles.ghostToggleActive]}
          onPress={handleToggleGhostMode}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isGhostMode ? ["#1A0D04", "#0D0804"] : ["#1A1A1A", "#111111"]}
            style={styles.ghostToggleInner}
          >
            <MaterialCommunityIcons
              name={isGhostMode ? "ghost" : "ghost-off"}
              size={32}
              color={isGhostMode ? COLORS.orange : "#555"}
            />
            <View style={styles.ghostToggleText}>
              <Text style={[styles.ghostToggleTitle, { color: isGhostMode ? COLORS.white : "#666" }]}>
                {isGhostMode ? "🛡️ بروتوكول الشبح نشط" : "⚠️ تحذير: الهوية مكشوفة"}
              </Text>
              <Text style={styles.ghostToggleSub}>
                {isGhostMode
                  ? "رقم هاتفك مخفي تماماً · كل تواصلك مجهول"
                  : "اضغط لتفعيل بروتوكول الخصوصية"}
              </Text>
            </View>
            <View style={[styles.toggleSwitch, isGhostMode && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, isGhostMode && styles.toggleThumbOn]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>درع الهوية</Text>
        <View style={styles.shieldsList}>
          {IDENTITY_SHIELDS.map((shield, i) => (
            <View key={shield.label} style={[styles.shieldRow, i > 0 && styles.shieldRowBorder]}>
              <View style={[styles.shieldIcon, { backgroundColor: isGhostMode ? COLORS.orangeDim : "#1A1A1A" }]}>
                <Ionicons
                  name={shield.icon as any}
                  size={18}
                  color={isGhostMode ? COLORS.orange : "#555"}
                />
              </View>
              <View style={styles.shieldInfo}>
                <Text style={styles.shieldLabel}>{shield.label}</Text>
                <Text style={[styles.shieldStatus, { color: isGhostMode ? COLORS.success : COLORS.danger }]}>
                  {isGhostMode ? shield.status : "مكشوف"}
                </Text>
              </View>
              <Ionicons
                name={isGhostMode ? "lock-closed" : "lock-open-outline"}
                size={16}
                color={isGhostMode ? COLORS.success : COLORS.danger}
              />
            </View>
          ))}
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.privacyNoteText}>
            NEXUS لا يخزن أي بيانات شخصية على خوادمنا. هويتك مبنية على مفتاح تشفير محلي فقط.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={saved ? [COLORS.success, "#1E8449"] : [COLORS.orange, "#D35400"]}
            style={styles.saveBtnInner}
          >
            <Ionicons name={saved ? "checkmark-circle" : "shield-checkmark-outline"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>
              {saved ? "تم تفعيل الهوية بنجاح ✓" : "تفعيل الهوية في NEXUS"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <PhotoPickerSheet
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onPickGallery={pickFromGallery}
        onPickCamera={pickFromCamera}
        onRemove={removePhoto}
        hasPhoto={!!avatarUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0008" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.white },
  saveHeaderBtn: {
    backgroundColor: COLORS.orangeDim,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  saveHeaderBtnDone: { backgroundColor: "rgba(39,174,96,0.15)", borderColor: COLORS.success },
  saveHeaderBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.orange },
  scroll: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatarWrapper: { position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  shieldGlow: { position: "absolute", width: 104, height: 104, borderRadius: 52 },
  avatarCircle: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: COLORS.orange },
  avatarEmoji: { fontSize: 40 },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A0008",
    zIndex: 2,
  },
  shieldBadge: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#27AE60",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A0008",
    zIndex: 2,
  },
  editPhotoHint: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  peepHandle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.white, letterSpacing: -0.3 },
  userId: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 4, maxWidth: width - 80 },
  emojiSection: { marginBottom: 12 },
  emojiSectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginBottom: 8 },
  avatarPresets: { gap: 10, paddingBottom: 20, paddingHorizontal: 4 },
  avatarPreset: {
    alignItems: "center",
    gap: 4,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    minWidth: 64,
  },
  avatarPresetActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeDim },
  avatarPresetEmoji: { fontSize: 24 },
  avatarPresetLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textSecondary },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.orange, marginBottom: 10, textAlign: "right" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 6,
  },
  inputAt: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.orange },
  input: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: COLORS.white,
    paddingVertical: 14,
    textAlign: "right",
  },
  inputCount: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 4 },
  inputHint: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 8, textAlign: "right", lineHeight: 18 },
  bioInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.white,
    minHeight: 100,
    textAlign: "right",
  },
  ghostToggle: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  ghostToggleActive: { borderColor: "rgba(230,126,34,0.4)" },
  ghostToggleInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  ghostToggleText: { flex: 1 },
  ghostToggleTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, textAlign: "right" },
  ghostToggleSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 3, textAlign: "right" },
  toggleSwitch: { width: 46, height: 26, borderRadius: 13, backgroundColor: "#2A2A2A", justifyContent: "center", padding: 3 },
  toggleSwitchOn: { backgroundColor: COLORS.orange },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#555" },
  toggleThumbOn: { transform: [{ translateX: 20 }], backgroundColor: "#fff" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white, marginBottom: 12, textAlign: "right" },
  shieldsList: { backgroundColor: "#1A1A1A", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 20 },
  shieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  shieldRowBorder: { borderTopWidth: 1, borderTopColor: "#222" },
  shieldIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shieldInfo: { flex: 1 },
  shieldLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.white, textAlign: "right" },
  shieldStatus: { fontFamily: "Poppins_500Medium", fontSize: 11, marginTop: 2, textAlign: "right" },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 20 },
  privacyNoteText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, lineHeight: 17, textAlign: "right" },
  saveBtn: { borderRadius: 18, overflow: "hidden", shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  saveBtnDone: { shadowColor: COLORS.success },
  saveBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#1A1A1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20 },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 16 },
  pickerTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.white, textAlign: "center", marginBottom: 20 },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  pickerOptionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pickerOptionText: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
  pickerCancel: { paddingVertical: 16, alignItems: "center", marginTop: 4 },
  pickerCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.textMuted },
});
