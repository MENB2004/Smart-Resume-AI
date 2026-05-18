import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { aiService } from '../services/aiService';
import { Resume } from '../types/resume';
import { useTheme } from '../context/ThemeContext';
import { ProgressChart } from 'react-native-chart-kit';

export const ATSAnalysis = ({ route, navigation }: any) => {
  const { resume } = route.params as { resume: Resume };
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [matching, setMatching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

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
  const scoreColorStr = scoreValue >= 80 ? '16, 185, 129' : scoreValue >= 50 ? '59, 130, 246' : '239, 68, 68';

  const chartData = {
    labels: ["ATS Score"], 
    data: [scoreValue / 100]
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: theme.colors.surface,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(${scoreColorStr}, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false 
  };

  const screenWidth = Dimensions.get('window').width;

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

      <View style={styles.scoreCard}>
        <ProgressChart
          data={chartData}
          width={screenWidth - 60}
          height={160}
          strokeWidth={16}
          radius={60}
          chartConfig={chartConfig}
          hideLegend={false}
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
        <Text style={styles.scoreTitle}>
          {result?.matchPercentage ? 'Job Match Score' : 'Overall ATS Score'}: {scoreValue}/100
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Missing Keywords</Text>
        <View style={styles.badgeContainer}>
          {result?.missingKeywords.map((keyword: string, index: number) => (
            <View key={index} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Suggestions</Text>
        {result?.suggestions.map((suggestion: string, index: number) => (
          <View key={index} style={styles.suggestionItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

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
        <Button 
          title="Match Job Description" 
          onPress={handleMatchJob} 
          isLoading={matching}
        />
      </View>

      <Button 
        title="Back to Dashboard" 
        onPress={() => navigation.navigate('Dashboard')} 
        variant="outline"
        style={styles.backButton}
      />
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing(3),
    paddingTop: theme.spacing(6),
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: theme.colors.secondary,
    borderWidth: 1,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  keywordText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.caption,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing(1),
  },
  bullet: {
    color: theme.colors.primary,
    marginRight: theme.spacing(1),
    fontSize: theme.typography.sizes.body,
  },
  suggestionText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body,
    flex: 1,
    lineHeight: 22,
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
  }
});
