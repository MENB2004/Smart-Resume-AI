import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import { useResponsive } from '../utils/responsive';

export const ForgotPassword = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { isWeb, isDesktop } = useResponsive();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert('Success', 'Check your email for the password reset link');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          isLoading={loading}
          style={styles.mainButton}
        />

        <Button
          title="Back to Login"
          onPress={() => navigation.goBack()}
          variant="text"
          style={styles.backButton}
        />
      </View>
    </View>
  );

  // Web desktop: gradient background with centered card
  if (isWeb && isDesktop) {
    return (
      <LinearGradient
        colors={['#0A0A14', '#10102A', '#0F1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.webBackground}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <ScrollView
          contentContainerStyle={styles.webScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {formContent}
        </ScrollView>
      </LinearGradient>
    );
  }

  // Mobile
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>{formContent}</View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing(3),
    justifyContent: 'center',
  },
  webBackground: {
    flex: 1,
    position: 'relative' as any,
    overflow: 'hidden' as any,
  },
  webScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  blob1: {
    position: 'absolute' as any,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute' as any,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.07)',
    bottom: -40,
    left: -40,
  },
  card: {
    width: '100%',
  },
  cardDesktop: {
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing(4),
    ...theme.shadows.medium,
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    marginBottom: theme.spacing(4),
  },
  mainButton: {
    marginTop: theme.spacing(2),
  },
  backButton: {
    marginTop: theme.spacing(2),
  },
});
