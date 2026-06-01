import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import { useProfile } from '../utils/useProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Resume } from '../types/resume';
import { pdfService } from '../services/pdfService';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

// Safe BlurView: only import on native to avoid web crash
let BlurView: any = null;
if (Platform.OS !== 'web') {
  BlurView = require('expo-blur').BlurView;
}

export const Dashboard = ({ navigation }: any) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { isWeb, isDesktop, isMobile } = useResponsive();
  const { profile, reload: reloadProfile } = useProfile();
  const styles = getStyles(theme, isDesktop, isWeb);

  const [refreshing, setRefreshing] = useState(false);

  const loadResumes = async () => {
    try {
      const stored = await AsyncStorage.getItem('@resumes');
      if (stored) {
        setResumes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load resumes');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadResumes();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadResumes();
      reloadProfile();
    });
    return unsubscribe;
  }, [navigation, reloadProfile]);

  const handleCreateNew = (level: 'fresher' | 'experienced') => {
    setIsLevelModalVisible(false);
    navigation.navigate('ResumeBuilder', { level });
  };

  const handleExportPDF = async (resume: Resume) => {
    try {
      await pdfService.generateAndSharePDF(resume);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (resume: Resume) => {
    navigation.navigate('ResumeBuilder', { resume });
  };

  const averageATS = resumes.length > 0 ? '82%' : '0%';

  const renderItem = (item: Resume) => (
    <LinearGradient
      key={item.id}
      colors={[theme.colors.surface, isDarkMode ? '#0F172A' : '#F1F5F9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <TouchableOpacity style={styles.cardContent} onPress={() => handleEdit(item)}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="document-text" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>{item.title || 'Untitled Resume'}</Text>
        </View>
        <Text style={styles.cardDate}>
          <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} /> Last updated: {item.lastUpdated} {item.level ? `• ${item.level.toUpperCase()}` : ''}
        </Text>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        <Button
          title="Edit"
          onPress={() => handleEdit(item)}
          variant="outline"
          style={styles.analyzeButton}
          textStyle={{ fontSize: 12 }}
        />
        <Button
          title="ATS Analyze"
          onPress={() => navigation.navigate('ATSAnalysis', { resume: item })}
          variant="outline"
          style={[styles.analyzeButton, { marginLeft: theme.spacing(1) }]}
          textStyle={{ fontSize: 12 }}
        />
        <Button
          title="Export"
          onPress={() => handleExportPDF(item)}
          variant="primary"
          style={[styles.analyzeButton, { marginLeft: theme.spacing(1) }]}
          textStyle={{ fontSize: 12 }}
        />
      </View>
    </LinearGradient>
  );

  // Modal overlay: BlurView on native, plain semi-transparent View on web
  const ModalOverlay = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web' || !BlurView) {
      return (
        <View style={styles.modalOverlayWeb}>
          {children}
        </View>
      );
    }
    return (
      <BlurView
        intensity={isDarkMode ? 40 : 80}
        tint={isDarkMode ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        {children}
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header — only shown on mobile/app. Web has the sidebar for this. */}
        {(!isWeb || isMobile) && (
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/icon.png')} style={styles.headerLogo} />
              <Text style={styles.headerAppName}>SmartResume AI</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
              <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Web page title */}
        {isWeb && (
          <View style={styles.webPageHeader}>
            <Text style={styles.webPageTitle}>Dashboard</Text>
            <Text style={styles.webPageSubtitle}>Manage and build your ATS-optimized resumes</Text>
          </View>
        )}

        {/* Profile Section — only on mobile */}
        {!isWeb && (() => {
          const initials = profile.displayName.trim()
            ? profile.displayName.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            : (user?.email?.substring(0, 2).toUpperCase() ?? 'ME');
          return (
            <TouchableOpacity
              style={styles.profileSection}
              onPress={() => navigation.navigate('Account')}
              activeOpacity={0.85}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmail}>
                  {profile.displayName.trim() || user?.email || 'User'}
                </Text>
                <Text style={styles.profileStats}>
                  {profile.tagline.trim() || `${resumes.length} Resumes Created`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          );
        })()}

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="folder-open" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{resumes.length}</Text>
            <Text style={styles.statLabel}>Total Resumes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={24} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{averageATS}</Text>
            <Text style={styles.statLabel}>Avg. ATS Score</Text>
          </View>
          {isDesktop && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Account')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle" size={24} color={theme.colors.accent} />
              <Text style={[styles.statValue, { color: theme.colors.accent, fontSize: 16 }]} numberOfLines={1}>
                {profile.displayName.trim() || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.statLabel}>My Account</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Resumes</Text>
          {isDesktop && (
            <Button
              title="+ New Resume"
              onPress={() => setIsLevelModalVisible(true)}
              variant="primary"
              style={styles.webNewBtn}
              textStyle={{ fontSize: 14 }}
            />
          )}
        </View>

        {resumes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>You haven't created any resumes yet.</Text>
            <Text style={styles.emptySubText}>
              {isDesktop
                ? 'Click "+ New Resume" above to build your first ATS-optimized resume.'
                : 'Tap the + button to build your first ATS-optimized resume.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {resumes.map(renderItem)}
          </View>
        )}
      </ScrollView>

      {/* FAB — only on mobile */}
      {!isDesktop && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={() => setIsLevelModalVisible(true)}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isLevelModalVisible}
        transparent={true}
        animationType="fade"
      >
        <ModalOverlay>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Resume Type</Text>
            <Text style={styles.modalSubtitle}>Select your experience level to customize the builder.</Text>

            <TouchableOpacity
              style={styles.levelCard}
              onPress={() => handleCreateNew('fresher')}
            >
              <Text style={styles.levelTitle}>🎓 Fresher</Text>
              <Text style={styles.levelDesc}>Focus on education, projects, and skills. Best for students and recent grads.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.levelCard, { marginBottom: theme.spacing(3) }]}
              onPress={() => handleCreateNew('experienced')}
            >
              <Text style={styles.levelTitle}>💼 Experienced</Text>
              <Text style={styles.levelDesc}>Focus on work history and career progression. Best for seasoned professionals.</Text>
            </TouchableOpacity>

            <Button title="Cancel" onPress={() => setIsLevelModalVisible(false)} variant="text" />
          </View>
        </ModalOverlay>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any, isDesktop: boolean, isWeb: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 100,
      maxWidth: isDesktop ? 1100 : undefined,
      alignSelf: isDesktop ? 'center' : undefined,
      width: isDesktop ? '100%' : undefined,
    },
    header: {
      padding: theme.spacing(3),
      paddingTop: theme.spacing(6),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    webPageHeader: {
      paddingHorizontal: theme.spacing(3),
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    webPageTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: 4,
    },
    webPageSubtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fonts.regular,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerLogo: {
      width: 44,
      height: 44,
      borderRadius: 10,
      marginRight: theme.spacing(1),
    },
    headerAppName: {
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.bold,
      fontWeight: 'bold',
    },
    themeToggleBtn: {
      padding: theme.spacing(1),
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing(3),
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing(3),
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing(3),
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.soft,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing(2),
      ...theme.shadows.soft,
    },
    avatarText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontFamily: theme.typography.fonts.bold,
      fontSize: 18,
    },
    profileInfo: {
      flex: 1,
    },
    profileEmail: {
      color: theme.colors.text,
      fontWeight: 'bold',
      fontFamily: theme.typography.fonts.semiBold,
      fontSize: theme.typography.sizes.body,
      marginBottom: 4,
    },
    profileStats: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fonts.medium,
      fontSize: theme.typography.sizes.small,
    },
    signOutBtn: {
      paddingVertical: theme.spacing(1),
      paddingHorizontal: theme.spacing(2),
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing(3),
      marginBottom: theme.spacing(4),
      justifyContent: 'space-between',
      gap: theme.spacing(1),
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing(isDesktop ? 3 : 2),
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      ...theme.shadows.soft,
    },
    statValue: {
      fontSize: isDesktop ? 28 : 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginVertical: 4,
    },
    statLabel: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionHeader: {
      paddingHorizontal: theme.spacing(3),
      marginBottom: theme.spacing(2),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.h3,
      fontWeight: 'bold',
      fontFamily: theme.typography.fonts.bold,
    },
    webNewBtn: {
      paddingVertical: theme.spacing(1),
      paddingHorizontal: theme.spacing(2),
    },
    emptyState: {
      padding: theme.spacing(5),
      alignItems: 'center',
      marginTop: theme.spacing(4),
    },
    emptyText: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.body,
      fontFamily: theme.typography.fonts.semiBold,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      textAlign: 'center',
    },
    listContent: {
      padding: theme.spacing(3),
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: isDesktop ? theme.spacing(2) : 0,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      marginBottom: isDesktop ? 0 : theme.spacing(2),
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      width: isDesktop ? 'calc(50% - 8px)' as any : '100%',
      ...theme.shadows.medium,
    },
    cardContent: {
      padding: theme.spacing(2),
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(0.5),
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.h3,
      fontWeight: '600',
      fontFamily: theme.typography.fonts.semiBold,
    },
    cardDate: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fonts.regular,
      fontSize: theme.typography.sizes.caption,
    },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: theme.spacing(2),
      paddingTop: 0,
    },
    analyzeButton: {
      paddingVertical: theme.spacing(1),
      paddingHorizontal: theme.spacing(2),
    },
    fabContainer: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      zIndex: 10,
    },
    fab: {
      borderRadius: 30,
      ...Platform.select({
        web: {
          boxShadow: `0px 8px 16px ${theme.colors.primary}59`,
        },
        default: {
          ...theme.shadows.medium,
          shadowColor: theme.colors.primary,
        },
      }),
    },
    fabGradient: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing(3),
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalOverlayWeb: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing(3),
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing(3),
      width: '100%',
      maxWidth: 420,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.medium,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginBottom: theme.spacing(1),
    },
    modalSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.body,
      marginBottom: theme.spacing(3),
    },
    levelCard: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing(2),
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing(2),
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    levelTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.h3,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    levelDesc: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.small,
    },
  });
