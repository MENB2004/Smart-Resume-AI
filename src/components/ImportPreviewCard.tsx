import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ImportedResumeData } from '../services/aiService';
import { MergeMode } from '../services/importService';

interface ImportPreviewCardProps {
  importedData: ImportedResumeData;
  mergeMode: MergeMode;
  setMergeMode: (mode: MergeMode) => void;
  handleApply: () => void;
  onClear: () => void;
}

const MERGE_MODES = [
  {
    id: 'replace' as MergeMode,
    label: 'Replace All',
    icon: 'refresh-outline',
    desc: 'Overwrites existing fields with imported data.',
  },
  {
    id: 'fill_empty' as MergeMode,
    label: 'Fill Empty',
    icon: 'add-circle-outline',
    desc: 'Only populates blank fields, keeping existing text safe.',
  },
  {
    id: 'merge' as MergeMode,
    label: 'Merge & Combine',
    icon: 'git-merge-outline',
    desc: 'Appends missing skills/experience and blends listings.',
  },
];

export const ImportPreviewCard: React.FC<ImportPreviewCardProps> = ({
  importedData,
  mergeMode,
  setMergeMode,
  handleApply,
  onClear,
}) => {
  const { theme } = useTheme();

  const hasName = importedData.personalInfo?.fullName;
  const hasEmail = importedData.personalInfo?.email;
  const hasSummary = importedData.personalInfo?.summary;
  const skillCount = importedData.skills?.reduce((n, c) => n + c.items.length, 0) ?? 0;
  const expCount = importedData.experience?.length ?? 0;
  const projCount = importedData.projects?.length ?? 0;
  const certCount = importedData.certifications?.length ?? 0;
  const eduCount = importedData.education?.length ?? 0;

  const PreviewChip = ({ icon, label }: { icon: string; label: string }) => (
    <View style={[styles.previewChip, { backgroundColor: `${theme.colors.success}12`, borderColor: `${theme.colors.success}25` }]}>
      <Ionicons name={icon as any} size={12} color={theme.colors.success} />
      <Text style={[styles.previewChipText, { color: theme.colors.success }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={[styles.previewCard, { backgroundColor: theme.colors.surface, borderColor: `${theme.colors.success}40` }]}>
      <View style={styles.previewHeader}>
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text style={[styles.previewTitle, { color: theme.colors.text }]}>Extracted Data Preview</Text>
      </View>

      <View style={styles.previewGrid}>
        {hasName && <PreviewChip icon="person-outline" label={importedData.personalInfo!.fullName!} />}
        {hasEmail && <PreviewChip icon="mail-outline" label={importedData.personalInfo!.email!} />}
        {importedData.targetRole && <PreviewChip icon="briefcase-outline" label={importedData.targetRole} />}
        {eduCount > 0 && <PreviewChip icon="school-outline" label={`${eduCount} Education`} />}
        {expCount > 0 && <PreviewChip icon="business-outline" label={`${expCount} Experience`} />}
        {projCount > 0 && <PreviewChip icon="code-slash-outline" label={`${projCount} Projects`} />}
        {skillCount > 0 && <PreviewChip icon="hardware-chip-outline" label={`${skillCount} Skills`} />}
        {certCount > 0 && <PreviewChip icon="ribbon-outline" label={`${certCount} Certifications`} />}
      </View>

      {hasSummary && (
        <View style={[styles.summaryPreview, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Text style={[styles.summaryPreviewLabel, { color: theme.colors.textSecondary }]}>Summary Preview:</Text>
          <Text style={[styles.summaryPreviewText, { color: theme.colors.text }]} numberOfLines={3}>
            {importedData.personalInfo!.summary}
          </Text>
        </View>
      )}

      {/* Merge mode */}
      <Text style={[styles.mergeModeLabel, { color: theme.colors.textSecondary }]}>How to apply:</Text>
      <View style={styles.mergeModeRow}>
        {MERGE_MODES.map(m => {
          const isActive = mergeMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.mergeModeBtn,
                { borderColor: theme.colors.border },
                isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => setMergeMode(m.id)}
            >
              <Ionicons
                name={m.icon as any}
                size={14}
                color={isActive ? '#fff' : theme.colors.textSecondary}
              />
              <Text style={[styles.mergeModeBtnText, { color: isActive ? '#fff' : theme.colors.textSecondary }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.mergeModeDesc, { color: theme.colors.textSecondary }]}>
        {MERGE_MODES.find(m => m.id === mergeMode)?.desc}
      </Text>

      <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.applyBtnGradient}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.applyBtnText}>Apply to Resume</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
        <Text style={[styles.clearBtnText, { color: theme.colors.textSecondary }]}>← Try Different Import</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 180,
  },
  summaryPreview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryPreviewLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryPreviewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  mergeModeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  mergeModeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  mergeModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  mergeModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mergeModeDesc: {
    fontSize: 12,
    marginBottom: 16,
  },
  applyBtn: {
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  applyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 13,
  },
});
