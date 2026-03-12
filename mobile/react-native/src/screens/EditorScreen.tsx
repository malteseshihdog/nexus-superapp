import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CodeEditor from '../components/CodeEditor';
import FileTree from '../components/FileTree';
import Tabs from '../components/Tabs';
import StatusBar from '../components/StatusBar';
import { useEditor } from '../hooks/useEditor';
import { THEME } from '../utils/theme';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Editor'>;

export default function EditorScreen({ route }: Props): React.JSX.Element {
  const { projectId } = route.params;
  const { openFiles, activeFileId, openFile, closeFile, setActiveFile, saveFile, getFileContent, updateContent } =
    useEditor(projectId);
  const [showFileTree, setShowFileTree] = useState(true);

  const handleFileSelect = useCallback(
    (fileId: string, filePath: string) => {
      openFile(fileId, filePath);
      setShowFileTree(false);
    },
    [openFile]
  );

  return (
    <View style={styles.container}>
      <Tabs
        tabs={openFiles}
        activeId={activeFileId}
        onSelect={setActiveFile}
        onClose={closeFile}
        onToggleTree={() => setShowFileTree((v) => !v)}
      />

      <View style={styles.body}>
        {showFileTree && (
          <FileTree projectId={projectId} onFileSelect={handleFileSelect} />
        )}

        <View style={styles.editorArea}>
          {activeFileId && (
            <CodeEditor
              fileId={activeFileId}
              content={getFileContent(activeFileId)}
              language="typescript"
              onChange={(content) => updateContent(activeFileId, content)}
              onSave={() => saveFile(activeFileId)}
            />
          )}
        </View>
      </View>

      <StatusBar projectId={projectId} activeFileId={activeFileId ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  body: { flex: 1, flexDirection: 'row' },
  editorArea: { flex: 1 },
});
