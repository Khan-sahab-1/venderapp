import { colors } from './colors';

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    hero: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
    h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
    h3: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
    body: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
    bodyMedium: { fontSize: 14, fontWeight: '500' as const, color: colors.textPrimary },
    caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
    captionBold: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary },
  },
  shadows: {
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
