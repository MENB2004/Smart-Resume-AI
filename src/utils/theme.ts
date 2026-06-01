import { Platform } from 'react-native';

export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  secondary: '#64748B',
  secondaryDark: '#475569',
  accent: '#A5B4FC',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  glassmorphism: 'rgba(255, 255, 255, 0.7)',
};

export const darkColors = {
  background: 'transparent',   // LinearGradient in App.tsx shows through
  surface: '#07152B',          // deep navy blue cards
  primary: '#6366F1',          // vibrant indigo
  primaryDark: '#4F46E5',
  secondary: '#7B9FC7',
  secondaryDark: '#5A7FA8',
  accent: '#818CF8',
  text: '#EEF2FF',             // blue-white text
  textSecondary: '#7FA8D0',    // blue-tinted secondary
  border: '#1A3258',           // blue-tinted border
  error: '#F87171',
  success: '#34D399',
  glassmorphism: 'rgba(7, 21, 43, 0.85)',
};

// Gradient arrays for dark/light modes — used in App.tsx ThemedApp
export const darkGradient = ['#020B18', '#04112A', '#020D20'] as const;
export const lightGradient = [lightColors.background, lightColors.background] as const;

export const typography = {
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,
  },
};

export const spacing = (factor: number) => factor * 8;

export const borderRadius = {
  small: 6,
  medium: 12,
  large: 20,
  round: 9999,
};

export const shadows = {
  soft: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(10, 37, 80, 0.25)',
    },
    default: {
      shadowColor: '#0A2550',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
  }) as any,
  medium: Platform.select({
    web: {
      boxShadow: '0px 8px 16px rgba(10, 37, 80, 0.35)',
    },
    default: {
      shadowColor: '#0A2550',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  }) as any,
};

// Backward-compat default export
export const theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
