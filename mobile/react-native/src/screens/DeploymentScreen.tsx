import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { THEME } from '../utils/theme';
import type { MainStackParamList } from '../navigation/MainNavigator';
import { apiClient } from '../../../shared/src/api/client';
import { API_ENDPOINTS } from '../../../shared/src/constants/api.constants';

type Props = NativeStackScreenProps<MainStackParamList, 'Deployment'>;

interface Deployment {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  createdAt: string;
  url?: string;
  error?: string;
}

export default function DeploymentScreen({ route }: Props): React.JSX.Element {
  const { projectId } = route.params;
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  const fetchDeployments = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Deployment[]>(API_ENDPOINTS.DEPLOYMENTS.LIST(projectId));
      setDeployments(res.data);
    } catch {
      // handled via interceptor
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDeployments(); }, [projectId]);

  const deploy = async () => {
    setIsDeploying(true);
    try {
      await apiClient.post(API_ENDPOINTS.DEPLOYMENTS.CREATE(projectId));
      await fetchDeployments();
    } finally {
      setIsDeploying(false);
    }
  };

  const statusColor: Record<Deployment['status'], string> = {
    pending: THEME.colors.warning,
    running: THEME.colors.info,
    success: THEME.colors.success,
    failed: THEME.colors.error,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deployments</Text>
        <TouchableOpacity style={styles.deployBtn} onPress={deploy} disabled={isDeploying}>
          {isDeploying ? (
            <ActivityIndicator color={THEME.colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.deployBtnText}>🚀 Deploy</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={THEME.colors.primary} size="large" />
      ) : (
        <FlatList
          data={deployments}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No deployments yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.dot, { backgroundColor: statusColor[item.status] }]} />
                <Text style={styles.status}>{item.status}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {item.url && <Text style={styles.url} numberOfLines={1}>{item.url}</Text>}
              {item.error && <Text style={styles.errorText}>{item.error}</Text>}
            </View>
          )}
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
  title: { fontSize: 20, fontWeight: 'bold', color: THEME.colors.textPrimary },
  deployBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.md,
    minWidth: 90,
    alignItems: 'center',
  },
  deployBtnText: { color: THEME.colors.textPrimary, fontWeight: '600' },
  list: { padding: THEME.spacing.md },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: THEME.spacing.sm },
  status: { fontSize: 14, color: THEME.colors.textPrimary, fontWeight: '500', flex: 1 },
  date: { fontSize: 12, color: THEME.colors.textMuted },
  url: { fontSize: 12, color: THEME.colors.info, marginTop: 4 },
  errorText: { fontSize: 12, color: THEME.colors.error, marginTop: 4 },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: THEME.colors.textMuted, marginTop: 40 },
});
