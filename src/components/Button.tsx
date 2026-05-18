import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const content = (
    <>
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary} />
      ) : (
        <Text
          style={[
            styles.baseText,
            variant === 'primary' && styles.solidText,
            variant === 'outline' && styles.outlineText,
            variant === 'text' && styles.textVariantText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[style, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.primaryGradient]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'outline' && styles.outline,
        variant === 'text' && styles.textVariant,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  base: {
    paddingVertical: theme.spacing(1.8),
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  baseText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '600',
    fontFamily: theme.typography.fonts.semiBold,
  },
  solidText: {
    color: '#FFFFFF', // explicitly white so it always contrasts primary
  },
  outlineText: {
    color: theme.colors.primary,
  },
  textVariantText: {
    color: theme.colors.primary,
  },
  primaryGradient: {
    ...theme.shadows.soft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.textSecondary,
  },
});
