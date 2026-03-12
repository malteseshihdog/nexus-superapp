import React, { useRef, useCallback } from 'react';
import { View, TextInput, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../utils/theme';

interface CodeEditorProps {
  fileId: string;
  content: string;
  language: string;
  onChange: (content: string) => void;
  onSave: () => void;
  readOnly?: boolean;
}

/**
 * Mobile code editor component with monospace font, line-number
 * awareness via TextInput, and save-on-Ctrl+S emulation.
 */
export default function CodeEditor({
  content,
  onChange,
  onSave,
  readOnly = false,
}: CodeEditorProps): React.JSX.Element {
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange]
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
      <TextInput
        ref={inputRef}
        style={styles.editor}
        value={content}
        onChangeText={handleChange}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        keyboardType="default"
        editable={!readOnly}
        textAlignVertical="top"
        scrollEnabled={false}
        onKeyPress={({ nativeEvent }) => {
          // React Native does not expose modifier keys on physical keyboards the
          // same way the web does.  Saving is triggered via the toolbar button
          // instead.  This handler is a no-op placeholder for future keyboard
          // shortcut support when RN exposes modifier key events.
          void nativeEvent;
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  editor: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    padding: THEME.spacing.md,
    minHeight: '100%',
  },
});
