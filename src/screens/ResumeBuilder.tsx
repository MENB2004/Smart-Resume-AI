import React, { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from './../context/ThemeContext';
import { Button } from './../components/Button';
import { PersonalInfoForm } from './../components/forms/PersonalInfoForm';
import { EducationSkillsForm } from './../components/forms/EducationSkillsForm';
import { ExperienceProjectsForm } from './../components/forms/ExperienceProjectsForm';
import { AdditionalInfoForm } from './../components/forms/AdditionalInfoForm';
import { Resume } from './../types/resume';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './../context/AuthContext';

const initialResumeState: Resume = {
  id: '',
  title: 'My Resume',
  lastUpdated: new Date().toISOString().split('T')[0],
  level: 'fresher', // default
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', summary: '' },
  education: [],
  experience: [],
  skills: [
    { category: 'Languages', items: [] },
    { category: 'Frameworks & Libraries', items: [] },
    { category: 'Tools & Platforms', items: [] },
    { category: 'Soft Skills', items: [] }
  ],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
};

export const ResumeBuilder = ({ route, navigation }: any) => {
  const existingResume = route.params?.resume;
  const passedLevel = route.params?.level || 'fresher';

  // Handle legacy flat skills array
  let initialSkills = initialResumeState.skills;
  if (existingResume && existingResume.skills) {
    if (existingResume.skills.length > 0 && typeof existingResume.skills[0] === 'string') {
      initialSkills = [
        { category: 'Languages', items: existingResume.skills as any },
        { category: 'Frameworks & Libraries', items: [] },
        { category: 'Tools & Platforms', items: [] },
        { category: 'Soft Skills', items: [] }
      ];
    } else if (existingResume.skills.length > 0 && existingResume.skills[0].category) {
      initialSkills = existingResume.skills;
    }
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resumeData, setResumeData] = useState<Resume>(
    existingResume ? {
      ...existingResume,
      skills: initialSkills,
      level: existingResume.level || passedLevel,
    } : {
      ...initialResumeState,
      level: passedLevel,
      id: Date.now().toString(),
    }
  );
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const STEPS = resumeData.level === 'experienced' 
    ? ['Personal', 'Experience', 'Education', 'Additional']
    : ['Personal', 'Education', 'Projects', 'Additional'];

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    try {
      const stored = await AsyncStorage.getItem('@resumes');
      const resumes: Resume[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = resumes.findIndex(r => r.id === resumeData.id);
      if (existingIndex >= 0) {
        resumes[existingIndex] = { ...resumeData, lastUpdated: new Date().toISOString().split('T')[0] };
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
            onChange={(data) => setResumeData({ ...resumeData, personalInfo: data })} 
          />
        );
      case 'Education':
        return (
          <EducationSkillsForm 
            education={resumeData.education} 
            skills={resumeData.skills} 
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
            onChangeCertifications={(data) => setResumeData({ ...resumeData, certifications: data })} 
            onChangeAchievements={(data) => setResumeData({ ...resumeData, achievements: data })} 
            onChangeLanguages={(data) => setResumeData({ ...resumeData, languages: data })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Resume Builder</Text>
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.progressStepWrapper}>
              <View 
                style={[
                  styles.progressDot, 
                  index <= currentStepIndex ? styles.progressDotActive : null
                ]} 
              />
              <Text 
                style={[
                  styles.progressText,
                  index === currentStepIndex ? styles.progressTextActive : null
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
                { width: (((currentStepIndex / (STEPS.length - 1)) * 100).toString() + '%') as any }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>

      <View style={styles.footer}>
        <Button 
          title={currentStepIndex === 0 ? "Cancel" : "Back"} 
          onPress={handlePrev} 
          variant="outline"
          style={styles.navButton} 
        />
        <Button 
          title={currentStepIndex === STEPS.length - 1 ? "Save Resume" : "Next"} 
          onPress={handleNext} 
          style={styles.navButton} 
        />
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  title: {
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
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
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
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
  navButton: {
    flex: 1,
    marginHorizontal: theme.spacing(1),
  }
});
