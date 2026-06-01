import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { SIDEBAR_WIDTH, useResponsive } from '../utils/responsive';
import { useProfile } from '../utils/useProfile';

interface WebShellProps {
  children: React.ReactNode;
  navigation?: any;
  currentRoute?: string;
}

/**
 * Desktop-web sidebar navigation shell.
 * On mobile/app it passes children through with zero overhead.
 */
export const WebShell: React.FC<WebShellProps> = ({
  children,
  navigation,
  currentRoute,
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isDesktop, isWeb } = useResponsive();
  const { profile, reload } = useProfile();
  const [collapsed, setCollapsed] = useState(false);

  // Reload profile whenever this sidebar is focused/rendered
  useEffect(() => {
    reload();
  }, [reload]);

  const styles = getStyles(theme, collapsed);

  if (!isWeb || !isDesktop) {
    return <>{children}</>;
  }

  const sidebarWidth = collapsed ? 64 : SIDEBAR_WIDTH;

  const navItems = [
    { label: 'Dashboard',   icon: 'home-outline',        iconActive: 'home',         route: 'Dashboard' },
    { label: 'New Resume',  icon: 'add-circle-outline',  iconActive: 'add-circle',   route: 'ResumeBuilder' },
    { label: 'My Account',  icon: 'person-outline',      iconActive: 'person',       route: 'Account' },
  ];

  // Display name: prefer profile name, fallback to email prefix
  const displayName = profile.displayName.trim() || user?.email?.split('@')[0] || 'User';
  const initials = profile.displayName.trim()
    ? profile.displayName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.substring(0, 2).toUpperCase() ?? 'ME');

  return (
    <View style={styles.shell}>
      {/* ── Sidebar ── */}
      <View style={[styles.sidebar, { width: sidebarWidth }]}>
        <LinearGradient
          colors={isDarkMode ? ['#020B1A', '#040F26', '#030D1E'] : ['#F0F4FF', '#E8EEFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sidebarGradient}
        >
          {/* Header */}
          <View style={styles.sidebarHeader}>
            {!collapsed && (
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.logo}
                />
                <View>
                  <Text style={styles.brandName} numberOfLines={1}>SmartResume</Text>
                  <Text style={styles.brandTag}>AI Powered</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setCollapsed(!collapsed)}
              style={styles.collapseBtn}
            >
              <Ionicons
                name={collapsed ? 'chevron-forward' : 'chevron-back'}
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Nav Items */}
          <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
            {navItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => navigation?.navigate(item.route)}
                >
                  <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                    <Ionicons
                      name={(isActive ? item.iconActive : item.icon) as any}
                      size={19}
                      color={isActive ? '#fff' : theme.colors.textSecondary}
                    />
                  </View>
                  {!collapsed && (
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  )}
                  {!collapsed && isActive && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            {/* User card */}
            {!collapsed ? (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => navigation?.navigate('Account')}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.collapsedAvatar}
                onPress={() => navigation?.navigate('Account')}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.collapsedAvatarGradient}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Theme Toggle */}
            <TouchableOpacity onPress={toggleTheme} style={styles.footerBtn}>
              <Ionicons
                name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
                size={17}
                color={theme.colors.primary}
              />
              {!collapsed && (
                <Text style={styles.footerBtnText}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={() => supabase.auth.signOut()}
              style={styles.footerBtn}
            >
              <Ionicons name="log-out-outline" size={17} color={theme.colors.error} />
              {!collapsed && (
                <Text style={[styles.footerBtnText, { color: theme.colors.error }]}>
                  Sign Out
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* ── Main Content ── */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const getStyles = (theme: any, collapsed: boolean) =>
  StyleSheet.create({
    shell: {
      flex: 1,
      flexDirection: 'row',
    },
    sidebar: {
      height: '100%' as any,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      overflow: 'hidden',
    },
    sidebarGradient: {
      flex: 1,
      paddingTop: 24,
      paddingBottom: 20,
      paddingHorizontal: collapsed ? 8 : 14,
    },

    // Header
    sidebarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'space-between',
      marginBottom: 16,
      minHeight: 48,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    logo: {
      width: 34,
      height: 34,
      borderRadius: 8,
    },
    brandName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    brandTag: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    collapseBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: `${theme.colors.primary}18`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
      marginHorizontal: collapsed ? 4 : 0,
    },

    // Nav
    navList: {
      flex: 1,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: collapsed ? 4 : 8,
      borderRadius: theme.borderRadius.medium,
      marginBottom: 2,
      position: 'relative',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    navItemActive: {
      backgroundColor: `${theme.colors.primary}15`,
    },
    navIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    navIconWrapActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.soft,
    },
    navLabel: {
      marginLeft: 9,
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      flex: 1,
    },
    navLabelActive: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    activeIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },

    // Footer / user card
    sidebarFooter: {
      gap: 4,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: `${theme.colors.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}25`,
      marginBottom: 6,
      gap: 8,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    avatarGradient: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarInitials: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    userEmail: {
      color: theme.colors.textSecondary,
      fontSize: 11,
    },
    collapsedAvatar: {
      alignItems: 'center',
      marginBottom: 6,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    collapsedAvatarGradient: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: collapsed ? 4 : 8,
      borderRadius: theme.borderRadius.small,
      gap: 8,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    footerBtnText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      overflow: 'hidden' as any,
    },
  });
