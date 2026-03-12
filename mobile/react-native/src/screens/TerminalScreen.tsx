import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { THEME } from '../utils/theme';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Terminal'>;

interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  text: string;
}

export default function TerminalScreen({ route }: Props): React.JSX.Element {
  const { projectId } = route.params;
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', text: `Connected to project: ${projectId}` },
    { type: 'output', text: 'Type a command below...' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const cmd = input.trim();
    setHistory((prev) => [...prev, { type: 'input', text: `$ ${cmd}` }]);
    setInput('');

    // Simulate async command execution
    setTimeout(() => {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: `Executed: ${cmd}` },
      ]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.output}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {history.map((entry, i) => (
          <Text
            key={i}
            style={[
              styles.line,
              entry.type === 'input' && styles.inputLine,
              entry.type === 'error' && styles.errorLine,
            ]}
          >
            {entry.text}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholderTextColor={THEME.colors.textMuted}
          placeholder="Enter command..."
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  output: { flex: 1, padding: THEME.spacing.sm },
  line: { fontFamily: 'monospace', fontSize: 13, color: '#CCCCCC', lineHeight: 20 },
  inputLine: { color: THEME.colors.primary },
  errorLine: { color: THEME.colors.error },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  prompt: { color: THEME.colors.primary, fontFamily: 'monospace', fontSize: 14, marginRight: 6 },
  input: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#CCCCCC',
    padding: 0,
  },
});
