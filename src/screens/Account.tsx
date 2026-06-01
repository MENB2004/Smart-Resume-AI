import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../utils/responsive';
import { useProfile } from '../utils/useProfile';

export const Account = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isDesktop, isWeb } = useResponsive();
  const { profile, saveProfile, reload } = useProfile();
  const styles = getStyles(theme, isDesktop, isWeb);

  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    setDisplayName(profile.displayName);
    setTagline(profile.tagline);
  }, [profile.displayName, profile.tagline]);

  // Focus: reload in case profile was updated elsewhere
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', reload);
    return unsubscribe;
  }, [navigation, reload]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ displayName: displayName.trim(), tagline: tagline.trim() });
      Alert.alert('✅ Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Build initials for the avatar
  const initials = displayName.trim()
    ? displayName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.substring(0, 2).toUpperCase() ?? 'ME');

  const emailProvider = user?.email?.split('@')[1] ?? '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        {!isDesktop && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>My Account</Text>
        <Text style={styles.pageSubtitle}>Manage your profile information</Text>
      </View>

      {/* Avatar Hero */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarCircle}
        >
          <Text style={styles.avatarInitials}>{initials}</Text>
        </LinearGradient>

        {displayName.trim() ? (
          <Text style={styles.avatarName}>{displayName.trim()}</Text>
        ) : (
          <Text style={[styles.avatarName, { color: theme.colors.textSecondary }]}>
            Set your display name below
          </Text>
        )}

        {tagline.trim() ? (
          <View style={styles.taglineBadge}>
            <Ionicons name="briefcase-outline" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.taglineText}>{tagline.trim()}</Text>
          </View>
        ) : null}

        <Text style={styles.avatarEmail}>{user?.email}</Text>
      </View>

      {/* Profile Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeader}>
          <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.formCardTitle}>Profile Details</Text>
        </View>

        <Input
          label="Display Name"
          placeholder="e.g. John Doe"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <Input
          label="Tagline / Role"
          placeholder="e.g. Full Stack Developer"
          value={tagline}
          onChangeText={setTagline}
        />

        <Button
          title={saving ? 'Saving…' : 'Save Changes'}
          onPress={handleSave}
          isLoading={saving}
          style={styles.saveBtn}
        />
      </View>

      {/* Account Info Card */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
          <Text style={styles.formCardTitle}>Account Info</Text>
        </View>

        {/* Email row */}
        <View style={styles.infoRow}>
          <View style={styles.infoRowLeft}>
            <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
        </View>

        {/* Provider row */}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.infoRowLeft}>
            <Ionicons name="server-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoLabel}>Provider</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={styles.verifiedText}>Email/Password</Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={[styles.formCard, styles.dangerCard]}>
        <View style={styles.formCardHeader}>
          <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.formCardTitle, { color: theme.colors.error }]}>Danger Zone</Text>
        </View>
        <Text style={styles.dangerDesc}>
          Signing out will end your current session. Your resumes are saved locally and will remain on this device.
        </Text>
        <Button
          title="Sign Out"
          onPress={async () => {
            const { supabase } = await import('../services/supabase');
            supabase.auth.signOut();
          }}
          variant="outline"
          style={styles.signOutBtn}
          textStyle={{ color: theme.colors.error }}
        />
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: any, isDesktop: boolean, isWeb: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing(3),
      paddingTop: isWeb ? theme.spacing(3) : theme.spacing(6),
      paddingBottom: theme.spacing(8),
      maxWidth: isDesktop ? 680 : undefined,
      alignSelf: isDesktop ? 'center' : undefined,
      width: isDesktop ? '100%' : undefined,
    },

    // Page header
    pageHeader: {
      marginBottom: theme.spacing(3),
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(1.5),
      alignSelf: 'flex-start',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    backBtnText: {
      color: theme.colors.primary,
      marginLeft: 4,
      fontSize: theme.typography.sizes.caption,
      fontWeight: '600',
    },
    pageTitle: {
      fontSize: theme.typography.sizes.h1,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
    },

    // Avatar hero
    avatarSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing(4),
      marginBottom: theme.spacing(1),
    },
    avatarCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing(2),
      ...theme.shadows.medium,
    },
    avatarInitials: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: theme.typography.fonts.bold,
    },
    avatarName: {
      fontSize: theme.typography.sizes.h2,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: theme.spacing(0.5),
    },
    taglineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}18`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}35`,
      borderRadius: theme.borderRadius.round,
      paddingHorizontal: theme.spacing(1.5),
      paddingVertical: theme.spacing(0.5),
      marginBottom: theme.spacing(1),
    },
    taglineText: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    avatarEmail: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing(0.5),
    },

    // Form card
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing(3),
      marginBottom: theme.spacing(2),
      ...theme.shadows.soft,
    },
    formCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(2.5),
      gap: theme.spacing(1),
    },
    formCardTitle: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.semiBold,
    },
    saveBtn: {
      marginTop: theme.spacing(1),
    },

    // Info rows
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing(1.5),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1),
    },
    infoLabel: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.text,
      fontWeight: '600',
      maxWidth: '60%',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    verifiedText: {
      fontSize: 12,
      color: theme.colors.success,
      fontWeight: '600',
    },

    // Danger zone
    dangerCard: {
      borderColor: `${theme.colors.error}30`,
    },
    dangerDesc: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing(2),
    },
    signOutBtn: {
      borderColor: theme.colors.error,
    },
  });
