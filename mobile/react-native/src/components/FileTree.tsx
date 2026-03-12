import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { fileEndpoints } from '../../../shared/src/api/endpoints';
import { THEME } from '../utils/theme';
import type { FileTreeNode } from '../../../shared/src/types/file.types';

interface FileTreeProps {
  projectId: string;
  onFileSelect: (fileId: string, path: string) => void;
}

export default function FileTree({ projectId, onFileSelect }: FileTreeProps): React.JSX.Element {
  const [nodes, setNodes] = useState<FileTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fileEndpoints.listFiles(projectId);
        // Convert flat file list to tree nodes
        const tree: FileTreeNode[] = res.data.map((f) => ({
          id: f.id,
          name: f.name,
          path: f.path,
          isDirectory: f.isDirectory,
          children: [],
        }));
        setNodes(tree);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [projectId]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: FileTreeNode, depth = 0): React.JSX.Element => (
    <View key={node.id}>
      <TouchableOpacity
        style={[styles.node, { paddingLeft: THEME.spacing.md + depth * 16 }]}
        onPress={() => {
          if (node.isDirectory) toggle(node.id);
          else onFileSelect(node.id, node.path);
        }}
      >
        <Text style={styles.icon}>{node.isDirectory ? (expanded.has(node.id) ? '📂' : '📁') : '📄'}</Text>
        <Text style={[styles.name, !node.isDirectory && styles.fileName]} numberOfLines={1}>
          {node.name}
        </Text>
      </TouchableOpacity>
      {node.isDirectory && expanded.has(node.id) && node.children?.map((child) => renderNode(child, depth + 1))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={THEME.colors.primary} size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={nodes}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => renderNode(item)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, backgroundColor: THEME.colors.surface, borderRightWidth: 1, borderRightColor: THEME.colors.border },
  loading: { width: 220, justifyContent: 'center', alignItems: 'center', padding: THEME.spacing.lg },
  node: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  icon: { fontSize: 14, marginRight: 6 },
  name: { fontSize: 13, color: THEME.colors.textSecondary, flex: 1 },
  fileName: { color: THEME.colors.textPrimary },
});
