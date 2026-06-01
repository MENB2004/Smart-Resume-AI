import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
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
  const [hovered, setHovered] = useState(false);
  const styles = getStyles(theme);

  // Web hover handlers
  const hoverProps =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        }
      : {};

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
        style={[
          style,
          disabled && styles.disabled,
          hovered && styles.hoveredWrapper,
        ]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        {...(hoverProps as any)}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.primaryGradient, Platform.OS === 'web' ? styles.webCursor : null]}
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
        hovered && variant !== 'text' && styles.hovered,
        Platform.OS === 'web' ? styles.webCursor : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...(hoverProps as any)}
    >
      {content}
    </TouchableOpacity>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
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
      color: '#FFFFFF',
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
    webCursor: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
    hovered: {
      opacity: 0.85,
    },
    hoveredWrapper: {
      opacity: 0.9,
    },
  });
