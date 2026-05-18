import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Input } from '../Input';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { Resume } from '../../types/resume';

interface Props {
  education: Resume['education'];
  skills: Resume['skills'];
  onChangeEducation: (data: Resume['education']) => void;
  onChangeSkills: (data: Resume['skills']) => void;
}

export const EducationSkillsForm: React.FC<Props> = ({ 
  education, 
  skills, 
  onChangeEducation, 
  onChangeSkills 
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
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
          <Input
            label={skillCat.category}
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
