import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  label: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(1),
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing(1.5),
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.regular,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(43, 108, 176, 0.05)',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.small,
    marginTop: theme.spacing(0.5),
  },
});
