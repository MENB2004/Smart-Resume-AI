import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Input } from '../Input';
import { Resume } from '../../types/resume';
import { useTheme } from '../../context/ThemeContext';
import { aiService } from '../../services/aiService';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  data: Resume['personalInfo'];
  targetRole?: string;
  level?: 'fresher' | 'experienced';
  onChange: (data: Resume['personalInfo']) => void;
  onChangeTargetRole: (role: string) => void;
}

export const PersonalInfoForm: React.FC<Props> = ({ data, targetRole, level, onChange, onChangeTargetRole }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [enhancing, setEnhancing] = useState(false);

  const handleChange = (field: keyof Resume['personalInfo'], value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleEnhanceSummary = async () => {
    if (!targetRole) {
      Alert.alert('Role Required', 'Please select or enter a target professional role first.');
      return;
    }
    setEnhancing(true);
    try {
      const enhanced = await aiService.enhanceSummary(data.summary || '', targetRole, level || 'fresher');
      handleChange('summary', enhanced);
      Alert.alert('✨ Summary Enhanced!', 'Your professional summary has been optimized for ATS.');
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Failed to enhance summary.');
    } finally {
      setEnhancing(false);
    }
  };

  const popularRoles = [
    'Frontend Developer',
    'Cybersecurity Engineer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Software Engineer'
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Input
        label="Target Professional Role"
        placeholder="e.g. Frontend Developer, Cybersecurity Engineer"
        value={targetRole || ''}
        onChangeText={onChangeTargetRole}
      />
      <View style={styles.roleContainer}>
        {popularRoles.map(role => (
          <TouchableOpacity 
            key={role} 
            onPress={() => onChangeTargetRole(role)}
            style={[
              styles.roleBadge,
              targetRole === role ? styles.roleBadgeActive : null
            ]}
          >
            <Text style={[
              styles.roleBadgeText,
              targetRole === role ? styles.roleBadgeTextActive : null
            ]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Full Name"
        placeholder="Nived B"
        value={data.fullName}
        onChangeText={(text) => handleChange('fullName', text)}
      />
      <View style={styles.summaryLabelRow}>
        <Text style={styles.label}>Professional Summary</Text>
        <TouchableOpacity
          style={styles.aiSummaryBtn}
          onPress={handleEnhanceSummary}
          disabled={enhancing}
        >
          {enhancing ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
              <Text style={styles.aiSummaryBtnText}>AI Enhance</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <Input
        placeholder="Enthusiastic Computer Science undergraduate..."
        value={data.summary}
        onChangeText={(text) => handleChange('summary', text)}
        multiline
        numberOfLines={4}
        containerStyle={{ height: 120 }}
      />
      <Input
        label="Email Address"
        placeholder="nb2004416@gmail.com"
        keyboardType="email-address"
        value={data.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <Input
        label="Phone Number"
        placeholder="+1 234 567 8900"
        keyboardType="phone-pad"
        value={data.phone}
        onChangeText={(text) => handleChange('phone', text)}
      />
      <Input
        label="Location"
        placeholder="San Francisco, CA"
        value={data.location}
        onChangeText={(text) => handleChange('location', text)}
      />
      <Input
        label="LinkedIn Profile URL"
        placeholder="https://linkedin.com/in/johndoe"
        value={data.linkedin}
        onChangeText={(text) => handleChange('linkedin', text)}
        autoCapitalize="none"
      />
      <Input
        label="GitHub Profile URL"
        placeholder="https://github.com/johndoe"
        value={data.github || ''}
        onChangeText={(text) => handleChange('github', text)}
        autoCapitalize="none"
      />
      <Input
        label="Portfolio / Website URL"
        placeholder="https://johndoe.com"
        value={data.portfolio}
        onChangeText={(text) => handleChange('portfolio', text)}
        autoCapitalize="none"
      />
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
  summaryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    width: '100%',
  },
  aiSummaryBtn: {
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
  aiSummaryBtnText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  roleBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  roleBadgeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  roleBadgeTextActive: {
    color: '#fff',
  }
});
