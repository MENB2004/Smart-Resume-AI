import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { theme } from '../utils/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';

export const ForgotPassword = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
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
  header: {
    marginBottom: theme.spacing(4),
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
