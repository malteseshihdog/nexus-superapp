import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProjects } from '../hooks/useProjects';
import { THEME } from '../utils/theme';
import type { MainStackParamList } from '../navigation/MainNavigator';
import type { Project } from '../../../shared/src/types/project.types';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectList'>;

export default function ProjectListScreen({ navigation }: Props): React.JSX.Element {
  const { projects, isLoading, refresh, createProject } = useProjects();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.meta}>
        <Text style={styles.language}>{item.language}</Text>
        <Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => createProject()}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading && projects.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={THEME.colors.primary} size="large" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={THEME.colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No projects yet. Create one!</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: THEME.colors.textPrimary },
  newButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.md,
  },
  newButtonText: { color: THEME.colors.textPrimary, fontWeight: '600' },
  list: { padding: THEME.spacing.md },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  projectName: { flex: 1, fontSize: 16, fontWeight: '600', color: THEME.colors.textPrimary, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: THEME.radius.sm },
  status_active: { backgroundColor: 'rgba(39,174,96,0.2)' },
  status_archived: { backgroundColor: 'rgba(74,74,74,0.4)' },
  status_deploying: { backgroundColor: 'rgba(41,128,185,0.2)' },
  status_error: { backgroundColor: 'rgba(231,76,60,0.2)' },
  statusText: { fontSize: 11, color: THEME.colors.textSecondary },
  description: { fontSize: 13, color: THEME.colors.textSecondary, marginBottom: THEME.spacing.sm },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  language: { fontSize: 12, color: THEME.colors.primary },
  date: { fontSize: 12, color: THEME.colors.textMuted },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: THEME.colors.textMuted, marginTop: 40 },
});
