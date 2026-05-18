import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../utils/theme';

export const Splash = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartResume <Text style={styles.accent}>AI</Text></Text>
      <Text style={styles.subtitle}>ATS Friendly Resume Builder</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  accent: {
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  loader: {
    marginTop: theme.spacing(6),
  },
});
