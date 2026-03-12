export const THEME = {
  colors: {
    primary: '#E67E22',
    primaryDark: '#D35400',
    background: '#111111',
    surface: '#1A1A1A',
    card: '#222222',
    textPrimary: '#FFFFFF',
    textSecondary: '#9A9A9A',
    textMuted: '#4A4A4A',
    border: '#1E1E1E',
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    info: '#2980B9',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

export type Theme = typeof THEME;
