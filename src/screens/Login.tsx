import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { theme } from '../utils/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';

export const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSignUp ? 'Join ' : 'Welcome to '}
            <Text style={styles.accent}>SmartResume AI</Text>
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create an account to start building.' : 'Sign in to access your resumes.'}
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
          <Input
            label="Password"
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isSignUp && (
            <Button
              title="Forgot Password?"
              onPress={() => navigation.navigate('ForgotPassword')}
              variant="text"
              style={styles.forgotPassword}
            />
          )}

          <Button
            title={isSignUp ? 'Sign Up' : 'Log In'}
            onPress={handleAuth}
            isLoading={loading}
            style={styles.mainButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <Button
            title={isSignUp ? 'Log In' : 'Sign Up'}
            onPress={() => setIsSignUp(!isSignUp)}
            variant="text"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing(3),
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing(5),
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
  form: {
    marginBottom: theme.spacing(4),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  mainButton: {
    marginTop: theme.spacing(2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body,
  },
});
