import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../utils/theme';
import { useAppSelector } from '../store/store';

interface StatusBarProps {
  projectId: string;
  activeFileId?: string;
}

export default function StatusBar({ projectId, activeFileId }: StatusBarProps): React.JSX.Element {
  const isOnline = useAppSelector((s) => s.ui.isOnline);
  const pendingChanges = useAppSelector((s) => s.editor.pendingChanges);

  return (
    <View style={styles.container}>
      <Text style={styles.item} numberOfLines={1}>
        📁 {projectId.slice(0, 8)}
      </Text>
      {activeFileId && (
        <Text style={styles.item} numberOfLines={1}>
          📄 {activeFileId.slice(0, 8)}
        </Text>
      )}
      <View style={styles.spacer} />
      {pendingChanges > 0 && (
        <Text style={[styles.item, styles.dirty]}>● {pendingChanges} unsaved</Text>
      )}
      <View style={[styles.dot, { backgroundColor: isOnline ? THEME.colors.success : THEME.colors.error }]} />
      <Text style={styles.item}>{isOnline ? 'Online' : 'Offline'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  item: { fontSize: 11, color: THEME.colors.textMuted, marginRight: THEME.spacing.sm },
  spacer: { flex: 1 },
  dirty: { color: THEME.colors.warning },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
});
