import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Input } from '../Input';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { Resume } from '../../types/resume';
import { aiService } from '../../services/aiService';

interface Props {
  experience: Resume['experience'];
  projects: Resume['projects'];
  onChangeExperience: (data: Resume['experience']) => void;
  onChangeProjects: (data: Resume['projects']) => void;
}

export const ExperienceProjectsForm: React.FC<Props> = ({ 
  experience, 
  projects, 
  onChangeExperience, 
  onChangeProjects 
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [loadingBullets, setLoadingBullets] = useState<Record<string, boolean>>({});

  const addExperience = () => {
    onChangeExperience([
      ...experience, 
      { id: Date.now().toString(), role: '', company: '', duration: '', description: '' }
    ]);
  };

  const updateExperience = (id: string, field: string, value: string) => {
    const updated = experience.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChangeExperience(updated);
  };

  const removeExperience = (id: string) => {
    onChangeExperience(experience.filter(item => item.id !== id));
  };

  const handleDocumentUpload = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const updated = experience.map(item => 
          item.id === id 
            ? { ...item, attachmentUri: file.uri, attachmentName: file.name } 
            : item
        );
        onChangeExperience(updated);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const addProject = () => {
    onChangeProjects([
      ...projects,
      { id: Date.now().toString(), title: '', description: '', techStack: '', technologies: '', impact: '', bullets: [] }
    ]);
  };

  const updateProject = (id: string, field: string, value: any) => {
    const updated = projects.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChangeProjects(updated);
  };

  const removeProject = (id: string) => {
    onChangeProjects(projects.filter(item => item.id !== id));
  };

  const synthesizeBullets = async (id: string) => {
    const proj = projects.find(item => item.id === id);
    if (!proj) return;

    const title = proj.title || '';
    const tech = proj.techStack || '';
    const desc = proj.description || '';
    const impact = proj.impact || '';

    if (!title || !desc || !tech) {
      Alert.alert('Incomplete Info', 'Please enter a project title, technologies, and description first so the AI has context.');
      return;
    }

    setLoadingBullets(prev => ({ ...prev, [id]: true }));
    try {
      const bullets = await aiService.generateBullets(title, desc, tech, impact);
      if (bullets && bullets.length > 0) {
        updateProject(id, 'bullets', bullets);
        Alert.alert('✨ Bullets Synthesized!', 'Gemini has written ATS-friendly bullet points for your project.');
      } else {
        Alert.alert('AI Error', 'No bullets returned from Gemini.');
      }
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Failed to synthesize bullet points.');
    } finally {
      setLoadingBullets(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Work Experience</Text>
      {experience.map((exp, index) => (
        <View key={exp.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Role {index + 1}</Text>
            <TouchableOpacity onPress={() => removeExperience(exp.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Input
            label="Job Title / Role"
            placeholder="Frontend Developer"
            value={exp.role}
            onChangeText={(text) => updateExperience(exp.id, 'role', text)}
          />
          <Input
            label="Company Name"
            placeholder="Tech Corp"
            value={exp.company}
            onChangeText={(text) => updateExperience(exp.id, 'company', text)}
          />
          <Input
            label="Duration"
            placeholder="Jan 2022 - Present"
            value={exp.duration}
            onChangeText={(text) => updateExperience(exp.id, 'duration', text)}
          />
          <Input
            label="Description & Achievements"
            placeholder="Developed key features..."
            value={exp.description}
            onChangeText={(text) => updateExperience(exp.id, 'description', text)}
            multiline
            numberOfLines={4}
            containerStyle={{ height: 120 }}
          />
          
          <View style={styles.attachmentContainer}>
            <Text style={styles.attachmentLabel}>Proof of Employment:</Text>
            {exp.attachmentName ? (
              <View style={styles.attachedFileRow}>
                <Text style={styles.attachedFileName}>📎 {exp.attachmentName}</Text>
                <TouchableOpacity onPress={() => updateExperience(exp.id, 'attachmentName', '')}>
                  <Text style={styles.removeText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button 
                title="Upload Document" 
                onPress={() => handleDocumentUpload(exp.id)} 
                variant="outline"
                style={{ paddingVertical: 8 }}
                textStyle={{ fontSize: 12 }}
              />
            )}
          </View>
        </View>
      ))}
      <Button 
        title="+ Add Experience" 
        onPress={addExperience} 
        variant="outline" 
        style={styles.addButton}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Projects</Text>
      {projects.map((proj, index) => (
        <View key={proj.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Project {index + 1}</Text>
            <TouchableOpacity onPress={() => removeProject(proj.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Input
            label="Project Title"
            placeholder="SmartResume AI"
            value={proj.title}
            onChangeText={(text) => updateProject(proj.id, 'title', text)}
          />
          <Input
            label="Technologies Used"
            placeholder="React Native, Node.js, Supabase"
            value={proj.techStack}
            onChangeText={(text) => {
              updateProject(proj.id, 'techStack', text);
              updateProject(proj.id, 'technologies', text);
            }}
          />
          <Input
            label="What did you build? (Core Description)"
            placeholder="An ATS-friendly resume builder website..."
            value={proj.description}
            onChangeText={(text) => updateProject(proj.id, 'description', text)}
            multiline
            numberOfLines={2}
            containerStyle={{ height: 60 }}
          />
          <Input
            label="What was the measurable result? (Metrics & Impact)"
            placeholder="e.g. reducing processing time by 40% or attracting 100+ active users"
            value={proj.impact || ''}
            onChangeText={(text) => updateProject(proj.id, 'impact', text)}
            multiline
            numberOfLines={2}
            containerStyle={{ height: 60 }}
          />

          <Button 
            title="✨ AI Synthesize Bullet Points" 
            onPress={() => synthesizeBullets(proj.id)} 
            variant="outline"
            isLoading={loadingBullets[proj.id]}
            style={styles.aiButton}
            textStyle={styles.aiButtonText}
          />

          {proj.bullets && proj.bullets.length > 0 && (
            <View style={styles.bulletsPreview}>
              <Text style={styles.bulletsPreviewTitle}>Formatted ATS Bullets:</Text>
              {proj.bullets.map((bullet, i) => (
                <Text key={i} style={styles.bulletItem}>• {bullet}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
      <Button 
        title="+ Add Project" 
        onPress={addProject} 
        variant="outline" 
        style={styles.addButton}
      />
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  removeText: {
    color: theme.colors.error,
  },
  addButton: {
    marginBottom: theme.spacing(4),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing(3),
  },
  attachmentContainer: {
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  attachmentLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.caption,
    marginBottom: theme.spacing(1),
  },
  attachedFileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing(1.5),
    borderRadius: theme.borderRadius.small,
  },
  attachedFileName: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.body,
    flex: 1,
  },
  aiButton: {
    marginVertical: theme.spacing(1.5),
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  aiButtonText: {
    color: theme.colors.primary,
  },
  bulletsPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: theme.spacing(1.5),
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing(1),
  },
  bulletsPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
  },
  bulletItem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  }
});
