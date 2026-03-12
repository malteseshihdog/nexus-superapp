import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setTheme, setFontSize } from '../store/uiSlice';
import { logout } from '../store/authSlice';
import { THEME } from '../utils/theme';

export default function SettingsScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { theme, fontSize } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user?.username ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={(v) => dispatch(setTheme(v ? 'dark' : 'light'))}
            trackColor={{ true: THEME.colors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Font Size</Text>
          <View style={styles.fontRow}>
            {([12, 14, 16, 18] as const).map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.fontBtn, fontSize === size && styles.fontBtnActive]}
                onPress={() => dispatch(setFontSize(size))}
              >
                <Text style={[styles.fontBtnText, fontSize === size && styles.fontBtnTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  section: {
    margin: THEME.spacing.md,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  label: { fontSize: 15, color: THEME.colors.textPrimary },
  value: { fontSize: 15, color: THEME.colors.textSecondary },
  fontRow: { flexDirection: 'row', gap: 8 },
  fontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surface,
  },
  fontBtnActive: { backgroundColor: THEME.colors.primary },
  fontBtnText: { color: THEME.colors.textSecondary, fontSize: 13 },
  fontBtnTextActive: { color: THEME.colors.textPrimary, fontWeight: '600' },
  logoutBtn: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, color: THEME.colors.error, fontWeight: '600' },
});
