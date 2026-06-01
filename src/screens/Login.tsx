import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import { useResponsive } from '../utils/responsive';

export const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { isWeb, isDesktop } = useResponsive();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Success', 'Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
      <View style={styles.brandingContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={[styles.logo, isDesktop && styles.logoDesktop]}
        />
        <Text style={styles.appName}>SmartResume AI</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Create an account to start building.'
            : 'Sign in to access your resumes.'}
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
          placeholder="••••••••"
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
        {/* Decorative blobs */}
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

  // Mobile / tablet: original layout
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {formContent}
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
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    top: -100,
    left: -100,
  },
  blob2: {
    position: 'absolute' as any,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    bottom: -50,
    right: -50,
  },
  card: {
    width: '100%',
  },
  cardDesktop: {
    maxWidth: 480,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing(4),
    ...theme.shadows.medium,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
    marginBottom: theme.spacing(1.5),
  },
  logoDesktop: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  appName: {
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.bold,
    fontWeight: 'bold',
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
