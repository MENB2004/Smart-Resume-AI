import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Input } from '../Input';
import { Resume } from '../../types/resume';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  data: Resume['personalInfo'];
  onChange: (data: Resume['personalInfo']) => void;
}

export const PersonalInfoForm: React.FC<Props> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleChange = (field: keyof Resume['personalInfo'], value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Input
        label="Full Name"
        placeholder="Nived B"
        value={data.fullName}
        onChangeText={(text) => handleChange('fullName', text)}
      />
      <Input
        label="Professional Summary"
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
});
