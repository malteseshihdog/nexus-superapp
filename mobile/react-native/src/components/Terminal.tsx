import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, ScrollView, TextInput, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME } from '../utils/theme';

export interface TerminalHandle {
  write: (text: string) => void;
  clear: () => void;
}

interface TerminalProps {
  onCommand?: (cmd: string) => void;
}

interface Line {
  id: number;
  type: 'input' | 'output' | 'error';
  text: string;
}

let lineId = 0;

const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal({ onCommand }, ref) {
  const [lines, setLines] = React.useState<Line[]>([]);
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => ({
    write(text: string) {
      setLines((prev) => [...prev, { id: ++lineId, type: 'output', text }]);
      scrollRef.current?.scrollToEnd({ animated: true });
    },
    clear() {
      setLines([]);
    },
  }));

  const submit = () => {
    if (!input.trim()) return;
    setLines((prev) => [...prev, { id: ++lineId, type: 'input', text: `$ ${input.trim()}` }]);
    onCommand?.(input.trim());
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollRef} style={styles.scroll}>
        {lines.map((line) => (
          <Text
            key={line.id}
            style={[
              styles.line,
              line.type === 'input' && styles.inputLine,
              line.type === 'error' && styles.errorLine,
            ]}
          >
            {line.text}
          </Text>
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
});

export default Terminal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flex: 1, padding: THEME.spacing.sm },
  line: { fontFamily: 'monospace', fontSize: 13, color: '#CCCCCC', lineHeight: 20 },
  inputLine: { color: THEME.colors.primary },
  errorLine: { color: THEME.colors.error },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  prompt: { color: THEME.colors.primary, fontFamily: 'monospace', fontSize: 14, marginRight: 6 },
  input: { flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#CCCCCC', padding: 0 },
});
