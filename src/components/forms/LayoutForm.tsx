import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { Resume } from '../../types/resume';

interface Props {
  templateId: Resume['templateId'];
  sectionsOrder: string[];
  customSections: Resume['customSections'];
  onChangeTemplateId: (id: Resume['templateId']) => void;
  onChangeSectionsOrder: (order: string[]) => void;
  onChangeCustomSections: (sections: Resume['customSections']) => void;
}

export const LayoutForm: React.FC<Props> = ({
  templateId = 'classic',
  sectionsOrder = [],
  customSections = [],
  onChangeTemplateId,
  onChangeSectionsOrder,
  onChangeCustomSections,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');

  // Fallback defaults if sectionsOrder is empty
  const defaultSections = [
    { id: 'personalInfo', label: 'Candidate Header' },
    { id: 'summary', label: 'Professional Summary' },
    { id: 'skills', label: 'Core Skills' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Work Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'achievements', label: 'Achievements & Extracurriculars' },
    { id: 'languages', label: 'Languages' },
  ];

  const currentOrder = sectionsOrder.length > 0 
    ? sectionsOrder 
    : defaultSections.map(s => s.id);

  const getLabel = (id: string) => {
    const found = defaultSections.find(s => s.id === id);
    if (found) return found.label;
    
    const custom = customSections?.find(s => s.id === id);
    if (custom) return `Custom: ${custom.title}`;
    
    return id;
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    onChangeSectionsOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    onChangeSectionsOrder(newOrder);
  };

  const templates: Array<{ id: Resume['templateId']; label: string; desc: string }> = [
    { id: 'classic', label: 'Classic ATS', desc: 'Standard academic serif template' },
    { id: 'modern', label: 'Modern ATS', desc: 'Roboto font with blue accent headers' },
    { id: 'minimal', label: 'Minimal', desc: 'Thin dividers, compact spacing' },
    { id: 'student', label: 'Student / Fresher', desc: 'Optimized project and coursework layout' },
    { id: 'developer', label: 'Developer Portfolio', desc: 'Bold technology highlights' },
  ];

  const addCustomSection = () => {
    if (!newSectionTitle || !newSectionContent) return;
    const customId = `custom_${Date.now().toString()}`;
    const newCustom = [
      ...(customSections || []),
      { id: customId, title: newSectionTitle, content: newSectionContent }
    ];
    onChangeCustomSections(newCustom);
    
    // Add custom section at the end of the order
    onChangeSectionsOrder([...currentOrder, customId]);
    
    setNewSectionTitle('');
    setNewSectionContent('');
  };

  const removeCustomSection = (id: string) => {
    const filteredCustom = (customSections || []).filter(s => s.id !== id);
    onChangeCustomSections(filteredCustom);
    onChangeSectionsOrder(currentOrder.filter(s => s !== id));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>1. Choose Resume Template</Text>
      <View style={styles.templateGrid}>
        {templates.map(tpl => (
          <TouchableOpacity
            key={tpl.id}
            onPress={() => onChangeTemplateId(tpl.id)}
            style={[
              styles.tplCard,
              templateId === tpl.id ? styles.tplCardActive : null
            ]}
          >
            <Text style={[
              styles.tplLabel,
              templateId === tpl.id ? styles.tplLabelActive : null
            ]}>
              {tpl.label}
            </Text>
            <Text style={styles.tplDesc}>{tpl.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>2. Arrange Section Order</Text>
      <Text style={styles.helperText}>Rearrange the visual layout order of sections inside your printed PDF.</Text>
      <View style={styles.orderList}>
        {currentOrder.map((sectionId, index) => (
          <View key={sectionId} style={styles.orderRow}>
            <Text style={styles.orderRowLabel}>{getLabel(sectionId)}</Text>
            <View style={styles.arrowContainer}>
              <TouchableOpacity 
                onPress={() => moveUp(index)} 
                disabled={index === 0}
                style={[styles.arrowBtn, index === 0 ? styles.arrowDisabled : null]}
              >
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => moveDown(index)} 
                disabled={index === currentOrder.length - 1}
                style={[styles.arrowBtn, index === currentOrder.length - 1 ? styles.arrowDisabled : null]}
              >
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
              {sectionId.startsWith('custom_') && (
                <TouchableOpacity onPress={() => removeCustomSection(sectionId)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>3. Add Custom Section</Text>
      <View style={styles.customForm}>
        <TextInput
          placeholder="Section Title (e.g. Volunteer Work, Key Courses)"
          value={newSectionTitle}
          onChangeText={setNewSectionTitle}
          style={styles.customInput}
          placeholderTextColor="#777"
        />
        <TextInput
          placeholder="Describe items, badges, or accomplishments here..."
          value={newSectionContent}
          onChangeText={setNewSectionContent}
          style={[styles.customInput, styles.customMultiline]}
          multiline
          numberOfLines={4}
          placeholderTextColor="#777"
        />
        <Button
          title="+ Add Custom Section"
          onPress={addCustomSection}
          variant="outline"
          style={styles.customAddBtn}
        />
      </View>
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
    marginBottom: theme.spacing(1.5),
  },
  helperText: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(2),
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  tplCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tplCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  tplLabel: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  tplLabelActive: {
    color: theme.colors.primary,
  },
  tplDesc: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing(3),
  },
  orderList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(1.5),
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  orderRowLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: theme.spacing(1),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.small,
    marginHorizontal: 2,
    width: 30,
    alignItems: 'center',
  },
  arrowDisabled: {
    opacity: 0.2,
  },
  arrowText: {
    color: theme.colors.text,
    fontSize: 11,
  },
  deleteBtn: {
    marginLeft: theme.spacing(1.5),
    padding: 6,
  },
  deleteText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    fontSize: 13,
  },
  customForm: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customInput: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.small,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontSize: 13,
  },
  customMultiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  customAddBtn: {
    borderColor: theme.colors.primary,
  }
});
