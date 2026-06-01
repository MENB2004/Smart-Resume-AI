import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { aiService } from '../services/aiService';
import { Resume } from '../types/resume';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart } from 'react-native-chart-kit';

export const ATSAnalysis = ({ route, navigation }: any) => {
  const { resume } = route.params as { resume: Resume };
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [matching, setMatching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const { isDesktop, isWeb, windowWidth } = useResponsive();
  const styles = getStyles(theme, isDesktop, isWeb);

  useEffect(() => {
    analyzeBaseResume();
  }, []);

  const analyzeBaseResume = async () => {
    setLoading(true);
    try {
      const analysis = await aiService.analyzeResume(resume);
      setResult(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const analysis = await aiService.analyzeResume(resume);
      setResult(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, [resume]);

  const handleMatchJob = async () => {
    if (!jobDescription) return;
    setMatching(true);
    try {
      const matchResult = await aiService.matchJobDescription(resume, jobDescription);
      setResult(matchResult);
    } catch (error) {
      console.error(error);
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing Resume against ATS criteria...</Text>
      </View>
    );
  }

  const scoreValue = result?.score || 0;
  const scoreColorStr =
    scoreValue >= 80 ? '16, 185, 129' : scoreValue >= 50 ? '59, 130, 246' : '239, 68, 68';

  const chartData = {
    labels: ['ATS Score'],
    data: [scoreValue / 100],
  };

  // Responsive chart width: cap at 420 on web, use window width minus padding on mobile
  const chartWidth = isDesktop
    ? Math.min(windowWidth * 0.35, 360)
    : Math.min(windowWidth - 60, 400);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: theme.colors.surface,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(${scoreColorStr}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const ScoreCard = () => (
    <View style={styles.scoreCard}>
      <ProgressChart
        data={chartData}
        width={chartWidth}
        height={160}
        strokeWidth={16}
        radius={60}
        chartConfig={chartConfig}
        hideLegend={false}
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
      <Text style={styles.scoreTitle}>
        {result?.matchPercentage ? 'Job Match Score' : 'Overall ATS Score'}: {scoreValue}/100
      </Text>
    </View>
  );

  const ChecklistSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ATS Verification Checklist</Text>
      {result?.suggestions.map((suggestion: string, index: number) => {
        const isPassed = suggestion.startsWith('✓');
        const cleanText = isPassed ? suggestion.substring(2) : suggestion;
        return (
          <View
            key={index}
            style={[
              styles.suggestionItem,
              isPassed ? styles.suggestionPassed : styles.suggestionFailed,
            ]}
          >
            <Text style={[styles.bullet, { color: isPassed ? '#10b981' : '#f59e0b' }]}>
              {isPassed ? '✓' : '⚠️'}
            </Text>
            <Text style={[styles.suggestionText, isPassed && { color: theme.colors.textSecondary }]}>
              {cleanText}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const KeywordsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Missing Role-Specific Keywords</Text>
      {result?.missingKeywords.length === 0 ? (
        <Text style={styles.passedText}>
          🎉 Perfect! Your resume contains all target keywords recommended for a{' '}
          {resume.targetRole || 'Software Engineer'}.
        </Text>
      ) : (
        <View style={styles.badgeContainer}>
          {result?.missingKeywords.map((keyword: string, index: number) => (
            <View key={index} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const JobMatchSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Job Description Matcher</Text>
      <Text style={styles.infoText}>
        Paste a job description below to see how well your resume matches the requirements.
      </Text>
      <Input
        placeholder="Paste job description here..."
        value={jobDescription}
        onChangeText={setJobDescription}
        multiline
        numberOfLines={4}
        containerStyle={{ height: 120 }}
      />
      <Button title="Match Job Description" onPress={handleMatchJob} isLoading={matching} />
    </View>
  );

  // Desktop: two-column layout
  if (isDesktop && isWeb) {
    return (
      <View style={styles.desktopContainer}>
        {/* Left column: score + job matcher */}
        <View style={styles.desktopLeft}>
          <View style={styles.desktopHeader}>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
              <Text style={styles.backBtnText}>Dashboard</Text>
            </TouchableOpacity>
            <Text style={styles.title}>ATS Analysis</Text>
            <Text style={styles.subtitle}>For: {resume.title}</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: theme.spacing(3), paddingBottom: 60 }}>
            <ScoreCard />
            <View style={styles.divider} />
            <JobMatchSection />
          </ScrollView>
        </View>

        {/* Right column: keywords + checklist */}
        <View style={styles.desktopRight}>
          <ScrollView contentContainerStyle={{ padding: theme.spacing(3), paddingBottom: 60 }}>
            <KeywordsSection />
            <View style={styles.divider} />
            <ChecklistSection />
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>ATS Analysis</Text>
        <Text style={styles.subtitle}>For: {resume.title}</Text>
      </View>

      <ScoreCard />
      <KeywordsSection />
      <View style={styles.divider} />
      <ChecklistSection />
      <View style={styles.divider} />
      <JobMatchSection />

      <Button
        title="Back to Dashboard"
        onPress={() => navigation.navigate('Dashboard')}
        variant="outline"
        style={styles.backButton}
      />
    </ScrollView>
  );
};

const getStyles = (theme: any, isDesktop: boolean, isWeb: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing(3),
      paddingTop: isWeb ? theme.spacing(3) : theme.spacing(6),
    },
    centerContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing(2),
      fontSize: theme.typography.sizes.body,
    },
    header: {
      marginBottom: theme.spacing(4),
    },
    title: {
      fontSize: theme.typography.sizes.h1,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
    },
    scoreCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing(2),
      alignItems: 'center',
      marginBottom: theme.spacing(4),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    scoreTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.h3,
      fontWeight: '600',
      marginTop: theme.spacing(2),
    },
    section: {
      marginBottom: theme.spacing(4),
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginBottom: theme.spacing(2),
    },
    badgeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    keywordBadge: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      borderWidth: 1,
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(0.8),
      borderRadius: theme.borderRadius.round,
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    keywordText: {
      color: '#ef4444',
      fontSize: theme.typography.sizes.caption,
      fontWeight: '600',
    },
    passedText: {
      color: '#10b981',
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    suggestionItem: {
      flexDirection: 'row',
      padding: theme.spacing(1.5),
      borderRadius: theme.borderRadius.small,
      marginBottom: theme.spacing(1),
      borderWidth: 1,
      alignItems: 'center',
    },
    suggestionPassed: {
      backgroundColor: 'rgba(16, 185, 129, 0.03)',
      borderColor: 'rgba(16, 185, 129, 0.15)',
    },
    suggestionFailed: {
      backgroundColor: 'rgba(245, 158, 11, 0.03)',
      borderColor: 'rgba(245, 158, 11, 0.15)',
    },
    bullet: {
      marginRight: theme.spacing(1.5),
      fontSize: 16,
      fontWeight: 'bold',
    },
    suggestionText: {
      color: theme.colors.text,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing(4),
    },
    infoText: {
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing(2),
      fontSize: theme.typography.sizes.caption,
    },
    backButton: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(4),
    },

    // Desktop
    desktopContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    desktopLeft: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    desktopRight: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    desktopHeader: {
      padding: theme.spacing(3),
      paddingTop: theme.spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
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
  });
