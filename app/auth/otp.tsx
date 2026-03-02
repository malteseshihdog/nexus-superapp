import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { phone, displayPhone, name, devCode } = useLocalSearchParams<{
    phone: string;
    displayPhone: string;
    name: string;
    devCode?: string;
  }>();
  const { verifyOtp, sendOtp } = usePhoneAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (devCode) {
      const digits = devCode.split("");
      setOtp(digits.slice(0, 6));
    }
  }, [devCode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function handleDigit(text: string, idx: number) {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  }

  function handleBackspace(idx: number) {
    if (otp[idx] === "" && idx > 0) {
      const next = [...otp];
      next[idx - 1] = "";
      setOtp(next);
      inputs.current[idx - 1]?.focus();
    } else {
      const next = [...otp];
      next[idx] = "";
      setOtp(next);
    }
  }

  async function verify(code?: string) {
    const finalCode = code ?? otp.join("");
    if (finalCode.length !== 6) return;
    setLoading(true);
    const { error } = await verifyOtp(phone, finalCode, name);
    setLoading(false);
    if (error) {
      Alert.alert("خطأ", error);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      return;
    }
    router.replace("/(tabs)");
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const { error, devCode: newCode } = await sendOtp(phone);
    setResending(false);
    if (error) {
      Alert.alert("خطأ", error);
      return;
    }
    setResendCooldown(60);
    setOtp(["", "", "", "", "", ""]);
    if (newCode) {
      const digits = newCode.split("");
      setOtp(digits.slice(0, 6));
    }
    inputs.current[0]?.focus();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses" size={32} color={COLORS.orange} />
          </View>
        </View>

        <Text style={styles.title}>أدخل كود التفعيل</Text>
        <Text style={styles.sub}>
          أرسلنا كوداً مكوناً من 6 أرقام إلى{"\n"}
          <Text style={styles.subPhone}>{displayPhone || phone}</Text>
        </Text>

        {devCode ? (
          <View style={styles.devBanner}>
            <Ionicons name="code-slash" size={14} color={COLORS.orange} />
            <Text style={styles.devText}>وضع التطوير — الكود: {devCode}</Text>
          </View>
        ) : null}

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(t) => handleDigit(t, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace") handleBackspace(i);
              }}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.orange} size="small" />
            <Text style={styles.loadingText}>جاري التحقق...</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, (otp.join("").length !== 6 || loading) && styles.verifyBtnDisabled]}
          onPress={() => verify()}
          disabled={otp.join("").length !== 6 || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>تأكيد ودخول NEXUS</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {resendCooldown > 0 ? (
            <Text style={styles.resendCooldown}>
              إعادة الإرسال بعد {resendCooldown}ث
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator color={COLORS.orange} size="small" />
              ) : (
                <Text style={styles.resendBtn}>إعادة إرسال الكود</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: 28, alignItems: "center" },

  backBtn: {
    alignSelf: "flex-start",
    padding: 4,
    marginBottom: 24,
  },

  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.orangeDim,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.orange + "40",
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26, color: COLORS.white,
    marginBottom: 10,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: "center", lineHeight: 22,
    marginBottom: 28,
  },
  subPhone: { color: COLORS.white, fontFamily: "Poppins_600SemiBold" },

  devBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.orangeDim,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.orange + "30",
  },
  devText: {
    fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.orange,
  },

  otpRow: {
    flexDirection: "row", gap: 10, marginBottom: 32,
  },
  otpBox: {
    width: 44, height: 56, borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2, borderColor: COLORS.border,
    textAlign: "center",
    fontFamily: "Poppins_700Bold", fontSize: 22,
    color: COLORS.white,
  },
  otpBoxFilled: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeDim,
  },

  loadingWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary,
  },

  verifyBtn: {
    width: "100%", backgroundColor: COLORS.orange,
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.orange, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    marginBottom: 20,
  },
  verifyBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  verifyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },

  resendRow: { alignItems: "center" },
  resendCooldown: {
    fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted,
  },
  resendBtn: {
    fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.orange,
  },
});
