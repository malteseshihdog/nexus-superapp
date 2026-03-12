import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../utils/theme';

export interface Tab {
  id: string;
  label: string;
  isDirty?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onToggleTree?: () => void;
}

export default function Tabs({ tabs, activeId, onSelect, onClose, onToggleTree }: TabsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {onToggleTree && (
        <TouchableOpacity style={styles.treeToggle} onPress={onToggleTree}>
          <Text style={styles.treeIcon}>☰</Text>
        </TouchableOpacity>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, tab.id === activeId && styles.activeTab]}
            onPress={() => onSelect(tab.id)}
          >
            <Text
              style={[styles.label, tab.id === activeId && styles.activeLabel]}
              numberOfLines={1}
            >
              {tab.isDirty ? `● ${tab.label}` : tab.label}
            </Text>
            <TouchableOpacity style={styles.close} onPress={() => onClose(tab.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    height: 40,
    alignItems: 'center',
  },
  treeToggle: { paddingHorizontal: THEME.spacing.md, height: '100%', justifyContent: 'center' },
  treeIcon: { fontSize: 18, color: THEME.colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  activeTab: { backgroundColor: THEME.colors.card, borderBottomWidth: 2, borderBottomColor: THEME.colors.primary },
  label: { fontSize: 13, color: THEME.colors.textSecondary, maxWidth: 120 },
  activeLabel: { color: THEME.colors.textPrimary },
  close: { marginLeft: 6 },
  closeIcon: { fontSize: 16, color: THEME.colors.textMuted, lineHeight: 18 },
});
