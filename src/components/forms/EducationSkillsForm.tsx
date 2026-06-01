import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Input } from '../Input';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { Resume } from '../../types/resume';
import { aiService } from '../../services/aiService';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  education: Resume['education'];
  skills: Resume['skills'];
  targetRole?: string;
  onChangeEducation: (data: Resume['education']) => void;
  onChangeSkills: (data: Resume['skills']) => void;
}

export const EducationSkillsForm: React.FC<Props> = ({ 
  education, 
  skills, 
  targetRole,
  onChangeEducation, 
  onChangeSkills 
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [loadingSkills, setLoadingSkills] = useState<Record<string, boolean>>({});

  const handleSuggestSkills = async (category: string, existingItems: string[]) => {
    if (!targetRole) {
      Alert.alert('Role Required', 'Please enter a target role in the Personal Info step first.');
      return;
    }
    setLoadingSkills(prev => ({ ...prev, [category]: true }));
    try {
      const suggested = await aiService.suggestSkillsForCategory(category, targetRole, existingItems);
      if (suggested && suggested.length > 0) {
        // Merge unique skills
        const combined = [...new Set([...existingItems, ...suggested])];
        
        // Update the skills array
        const updated = skills.map(cat => 
          cat.category === category ? { ...cat, items: combined } : cat
        );
        onChangeSkills(updated);
        Alert.alert('✨ Skills Suggested!', `Added suggested ${category.toLowerCase()} to your resume.`);
      } else {
        Alert.alert('No suggestions', 'AI could not find new suggestions for this category.');
      }
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Failed to suggest skills.');
    } finally {
      setLoadingSkills(prev => ({ ...prev, [category]: false }));
    }
  };
  
  const addEducation = () => {
    onChangeEducation([
      ...education, 
      { id: Date.now().toString(), degree: '', institution: '', year: '' }
    ]);
  };

  const updateEducation = (id: string, field: string, value: string) => {
    const updated = education.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChangeEducation(updated);
  };

  const removeEducation = (id: string) => {
    onChangeEducation(education.filter(item => item.id !== id));
  };

  const updateSkillCategory = (categoryName: string, text: string) => {
    const updated = skills.map(cat => {
      if (cat.category === categoryName) {
        // split by comma and remove empty spaces
        const items = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return { ...cat, items };
      }
      return cat;
    });
    onChangeSkills(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Education</Text>
      {education.map((edu, index) => (
        <View key={edu.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Institution {index + 1}</Text>
            <TouchableOpacity onPress={() => removeEducation(edu.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Input
            label="Degree / Course"
            placeholder="B.S. in Computer Science"
            value={edu.degree}
            onChangeText={(text) => updateEducation(edu.id, 'degree', text)}
          />
          <Input
            label="Institution Name"
            placeholder="University of Technology"
            value={edu.institution}
            onChangeText={(text) => updateEducation(edu.id, 'institution', text)}
          />
          <Input
            label="Graduation Year"
            placeholder="2024"
            value={edu.year}
            onChangeText={(text) => updateEducation(edu.id, 'year', text)}
          />
          <Input
            label="CGPA / Grade"
            placeholder="8.5 or 3.8/4.0"
            value={edu.cgpa || ''}
            onChangeText={(text) => updateEducation(edu.id, 'cgpa', text)}
          />
        </View>
      ))}
      <Button 
        title="+ Add Education" 
        onPress={addEducation} 
        variant="outline" 
        style={styles.addButton}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Skills</Text>
      {skills.map((skillCat) => (
        <View key={skillCat.category} style={{ marginBottom: 16 }}>
          <View style={styles.skillHeader}>
            <Text style={styles.label}>{skillCat.category}</Text>
            <TouchableOpacity
              style={styles.aiSuggestBtn}
              onPress={() => handleSuggestSkills(skillCat.category, skillCat.items)}
              disabled={loadingSkills[skillCat.category]}
            >
              {loadingSkills[skillCat.category] ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
                  <Text style={styles.aiSuggestBtnText}>AI Suggest</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Input
            placeholder={`Enter ${skillCat.category.toLowerCase()} separated by commas`}
            value={skillCat.items.join(', ')}
            onChangeText={(text) => updateSkillCategory(skillCat.category, text)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    width: '100%',
  },
  aiSuggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  aiSuggestBtnText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
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
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addSkillBtn: {
    paddingVertical: theme.spacing(1.5),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
  },
  skillBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  skillText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.caption,
  }
});
