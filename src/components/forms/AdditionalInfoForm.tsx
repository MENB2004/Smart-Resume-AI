import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Input } from '../Input';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { Resume } from '../../types/resume';

interface Props {
  certifications: Resume['certifications'];
  achievements: Resume['achievements'];
  languages: Resume['languages'];
  onChangeCertifications: (data: Resume['certifications']) => void;
  onChangeAchievements: (data: Resume['achievements']) => void;
  onChangeLanguages: (data: Resume['languages']) => void;
}

const POPULAR_LANGUAGES = [
  'English', 'Spanish', 'Mandarin', 'Hindi', 'French', 
  'Arabic', 'Bengali', 'Russian', 'Portuguese', 'Urdu', 
  'Indonesian', 'German', 'Japanese', 'Marathi', 'Telugu', 
  'Turkish', 'Tamil', 'Vietnamese', 'Korean', 'Italian'
];

export const AdditionalInfoForm: React.FC<Props> = ({ 
  certifications, 
  achievements, 
  languages = [],
  onChangeCertifications, 
  onChangeAchievements,
  onChangeLanguages,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [currentCert, setCurrentCert] = useState('');
  const [currentAchieve, setCurrentAchieve] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const addCert = () => {
    if (currentCert.trim()) {
      onChangeCertifications([
        ...certifications, 
        { id: Date.now().toString(), name: currentCert.trim() }
      ]);
      setCurrentCert('');
    }
  };

  const removeCert = (id: string) => {
    onChangeCertifications(certifications.filter((cert) => cert.id !== id));
  };

  const handleDocumentUpload = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const updated = certifications.map(cert => 
          cert.id === id 
            ? { ...cert, attachmentUri: file.uri, attachmentName: file.name } 
            : cert
        );
        onChangeCertifications(updated);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const removeDocument = (id: string) => {
    const updated = certifications.map(cert => 
      cert.id === id ? { ...cert, attachmentUri: undefined, attachmentName: undefined } : cert
    );
    onChangeCertifications(updated);
  };

  const addAchieve = () => {
    if (currentAchieve.trim()) {
      onChangeAchievements([...achievements, currentAchieve.trim()]);
      setCurrentAchieve('');
    }
  };

  const removeAchieve = (index: number) => {
    onChangeAchievements(achievements.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (currentLanguage.trim() && !languages.includes(currentLanguage.trim())) {
      onChangeLanguages([...languages, currentLanguage.trim()]);
      setCurrentLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    onChangeLanguages(languages.filter(l => l !== lang));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Certifications</Text>
      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: theme.spacing(1) }}>
          <Input
            placeholder="Workshop on Python Programming - NIT"
            value={currentCert}
            onChangeText={setCurrentCert}
            onSubmitEditing={addCert}
          />
        </View>
        <Button title="Add" onPress={addCert} style={styles.addBtn} />
      </View>
      <View style={styles.listContainer}>
        {certifications.map((cert) => (
          <View key={cert.id} style={styles.certCard}>
            <View style={styles.certHeaderRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{cert.name}</Text>
              <TouchableOpacity onPress={() => removeCert(cert.id)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {cert.attachmentName ? (
              <View style={styles.attachedFileRow}>
                <Text style={styles.attachedFileName}>📎 {cert.attachmentName}</Text>
                <TouchableOpacity onPress={() => removeDocument(cert.id)}>
                  <Text style={styles.removeText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadLink} onPress={() => handleDocumentUpload(cert.id)}>
                <Text style={styles.uploadLinkText}>+ Attach Proof</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Achievements / Extracurriculars</Text>
      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: theme.spacing(1) }}>
          <Input
            placeholder="Presented project at ICST 2025"
            value={currentAchieve}
            onChangeText={setCurrentAchieve}
            onSubmitEditing={addAchieve}
          />
        </View>
        <Button title="Add" onPress={addAchieve} style={styles.addBtn} />
      </View>
      <View style={styles.listContainer}>
        {achievements.map((ach, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{ach}</Text>
            <TouchableOpacity onPress={() => removeAchieve(index)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Languages</Text>
      
      <Button 
        title="+ Select Languages" 
        onPress={() => setShowLanguageModal(true)} 
        variant="outline"
        style={{ marginBottom: theme.spacing(2) }}
      />
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {languages.map(lang => (
          <TouchableOpacity key={lang} onPress={() => removeLanguage(lang)} style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
            borderWidth: 1,
            paddingHorizontal: theme.spacing(2),
            paddingVertical: theme.spacing(1),
            borderRadius: theme.borderRadius.round,
            marginRight: theme.spacing(1),
            marginBottom: theme.spacing(1),
          }}>
            <Text style={{ color: theme.colors.primary, fontSize: theme.typography.sizes.caption }}>{lang}  ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showLanguageModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {POPULAR_LANGUAGES.map(lang => {
                const isSelected = languages.includes(lang);
                return (
                  <TouchableOpacity 
                    key={lang}
                    style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
                    onPress={() => {
                      if (isSelected) {
                        removeLanguage(lang);
                      } else {
                        onChangeLanguages([...languages, lang]);
                      }
                    }}
                  >
                    <Text style={[styles.languageOptionText, isSelected && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                      {lang}
                    </Text>
                    {isSelected && <Text style={{ color: theme.colors.primary }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <Text style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(1), color: theme.colors.textSecondary }}>
              Or add a custom language:
            </Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: theme.spacing(1) }}>
                <Input
                  placeholder="e.g. Latin"
                  value={currentLanguage}
                  onChangeText={setCurrentLanguage}
                  onSubmitEditing={addLanguage}
                />
              </View>
              <Button title="Add" onPress={addLanguage} style={styles.addBtn} />
            </View>
          </View>
        </View>
      </Modal>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addBtn: {
    paddingVertical: theme.spacing(1.5),
  },
  listContainer: {
    marginTop: theme.spacing(1),
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  certCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  certHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadLink: {
    marginLeft: 22,
    marginTop: theme.spacing(1),
  },
  uploadLinkText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.small,
  },
  attachedFileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing(1),
    borderRadius: theme.borderRadius.small,
    marginLeft: 22,
    marginTop: theme.spacing(1),
  },
  attachedFileName: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.small,
    flex: 1,
  },
  bullet: {
    color: theme.colors.primary,
    marginRight: theme.spacing(1),
    fontSize: 18,
  },
  listText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body,
  },
  removeBtn: {
    padding: theme.spacing(1),
  },
  removeText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing(3),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    padding: theme.spacing(3),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  closeModalText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    padding: theme.spacing(1),
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  languageOptionText: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.text,
  },
});
