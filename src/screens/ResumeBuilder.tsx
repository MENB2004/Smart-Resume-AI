import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from './../context/ThemeContext';
import { Button } from './../components/Button';
import { PersonalInfoForm } from './../components/forms/PersonalInfoForm';
import { EducationSkillsForm } from './../components/forms/EducationSkillsForm';
import { ExperienceProjectsForm } from './../components/forms/ExperienceProjectsForm';
import { AdditionalInfoForm } from './../components/forms/AdditionalInfoForm';
import { LayoutForm } from './../components/forms/LayoutForm';
import { Resume } from './../types/resume';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './../context/AuthContext';
import { aiService } from './../services/aiService';
import { useResponsive } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

const initialResumeState: Resume = {
  id: '',
  title: 'My Resume',
  lastUpdated: new Date().toISOString().split('T')[0],
  level: 'fresher',
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', summary: '' },
  education: [],
  experience: [],
  skills: [
    { category: 'Languages', items: [] },
    { category: 'Frameworks & Libraries', items: [] },
    { category: 'Tools & Platforms', items: [] },
    { category: 'Soft Skills', items: [] },
  ],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
};

export const ResumeBuilder = ({ route, navigation }: any) => {
  const existingResume = route.params?.resume;
  const passedLevel = route.params?.level || 'fresher';
  const { isWeb, isDesktop } = useResponsive();

  // Handle legacy flat skills array
  let initialSkills = initialResumeState.skills;
  if (existingResume && existingResume.skills) {
    if (existingResume.skills.length > 0 && typeof existingResume.skills[0] === 'string') {
      initialSkills = [
        { category: 'Languages', items: existingResume.skills as any },
        { category: 'Frameworks & Libraries', items: [] },
        { category: 'Tools & Platforms', items: [] },
        { category: 'Soft Skills', items: [] },
      ];
    } else if (existingResume.skills.length > 0 && existingResume.skills[0].category) {
      initialSkills = existingResume.skills;
    }
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resumeData, setResumeData] = useState<Resume>(
    existingResume
      ? { ...existingResume, skills: initialSkills, level: existingResume.level || passedLevel }
      : { ...initialResumeState, level: passedLevel, id: Date.now().toString() }
  );
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme, isDesktop, isWeb);

  const [atsWarnings, setAtsWarnings] = useState<string[]>([]);
  const [atsScore, setAtsScore] = useState<number>(100);
  const [atsExpanded, setAtsExpanded] = useState(false);

  useEffect(() => {
    const analyze = async () => {
      try {
        const result = await aiService.analyzeResume(resumeData);
        setAtsWarnings(result.suggestions.filter((s) => !s.startsWith('✓')));
        setAtsScore(result.score);
      } catch (e) {
        console.error(e);
      }
    };
    analyze();
  }, [resumeData]);

  const STEPS =
    resumeData.level === 'experienced'
      ? ['Personal', 'Experience', 'Education', 'Additional', 'Layout']
      : ['Personal', 'Education', 'Projects', 'Additional', 'Layout'];

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSave();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    try {
      const stored = await AsyncStorage.getItem('@resumes');
      const resumes: Resume[] = stored ? JSON.parse(stored) : [];

      const existingIndex = resumes.findIndex((r) => r.id === resumeData.id);
      if (existingIndex >= 0) {
        resumes[existingIndex] = {
          ...resumeData,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      } else {
        resumes.push(resumeData);
      }

      await AsyncStorage.setItem('@resumes', JSON.stringify(resumes));
      navigation.navigate('Dashboard');
    } catch (e) {
      console.error('Failed to save resume');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'Personal':
        return (
          <PersonalInfoForm
            data={resumeData.personalInfo}
            targetRole={resumeData.targetRole}
            level={resumeData.level}
            onChange={(data) => setResumeData({ ...resumeData, personalInfo: data })}
            onChangeTargetRole={(role) => setResumeData({ ...resumeData, targetRole: role })}
          />
        );
      case 'Education':
        return (
          <EducationSkillsForm
            education={resumeData.education}
            skills={resumeData.skills}
            targetRole={resumeData.targetRole}
            onChangeEducation={(data) => setResumeData({ ...resumeData, education: data })}
            onChangeSkills={(data) => setResumeData({ ...resumeData, skills: data })}
          />
        );
      case 'Experience':
        return (
          <ExperienceProjectsForm
            experience={resumeData.experience}
            projects={resumeData.projects}
            onChangeExperience={(data) => setResumeData({ ...resumeData, experience: data })}
            onChangeProjects={(data) => setResumeData({ ...resumeData, projects: data })}
          />
        );
      case 'Projects':
        return (
          <ExperienceProjectsForm
            experience={resumeData.experience}
            projects={resumeData.projects}
            onChangeExperience={(data) => setResumeData({ ...resumeData, experience: data })}
            onChangeProjects={(data) => setResumeData({ ...resumeData, projects: data })}
          />
        );
      case 'Additional':
        return (
          <AdditionalInfoForm
            certifications={resumeData.certifications}
            achievements={resumeData.achievements}
            languages={resumeData.languages}
            level={resumeData.level}
            coursework={resumeData.coursework || []}
            profiles={resumeData.profiles || []}
            onChangeCertifications={(data) => setResumeData({ ...resumeData, certifications: data })}
            onChangeAchievements={(data) => setResumeData({ ...resumeData, achievements: data })}
            onChangeLanguages={(data) => setResumeData({ ...resumeData, languages: data })}
            onChangeCoursework={(data) => setResumeData({ ...resumeData, coursework: data })}
            onChangeProfiles={(data) => setResumeData({ ...resumeData, profiles: data })}
          />
        );
      case 'Layout':
        return (
          <LayoutForm
            templateId={resumeData.templateId}
            sectionsOrder={resumeData.sectionsOrder || []}
            customSections={resumeData.customSections || []}
            onChangeTemplateId={(id) => setResumeData({ ...resumeData, templateId: id })}
            onChangeSectionsOrder={(order) => setResumeData({ ...resumeData, sectionsOrder: order })}
            onChangeCustomSections={(custom) => setResumeData({ ...resumeData, customSections: custom })}
          />
        );
      default:
        return null;
    }
  };

  // ATS Panel (shared between mobile drawer and desktop sidebar)
  const ATSPanel = () => (
    <View style={styles.atsPanel}>
      {/* Score Badge */}
      <View style={[
        styles.scoreBadge,
        { backgroundColor: atsScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
      ]}>
        <Text style={[
          styles.scoreLabel,
          { color: atsScore >= 80 ? '#10b981' : '#ef4444' },
        ]}>
          ATS Score
        </Text>
        <Text style={[
          styles.scoreValue,
          { color: atsScore >= 80 ? '#10b981' : '#ef4444' },
        ]}>
          {atsScore}/100
        </Text>
      </View>

      {isDesktop && (
        <Text style={styles.atsPanelTitle}>
          {atsWarnings.length === 0
            ? '🎉 Fully Optimized'
            : `${atsWarnings.length} Suggestion${atsWarnings.length !== 1 ? 's' : ''}`}
        </Text>
      )}

      <ScrollView style={styles.atsScrollList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {atsWarnings.length === 0 ? (
          <Text style={styles.noWarningsText}>
            🎉 Perfect! No ATS improvements recommended.
          </Text>
        ) : (
          atsWarnings.map((warn, i) => (
            <View key={i} style={styles.warnItem}>
              <Text style={styles.warnBullet}>⚠️</Text>
              <Text style={styles.warnText}>{warn}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Desktop two-column layout
  if (isDesktop && isWeb) {
    return (
      <View style={styles.desktopContainer}>
        {/* Left: Step sidebar + form */}
        <View style={styles.desktopLeft}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={handlePrev} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.backBtnText}>
                    {currentStepIndex === 0 ? 'Dashboard' : 'Back'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.title}>Resume Builder</Text>
                <Text style={styles.stepIndicator}>
                  Step {currentStepIndex + 1} of {STEPS.length}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.smartImportHeaderBtn}
                onPress={() => navigation.navigate('SmartImport', { resume: resumeData, onImportCallback: (updated: Resume) => setResumeData(updated) })}
              >
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={styles.smartImportHeaderBtnText}>Smart Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vertical step list */}
          <View style={styles.desktopStepList}>
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isDone = index < currentStepIndex;
              return (
                <TouchableOpacity
                  key={step}
                  style={[styles.desktopStep, isActive && styles.desktopStepActive]}
                  onPress={() => setCurrentStepIndex(index)}
                >
                  <View style={[
                    styles.desktopStepDot,
                    isActive && styles.desktopStepDotActive,
                    isDone && styles.desktopStepDotDone,
                  ]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={styles.desktopStepDotText}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.desktopStepLabel,
                    isActive && styles.desktopStepLabelActive,
                  ]}>
                    {step}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form content */}
          <ScrollView style={styles.desktopFormScroll} contentContainerStyle={{ paddingBottom: 120 }}>
            {renderCurrentStep()}
          </ScrollView>

          {/* Nav footer */}
          <View style={styles.desktopFooter}>
            <Button
              title={currentStepIndex === 0 ? 'Cancel' : 'Back'}
              onPress={handlePrev}
              variant="outline"
              style={styles.navButton}
            />
            <Button
              title={currentStepIndex === STEPS.length - 1 ? 'Save Resume' : 'Next →'}
              onPress={handleNext}
              style={styles.navButton}
            />
          </View>
        </View>

        {/* Right: ATS Panel */}
        <View style={styles.desktopRight}>
          <Text style={styles.atsSidebarTitle}>Live ATS Analysis</Text>
          <ATSPanel />
        </View>
      </View>
    );
  }

  // Mobile / app layout (original)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(1) }}>
          <Text style={styles.title}>Resume Builder</Text>
          <TouchableOpacity
            style={styles.smartImportHeaderBtn}
            onPress={() => navigation.navigate('SmartImport', { resume: resumeData, onImportCallback: (updated: Resume) => setResumeData(updated) })}
          >
            <Ionicons name="sparkles" size={12} color="#fff" />
            <Text style={styles.smartImportHeaderBtnText}>Smart Import</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.progressStepWrapper}>
              <View
                style={[
                  styles.progressDot,
                  index <= currentStepIndex ? styles.progressDotActive : null,
                ]}
              />
              <Text
                style={[
                  styles.progressText,
                  index === currentStepIndex ? styles.progressTextActive : null,
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: (((currentStepIndex / (STEPS.length - 1)) * 100).toString() + '%') as any },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>{renderCurrentStep()}</View>

      {/* Mobile ATS Drawer */}
      <View style={styles.atsDrawer}>
        <TouchableOpacity
          style={styles.atsDrawerHeader}
          onPress={() => setAtsExpanded(!atsExpanded)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[
              styles.scoreBadgeMobile,
              { backgroundColor: atsScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
            ]}>
              <Text style={[
                styles.scoreTextMobile,
                { color: atsScore >= 80 ? '#10b981' : '#ef4444' },
              ]}>
                ATS Score: {atsScore}/100
              </Text>
            </View>
            <Text style={styles.atsWarningsCount}>
              {atsWarnings.length} Improvement{atsWarnings.length !== 1 ? 's' : ''} Recommended
            </Text>
          </View>
          <Text style={styles.toggleText}>{atsExpanded ? '▼ Collapse' : '▲ Show Suggestions'}</Text>
        </TouchableOpacity>

        {atsExpanded && (
          <ScrollView style={styles.atsDrawerContent} nestedScrollEnabled>
            {atsWarnings.length === 0 ? (
              <Text style={styles.noWarningsText}>
                🎉 Perfect! No ATS improvements recommended. Your resume is fully optimized.
              </Text>
            ) : (
              atsWarnings.map((warn, i) => (
                <View key={i} style={styles.warnItem}>
                  <Text style={styles.warnBullet}>⚠️</Text>
                  <Text style={styles.warnText}>{warn}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={currentStepIndex === 0 ? 'Cancel' : 'Back'}
          onPress={handlePrev}
          variant="outline"
          style={styles.navButton}
        />
        <Button
          title={currentStepIndex === STEPS.length - 1 ? 'Save Resume' : 'Next'}
          onPress={handleNext}
          style={styles.navButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: any, isDesktop: boolean, isWeb: boolean) =>
  StyleSheet.create({
    // ---------- shared ----------
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    smartImportHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.round,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    smartImportHeaderBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    header: {
      padding: theme.spacing(3),
      paddingTop: isWeb ? theme.spacing(3) : theme.spacing(6),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginBottom: isDesktop ? theme.spacing(0.5) : theme.spacing(2),
    },
    stepIndicator: {
      fontSize: theme.typography.sizes.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(1),
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    backBtnText: {
      color: theme.colors.primary,
      marginLeft: 4,
      fontSize: theme.typography.sizes.caption,
      fontWeight: '600',
    },
    navButton: {
      flex: 1,
      marginHorizontal: theme.spacing(1),
    },
    noWarningsText: {
      fontSize: 12,
      color: '#10b981',
      lineHeight: 16,
    },
    warnItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    warnBullet: {
      fontSize: 12,
      marginRight: theme.spacing(1.5),
    },
    warnText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
      lineHeight: 16,
    },

    // ---------- desktop ----------
    desktopContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    desktopLeft: {
      flex: 3,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      display: 'flex' as any,
      flexDirection: 'column',
    },
    desktopRight: {
      flex: 2,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing(3),
    },
    atsSidebarTitle: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing(2),
    },
    desktopStepList: {
      flexDirection: 'row',
      padding: theme.spacing(2),
      paddingHorizontal: theme.spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    },
    desktopStep: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.round,
      gap: 6,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    desktopStepActive: {
      backgroundColor: `${theme.colors.primary}18`,
    },
    desktopStepDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    desktopStepDotActive: {
      backgroundColor: theme.colors.primary,
    },
    desktopStepDotDone: {
      backgroundColor: theme.colors.success,
    },
    desktopStepDotText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: 'bold',
    },
    desktopStepLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    desktopStepLabelActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    desktopFormScroll: {
      flex: 1,
      padding: theme.spacing(3),
    },
    desktopFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: theme.spacing(3),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing(1),
    },

    // ATS Panel (desktop)
    atsPanel: {
      flex: 1,
    },
    scoreBadge: {
      padding: theme.spacing(2),
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing(2),
      alignItems: 'center',
    },
    scoreLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    scoreValue: {
      fontSize: 36,
      fontWeight: 'bold',
    },
    atsPanelTitle: {
      fontSize: theme.typography.sizes.caption,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing(1),
    },
    atsScrollList: {
      flex: 1,
    },

    // ---------- mobile ----------
    content: {
      flex: 1,
      padding: theme.spacing(3),
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing(3),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'relative',
      paddingBottom: theme.spacing(1),
    },
    progressBarBackground: {
      position: 'absolute',
      top: 6,
      left: 10,
      right: 10,
      height: 2,
      backgroundColor: theme.colors.border,
      zIndex: 1,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    progressStepWrapper: {
      alignItems: 'center',
      zIndex: 2,
      width: 60,
    },
    progressDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing(1),
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
      ...Platform.select({
        web: {
          boxShadow: `0px 0px 5px ${theme.colors.primary}`,
        },
        default: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 5,
          elevation: 4,
        },
      }),
    },
    progressText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    progressTextActive: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    atsDrawer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing(3),
      paddingVertical: theme.spacing(1.5),
    },
    atsDrawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing(1),
    },
    scoreBadgeMobile: {
      paddingHorizontal: theme.spacing(1.5),
      paddingVertical: theme.spacing(0.5),
      borderRadius: theme.borderRadius.small,
      marginRight: theme.spacing(2),
    },
    scoreTextMobile: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    atsWarningsCount: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '600',
    },
    toggleText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    atsDrawerContent: {
      maxHeight: 120,
      marginTop: theme.spacing(1),
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.05)',
      paddingTop: theme.spacing(1.5),
    },
  });
