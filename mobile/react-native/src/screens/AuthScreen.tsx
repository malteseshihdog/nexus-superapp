import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { THEME } from '../utils/theme';

export default function AuthScreen(): React.JSX.Element {
  const { login, register, isLoading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    if (mode === 'login') {
      await login({ email, password });
    } else {
      await register({ email, password, username, displayName });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>NEXUS IDE</Text>
        <Text style={styles.subtitle}>Cloud Development Platform</Text>

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={THEME.colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={THEME.colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={THEME.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={THEME.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={THEME.colors.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: THEME.spacing.xl },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    marginBottom: THEME.spacing.md,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  buttonText: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  error: { color: THEME.colors.error, fontSize: 13, marginBottom: THEME.spacing.sm },
  switchText: { color: THEME.colors.textSecondary, textAlign: 'center', fontSize: 14 },
});
