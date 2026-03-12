import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { THEME } from '../utils/theme';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { projectId } = route.params;

  const actions = [
    { label: 'Open Editor', icon: '✏️', screen: 'Editor' as const },
    { label: 'Terminal', icon: '>', screen: 'Terminal' as const },
    { label: 'Deployments', icon: '🚀', screen: 'Deployment' as const },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectId} numberOfLines={1}>{projectId}</Text>
      </View>

      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate(action.screen as never, { projectId } as never)
            }
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: {
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  projectId: { fontSize: 14, color: THEME.colors.textSecondary, fontFamily: 'monospace' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  actionCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionIcon: { fontSize: 28, marginBottom: THEME.spacing.sm },
  actionLabel: { fontSize: 14, color: THEME.colors.textPrimary, fontWeight: '500' },
});
