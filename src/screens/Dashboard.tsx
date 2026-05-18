import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, RefreshControl, Image } from 'react-native';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Resume } from '../types/resume';
import { pdfService } from '../services/pdfService';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export const Dashboard = ({ navigation }: any) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme);

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
    // simulate a small delay so user sees the spinner
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadResumes();
    });
    return unsubscribe;
  }, [navigation]);

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

  // Mock ATS Score Average
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

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/icon.png')} style={styles.headerLogo} />
            <Text style={styles.headerAppName}>SmartResume AI</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'ME'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email || 'User'}</Text>
            <Text style={styles.profileStats}>{resumes.length} Resumes Created</Text>
          </View>
          <Button 
            title="Sign Out" 
            onPress={() => supabase.auth.signOut()} 
            variant="outline"
            style={styles.signOutBtn}
            textStyle={{ fontSize: 12 }}
          />
        </View>

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
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Resumes</Text>
        </View>

        {resumes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>You haven't created any resumes yet.</Text>
            <Text style={styles.emptySubText}>Tap the + button to build your first ATS-optimized resume.</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {resumes.map(renderItem)}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button Upgrade */}
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

      <Modal
        visible={isLevelModalVisible}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={isDarkMode ? 40 : 80} tint={isDarkMode ? "dark" : "light"} style={styles.modalOverlay}>
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
        </BlurView>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing(3),
    paddingTop: theme.spacing(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing(0.5),
    ...theme.shadows.soft,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.h3,
    fontWeight: 'bold',
    fontFamily: theme.typography.fonts.bold,
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
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  cardContent: {
    padding: theme.spacing(2),
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
    ...theme.shadows.medium,
    shadowColor: theme.colors.primary,
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
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing(3),
    width: '100%',
    maxWidth: 400,
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
    backgroundColor: theme.colors.background,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  }
});
