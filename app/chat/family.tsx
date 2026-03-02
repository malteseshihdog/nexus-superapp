import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { Dimensions } from "react-native";

const SCREEN_W = Dimensions.get("window").width;

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  initials: string;
  color: string;
  isOnline: boolean;
  lastSeen?: string;
}

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "fm1", name: "Mom",     relation: "Mother",      initials: "MA", color: "#E67E22", isOnline: true },
  { id: "fm2", name: "Dad",     relation: "Father",      initials: "DA", color: "#2980B9", isOnline: true },
  { id: "fm3", name: "Sara",    relation: "Sister",      initials: "SA", color: "#8E44AD", isOnline: false, lastSeen: "1h ago" },
  { id: "fm4", name: "Grandma", relation: "Grandmother", initials: "GM", color: "#27AE60", isOnline: true },
  { id: "fm5", name: "Omar",    relation: "Brother",     initials: "OM", color: "#E74C3C", isOnline: false, lastSeen: "3h ago" },
  { id: "fm6", name: "Aunt Lila", relation: "Aunt",     initials: "AL", color: "#F39C12", isOnline: true },
];

const FAMILY_ROOM_ID = "nexus_family_room_001";

function FamilyMemberCard({ member, onCall }: { member: FamilyMember; onCall: (m: FamilyMember) => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onCall(member)}
      activeOpacity={0.85}
      testID={`family-card-${member.id}`}
    >
      <View style={[styles.cardAvatar, { backgroundColor: member.color }]}>
        <Text style={styles.cardInitials}>{member.initials}</Text>
        <View style={[styles.cardOnlineDot, { backgroundColor: member.isOnline ? "#27AE60" : "#555" }]} />
      </View>
      <Text style={styles.cardName}>{member.name}</Text>
      <Text style={styles.cardRelation}>{member.relation}</Text>
      <Text style={styles.cardStatus}>{member.isOnline ? "Online now" : member.lastSeen ?? "Offline"}</Text>
      <TouchableOpacity
        style={styles.callBtn}
        onPress={() => onCall(member)}
        activeOpacity={0.85}
        testID={`call-btn-${member.id}`}
      >
        <Ionicons name="call" size={22} color="#fff" />
        <Text style={styles.callBtnText}>Call</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [callingAll, setCallingAll] = useState(false);

  function handleCallMember(member: FamilyMember) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: "/chat/group-call",
      params: {
        roomName: `Call with ${member.name}`,
        roomId: `family_${member.id}_${Date.now()}`,
        callType: "audio",
        isFamily: "1",
      },
    });
  }

  function handleCallEveryone() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCallingAll(true);
    setTimeout(() => {
      setCallingAll(false);
      router.push({
        pathname: "/chat/group-call",
        params: {
          roomName: "Family Group Call",
          roomId: FAMILY_ROOM_ID,
          callType: "audio",
          isFamily: "1",
        },
      });
    }, 800);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Family Hub</Text>
          <Text style={styles.headerSubtitle}>One tap to connect</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.onlineBanner}>
        <Ionicons name="people" size={16} color={COLORS.orange} />
        <Text style={styles.onlineBannerText}>
          {FAMILY_MEMBERS.filter((m) => m.isOnline).length} family members online
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: botPad + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {FAMILY_MEMBERS.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            onCall={handleCallMember}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: botPad + 20 }]}>
        <TouchableOpacity
          style={[styles.callEveryoneBtn, callingAll && styles.callEveryoneBtnActive]}
          onPress={handleCallEveryone}
          activeOpacity={0.85}
          testID="call-everyone-btn"
        >
          {callingAll ? (
            <Ionicons name="radio-outline" size={28} color="#fff" />
          ) : (
            <Ionicons name="people" size={28} color="#fff" />
          )}
          <Text style={styles.callEveryoneBtnText}>
            {callingAll ? "Calling everyone…" : "Call the Whole Family"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Large text · Simple controls · No sign-in needed
        </Text>
      </View>
    </View>
  );
}

const CARD_WIDTH = (SCREEN_W - 48) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center", gap: 2 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 24, color: "#fff" },
  headerSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "rgba(255,255,255,0.45)" },

  onlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(230,126,34,0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,126,34,0.15)",
  },
  onlineBannerText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "rgba(255,255,255,0.75)" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  cardAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardInitials: { fontFamily: "Poppins_700Bold", fontSize: 30, color: "#fff" },
  cardOnlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#0D0D1A",
  },
  cardName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#fff", marginTop: 4 },
  cardRelation: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "rgba(255,255,255,0.5)" },
  cardStatus: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.35)" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#27AE60",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 6,
    width: "100%",
    justifyContent: "center",
  },
  callBtnText: { fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(13,13,26,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    gap: 10,
    alignItems: "center",
  },
  callEveryoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    justifyContent: "center",
    shadowColor: "#E74C3C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  callEveryoneBtnActive: { backgroundColor: "#C0392B" },
  callEveryoneBtnText: { fontFamily: "Poppins_700Bold", fontSize: 19, color: "#fff" },
  footerNote: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" },
});
