import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";

const COUNTRY_CODES = [
  { flag: "🇮🇶", code: "+964", name: "العراق" },
  { flag: "🇸🇦", code: "+966", name: "السعودية" },
  { flag: "🇦🇪", code: "+971", name: "الإمارات" },
  { flag: "🇸🇾", code: "+963", name: "سوريا" },
  { flag: "🇯🇴", code: "+962", name: "الأردن" },
  { flag: "🇱🇧", code: "+961", name: "لبنان" },
  { flag: "🇪🇬", code: "+20", name: "مصر" },
  { flag: "🇲🇦", code: "+212", name: "المغرب" },
  { flag: "🇩🇿", code: "+213", name: "الجزائر" },
  { flag: "🇹🇳", code: "+216", name: "تونس" },
  { flag: "🇹🇷", code: "+90", name: "تركيا" },
  { flag: "🇵🇰", code: "+92", name: "باكستان" },
  { flag: "🇮🇳", code: "+91", name: "الهند" },
  { flag: "🇺🇸", code: "+1", name: "أمريكا" },
  { flag: "🇬🇧", code: "+44", name: "بريطانيا" },
  { flag: "🇩🇪", code: "+49", name: "ألمانيا" },
  { flag: "🇫🇷", code: "+33", name: "فرنسا" },
];

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp } = usePhoneAuth();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [name, setName] = useState("");

  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = `${selectedCountry.code}${cleanPhone}`;
  const isValid = cleanPhone.length >= 7;

  async function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    const { error, devCode } = await sendOtp(fullPhone);
    setLoading(false);

    if (error) {
      Alert.alert("خطأ", error);
      return;
    }

    router.push({
      pathname: "/auth/otp",
      params: {
        phone: fullPhone,
        displayPhone: `${selectedCountry.flag} ${selectedCountry.code} ${phone}`,
        name: name.trim(),
        ...(devCode ? { devCode } : {}),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.appName}>NEXUS</Text>
          <Text style={styles.tagline}>مرحباً بك في مستقبل التواصل</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>أدخل رقم هاتفك</Text>
          <Text style={styles.cardSub}>سنرسل لك كود تفعيل قصير</Text>

          <Text style={styles.label}>الاسم (اختياري)</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="اسمك في NEXUS"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.phoneInput}
              placeholder="7XXXXXXXX"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              maxLength={12}
            />
          </View>

          {showCountryPicker && (
            <View style={styles.pickerList}>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {COUNTRY_CODES.map((c) => (
                  <TouchableOpacity
                    key={c.code + c.name}
                    style={[styles.pickerItem, selectedCountry.code === c.code && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedCountry(c);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.pickerFlag}>{c.flag}</Text>
                    <Text style={styles.pickerName}>{c.name}</Text>
                    <Text style={styles.pickerCode}>{c.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.fullPhone}>
            {isValid ? `سيُرسل الكود إلى: ${fullPhone}` : " "}
          </Text>

          <TouchableOpacity
            style={[styles.sendBtn, (!isValid || loading) && styles.sendBtnDisabled]}
            onPress={handleSendOtp}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.sendBtnText}>إرسال كود التفعيل</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          بالمتابعة، توافق على{" "}
          <Text style={styles.termsLink}>شروط الخدمة</Text>
          {" "}و{" "}
          <Text style={styles.termsLink}>سياسة الخصوصية</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },

  logoWrap: { alignItems: "center", marginBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    shadowColor: COLORS.orange, shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  logoText: { fontFamily: "Poppins_700Bold", fontSize: 32, color: "#fff" },
  appName: { fontFamily: "Poppins_700Bold", fontSize: 28, color: COLORS.white, letterSpacing: 6 },
  tagline: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 20, color: COLORS.white, marginBottom: 4 },
  cardSub: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },

  label: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },

  nameInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },

  phoneRow: { flexDirection: "row", gap: 10, marginBottom: 8 },

  countryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#1A1A1A",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  countryFlag: { fontSize: 18 },
  countryCode: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.white },

  phoneInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.white,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 12,
  },

  pickerList: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  pickerItemActive: { backgroundColor: COLORS.orangeDim },
  pickerFlag: { fontSize: 20 },
  pickerName: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.white },
  pickerCode: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },

  fullPhone: {
    fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.orange,
    marginBottom: 20, textAlign: "center", minHeight: 18,
  },

  sendBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: COLORS.orange, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  sendBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },

  terms: {
    fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted,
    textAlign: "center", marginTop: 24, lineHeight: 20,
  },
  termsLink: { color: COLORS.orange },
});
