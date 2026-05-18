export const lightColors = {
  background: '#F8FAFC', // Light slate
  surface: '#FFFFFF', // Pure white cards
  primary: '#4F46E5', // Premium Indigo
  primaryDark: '#3730A3', // Darker Indigo
  secondary: '#64748B', // Muted slate
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
  background: '#000000', // True Black (OLED friendly)
  surface: '#121212', // Slightly elevated dark grey for cards
  primary: '#6366F1', // Vibrant Indigo for dark mode
  primaryDark: '#4F46E5',
  secondary: '#A1A1AA', // Zinc 400
  secondaryDark: '#71717A', // Zinc 500
  accent: '#818CF8',
  text: '#FAFAFA', // Almost white
  textSecondary: '#A1A1AA',
  border: '#27272A', // Zinc 800
  error: '#F87171',
  success: '#34D399',
  glassmorphism: 'rgba(18, 18, 18, 0.7)',
};

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
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};

// We will keep a default export for backward compatibility where possible,
// but components should use useTheme() from ThemeContext going forward.
export const theme = {
  colors: darkColors, // Default to dark colors before Context takes over
  typography,
  spacing,
  borderRadius,
  shadows,
};
