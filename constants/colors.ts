export const COLORS = {
  background: '#111111',
  surface: '#1A1A1A',
  card: '#222222',
  cardAlt: '#2A2A2A',
  orange: '#E67E22',
  orangeBright: '#F39C12',
  orangeDim: 'rgba(230, 126, 34, 0.15)',
  orangeGlow: 'rgba(230, 126, 34, 0.08)',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9A9A',
  textMuted: '#4A4A4A',
  border: '#1E1E1E',
  borderLight: '#2E2E2E',
  success: '#27AE60',
  danger: '#E74C3C',
  blue: '#2980B9',
  crypto: {
    btc: '#F7931A',
    eth: '#627EEA',
    bnb: '#F3BA2F',
    sol: '#9945FF',
    ada: '#0D1E41',
    dot: '#E6007A',
  }
};

export default {
  light: {
    text: COLORS.textPrimary,
    background: COLORS.background,
    tint: COLORS.orange,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.orange,
  },
};
