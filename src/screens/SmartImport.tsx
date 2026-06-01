import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { aiService, ImportedResumeData } from '../services/aiService';
import { pickAndReadDocument, parseLinkedInFile, mergeResumeData, MergeMode } from '../services/importService';
import { Resume } from '../types/resume';
import { ImportPreviewCard } from '../components/ImportPreviewCard';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'paste',
    label: 'Paste Text',
    icon: 'clipboard-outline' as const,
    iconActive: 'clipboard' as const,
    description: 'Paste your LinkedIn About section, old CV text, bio, or any paragraph',
    placeholder: `Paste any text here — LinkedIn profile, CV copy, bio, job description…

Example:
John Smith | Full Stack Developer
Email: john@email.com | London, UK
github.com/johnsmith | linkedin.com/in/johnsmith

About
Passionate software engineer with 3 years experience in React and Node.js...

Experience
Senior Frontend Developer – Acme Corp (Jan 2022 – Present)
...`,
  },
  {
    id: 'document',
    label: 'Upload File',
    icon: 'document-outline' as const,
    iconActive: 'document' as const,
    description: 'Upload a PDF certificate, existing resume, award letter, or any document',
    placeholder: '',
  },
  {
    id: 'role',
    label: 'Job Preference',
    icon: 'briefcase-outline' as const,
    iconActive: 'briefcase' as const,
    description: 'Enter your target role and get AI-generated summary, skills, and keywords',
    placeholder: '',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Export',
    icon: 'link-outline' as const,
    iconActive: 'link' as const,
    description: 'Upload your LinkedIn data export (Settings → Data Privacy → Get a copy of your data)',
    placeholder: '',
  },
];

const MERGE_MODES: { id: MergeMode; label: string; desc: string; icon: string }[] = [
  { id: 'fill_empty', label: 'Fill Empty Fields', desc: 'Only fill fields you haven\'t set yet', icon: 'add-circle-outline' },
  { id: 'merge', label: 'Smart Merge', desc: 'Combine imported & existing data', icon: 'git-merge-outline' },
  { id: 'replace', label: 'Replace All', desc: 'Overwrite everything with imported data', icon: 'refresh-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SmartImport = ({ route, navigation }: any) => {
  const { resume, onImportCallback } = route.params as {
    resume: Resume;
    onImportCallback?: (updated: Resume) => void;
  };

  const { theme, isDarkMode } = useTheme();
  const { isDesktop, isWeb } = useResponsive();
  const styles = getStyles(theme, isDesktop, isWeb);

  const [activeTab, setActiveTab] = useState(0);
  const [pasteText, setPasteText] = useState('');
  const [targetRole, setTargetRole] = useState(resume.targetRole || '');
  const [level, setLevel] = useState<'fresher' | 'experienced'>(resume.level || 'fresher');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing…');
  const [pickedFileName, setPickedFileName] = useState('');
  const [linkedinFileName, setLinkedinFileName] = useState('');
  const [importedData, setImportedData] = useState<ImportedResumeData | null>(null);
  const [mergeMode, setMergeMode] = useState<MergeMode>('fill_empty');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const isGeminiAvailable = !!(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePasteImport = async () => {
    if (!pasteText.trim()) { Alert.alert('Empty', 'Please paste some text first.'); return; }
    setLoading(true); setLoadingMsg('Analysing with Gemini AI…');
    try {
      const data = await aiService.parseTextToResume(pasteText, resume);
      setImportedData(data);
    } catch (e: any) {
      if (e.message === 'GEMINI_API_KEY_MISSING') { setApiKeyMissing(true); } 
      else { Alert.alert('Error', e.message || 'Failed to parse text.'); }
    } finally { setLoading(false); }
  };

  const handleDocumentImport = async () => {
    setLoading(true); setLoadingMsg('Picking document…');
    try {
      const doc = await pickAndReadDocument();
      if (!doc) { setLoading(false); return; }
      setPickedFileName(doc.name);
      setLoadingMsg('Reading document with Gemini AI vision…');
      let data: ImportedResumeData;
      if (doc.text) {
        // Text-based file: use text parser
        data = await aiService.parseTextToResume(doc.text, resume);
      } else if (doc.base64) {
        // Binary file: use vision API
        data = await aiService.parseDocumentToResume(doc.base64, doc.mimeType);
      } else {
        throw new Error('Could not read file content.');
      }
      setImportedData(data);
    } catch (e: any) {
      if (e.message === 'GEMINI_API_KEY_MISSING') { setApiKeyMissing(true); }
      else { Alert.alert('Error', e.message || 'Failed to process document.'); }
    } finally { setLoading(false); }
  };

  const handleRoleAutoFill = async () => {
    if (!targetRole.trim()) { Alert.alert('Required', 'Please enter a target role.'); return; }
    setLoading(true); setLoadingMsg('Generating role-based profile with Gemini AI…');
    try {
      const result = await aiService.autoFillFromRole(targetRole.trim(), level);
      const data: ImportedResumeData = {
        personalInfo: { summary: result.summary },
        targetRole: targetRole.trim(),
        skills: result.skills,
      };
      setImportedData(data);
    } catch (e: any) {
      if (e.message === 'GEMINI_API_KEY_MISSING') { setApiKeyMissing(true); }
      else { Alert.alert('Error', e.message || 'Failed to generate profile.'); }
    } finally { setLoading(false); }
  };

  const handleLinkedInImport = async () => {
    setLoading(true); setLoadingMsg('Picking LinkedIn export file…');
    try {
      const doc = await pickAndReadDocument();
      if (!doc) { setLoading(false); return; }
      setLinkedinFileName(doc.name);
      setLoadingMsg('Parsing LinkedIn data…');
      const data = await parseLinkedInFile(doc);
      setImportedData(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to parse LinkedIn export.');
    } finally { setLoading(false); }
  };

  const handleApply = () => {
    if (!importedData) return;
    const merged = mergeResumeData(resume, importedData, mergeMode);
    if (onImportCallback) {
      onImportCallback(merged);
    }
    navigation.goBack();
    Alert.alert('✅ Applied!', 'Your resume has been updated with the imported data.');
  };

  // ── Subcomponents ────────────────────────────────────────────────────────────

  const ApiKeyWarning = () => (
    <View style={styles.warningCard}>
      <Ionicons name="warning-outline" size={24} color={theme.colors.error} />
      <Text style={styles.warningTitle}>Gemini API Key Not Found</Text>
      <Text style={styles.warningText}>
        Add your free API key to the <Text style={styles.code}>.env</Text> file:
      </Text>
      <View style={styles.codeBlock}>
        <Text style={styles.codeText}>EXPO_PUBLIC_GEMINI_API_KEY=your_key</Text>
      </View>
      <Text style={styles.warningText}>
        Get a free key at: aistudio.google.com/app/apikey
      </Text>
    </View>
  );

  const renderPreview = () => {
    if (!importedData) return null;
    return (
      <ImportPreviewCard
        importedData={importedData}
        mergeMode={mergeMode}
        setMergeMode={setMergeMode}
        handleApply={handleApply}
        onClear={() => setImportedData(null)}
      />
    );
  };

  // ── Tab content renderers ────────────────────────────────────────────────────

  const renderPasteTab = () => (
    <View>
      {!importedData && (
        <>
          <TextInput
            style={styles.pasteInput}
            multiline
            placeholder={TABS[0].placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={pasteText}
            onChangeText={setPasteText}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.importBtn, !pasteText.trim() && styles.importBtnDisabled]}
            onPress={handlePasteImport}
            disabled={!pasteText.trim() || loading}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.importBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color="#fff" />
              )}
              <Text style={styles.importBtnText}>
                {loading ? loadingMsg : 'Parse with Gemini AI'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
      {renderPreview()}
    </View>
  );

  const renderDocumentTab = () => (
    <View>
      {!importedData && (
        <>
          <View style={styles.uploadZone}>
            <LinearGradient
              colors={[`${theme.colors.primary}10`, `${theme.colors.primary}05`]}
              style={styles.uploadZoneInner}
            >
              <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.uploadTitle}>
                {pickedFileName || 'Tap to select a file'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                PDF • TXT • JSON • DOCX • JPG • PNG
              </Text>
              <Text style={styles.uploadHint}>
                Works with: existing CVs, certificates, award letters, transcripts, LinkedIn exports
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.importBtn} onPress={handleDocumentImport} disabled={loading}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.importBtnGradient}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="document-outline" size={16} color="#fff" />}
              <Text style={styles.importBtnText}>{loading ? loadingMsg : 'Pick & Extract Document'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: 'bold' }}>Tip for PDFs:</Text> Gemini AI reads the document visually — it works even on scanned certificates!
            </Text>
          </View>
        </>
      )}
      {renderPreview()}
    </View>
  );

  const renderRoleTab = () => (
    <View>
      {!importedData && (
        <>
          <View style={styles.roleCard}>
            <Text style={styles.fieldLabel}>Target Role *</Text>
            <TextInput
              style={styles.roleInput}
              placeholder="e.g. Frontend Developer, Data Scientist, DevOps Engineer…"
              placeholderTextColor={theme.colors.textSecondary}
              value={targetRole}
              onChangeText={setTargetRole}
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Experience Level</Text>
            <View style={styles.levelRow}>
              {(['fresher', 'experienced'] as const).map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                  onPress={() => setLevel(l)}
                >
                  <Text style={[styles.levelBtnText, level === l && styles.levelBtnTextActive]}>
                    {l === 'fresher' ? '🎓 Entry Level' : '💼 Experienced'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.featuresRow}>
              {['Professional Summary', 'Skill Suggestions', 'ATS Keywords'].map(f => (
                <View key={f} style={styles.featureChip}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                  <Text style={styles.featureChipText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.importBtn, !targetRole.trim() && styles.importBtnDisabled]}
            onPress={handleRoleAutoFill}
            disabled={!targetRole.trim() || loading}
          >
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.importBtnGradient}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="sparkles-outline" size={16} color="#fff" />}
              <Text style={styles.importBtnText}>{loading ? loadingMsg : '✨ Auto-Generate Profile'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
      {renderPreview()}
    </View>
  );

  const renderLinkedInTab = () => (
    <View>
      {!importedData && (
        <>
          <View style={styles.linkedinGuide}>
            <Text style={styles.guideTitle}>How to export LinkedIn data:</Text>
            {[
              'Go to linkedin.com → Settings & Privacy',
              'Click "Data Privacy" → "Get a copy of your data"',
              'Select: Profile, Positions, Education, Skills, Certifications',
              'Download and extract the ZIP',
              'Upload any of the JSON files here (Profile.json, Positions.json…)',
            ].map((step, i) => (
              <View key={i} style={styles.guideStep}>
                <View style={styles.guideStepNum}>
                  <Text style={styles.guideStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.guideStepText}>{step}</Text>
              </View>
            ))}
          </View>

          {linkedinFileName ? (
            <View style={styles.filePickedRow}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.success} />
              <Text style={styles.filePickedText}>{linkedinFileName}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.importBtn} onPress={handleLinkedInImport} disabled={loading}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.importBtnGradient}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="link-outline" size={16} color="#fff" />}
              <Text style={styles.importBtnText}>{loading ? loadingMsg : 'Upload LinkedIn Export JSON'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.tipText}>
              LinkedIn's export takes up to 24h. For immediate import, use the{' '}
              <Text
                style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                onPress={() => setActiveTab(0)}
              >
                Paste Text
              </Text>{' '}
              tab with your LinkedIn profile text.
            </Text>
          </View>
        </>
      )}
      {renderPreview()}
    </View>
  );

  const tabRenderers = [renderPasteTab, renderDocumentTab, renderRoleTab, renderLinkedInTab];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backBtnText}>Resume Builder</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Smart Import</Text>
          <Text style={styles.subtitle}>
            Auto-fill your resume from LinkedIn, documents, or by your job preference
          </Text>
        </View>

        {/* API Key Warning */}
        {(apiKeyMissing || !isGeminiAvailable) && <ApiKeyWarning />}

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === index && styles.tabActive]}
              onPress={() => { setActiveTab(index); setImportedData(null); }}
            >
              <Ionicons
                name={activeTab === index ? tab.iconActive : tab.icon}
                size={16}
                color={activeTab === index ? '#fff' : theme.colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab description */}
        <View style={styles.tabDesc}>
          <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.tabDescText}>{TABS[activeTab].description}</Text>
        </View>

        {/* Active tab content */}
        <View style={styles.tabContent}>
          {tabRenderers[activeTab]()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: any, isDesktop: boolean, isWeb: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: {
      padding: theme.spacing(3),
      paddingTop: isWeb ? theme.spacing(3) : theme.spacing(6),
      paddingBottom: theme.spacing(8),
      maxWidth: isDesktop ? 760 : undefined,
      alignSelf: isDesktop ? 'center' : undefined,
      width: isDesktop ? '100%' : undefined,
    },

    // Header
    header: { alignItems: 'center', marginBottom: theme.spacing(3) },
    backBtn: {
      flexDirection: 'row', alignItems: 'center',
      alignSelf: 'flex-start', marginBottom: theme.spacing(2),
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    backBtnText: { color: theme.colors.primary, marginLeft: 4, fontSize: 13, fontWeight: '600' },
    headerIcon: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: theme.spacing(1.5), ...theme.shadows.medium,
    },
    title: {
      fontSize: theme.typography.sizes.h1, fontWeight: 'bold',
      color: theme.colors.text, fontFamily: theme.typography.fonts.bold,
    },
    subtitle: {
      fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary,
      textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: theme.spacing(2),
    },

    // API warning
    warningCard: {
      backgroundColor: `${theme.colors.error}12`, borderWidth: 1,
      borderColor: `${theme.colors.error}40`, borderRadius: theme.borderRadius.medium,
      padding: theme.spacing(2.5), marginBottom: theme.spacing(2), alignItems: 'center', gap: 8,
    },
    warningTitle: { color: theme.colors.error, fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
    warningText: { color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center' },
    code: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: theme.colors.primary },
    codeBlock: {
      backgroundColor: theme.colors.surface, borderRadius: 6,
      padding: theme.spacing(1.5), width: '100%', marginVertical: 4,
    },
    codeText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: theme.colors.accent, fontSize: 12,
    },

    // Tab bar
    tabBar: { marginBottom: 0 },
    tabBarContent: { gap: 8, paddingBottom: 4 },
    tab: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: theme.spacing(1.2), paddingHorizontal: theme.spacing(2),
      borderRadius: theme.borderRadius.round, gap: 6,
      backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
    tabTextActive: { color: '#fff', fontWeight: '700' },

    tabDesc: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 6,
      marginTop: theme.spacing(1.5), marginBottom: theme.spacing(2),
    },
    tabDescText: { color: theme.colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

    tabContent: {},

    // Paste tab
    pasteInput: {
      backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium, color: theme.colors.text,
      fontSize: 13, lineHeight: 20, padding: theme.spacing(2),
      minHeight: 220, fontFamily: theme.typography.fonts.regular,
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },

    // Upload tab
    uploadZone: {
      borderRadius: theme.borderRadius.large, overflow: 'hidden',
      borderWidth: 2, borderColor: `${theme.colors.primary}40`,
      borderStyle: 'dashed', marginBottom: theme.spacing(2),
    },
    uploadZoneInner: {
      padding: theme.spacing(4), alignItems: 'center', gap: 8,
    },
    uploadTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
    uploadSubtitle: { color: theme.colors.textSecondary, fontSize: 13 },
    uploadHint: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 },

    // Role tab
    roleCard: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing(3),
      marginBottom: theme.spacing(2),
    },
    fieldLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
    roleInput: {
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.small,
      color: theme.colors.text, fontSize: 15, padding: theme.spacing(1.5),
      backgroundColor: 'rgba(255,255,255,0.03)',
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },
    levelRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    levelBtn: {
      flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.small,
      borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
      backgroundColor: 'transparent',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    levelBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    levelBtnText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    levelBtnTextActive: { color: '#fff' },
    featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing(2) },
    featureChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: `${theme.colors.success}10`,
      borderRadius: theme.borderRadius.round, paddingHorizontal: 10, paddingVertical: 4,
    },
    featureChipText: { color: theme.colors.success, fontSize: 12, fontWeight: '600' },

    // LinkedIn tab
    linkedinGuide: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing(2.5),
      marginBottom: theme.spacing(2),
    },
    guideTitle: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: theme.spacing(1.5) },
    guideStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    guideStepNum: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    guideStepNumText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    guideStepText: { color: theme.colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

    filePickedRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: `${theme.colors.success}10`, borderRadius: theme.borderRadius.small,
      padding: theme.spacing(1.5), marginBottom: theme.spacing(1.5),
    },
    filePickedText: { color: theme.colors.success, fontSize: 13, fontWeight: '600', flex: 1 },

    // Import button
    importBtn: { borderRadius: theme.borderRadius.small, overflow: 'hidden', marginVertical: theme.spacing(1.5) },
    importBtnDisabled: { opacity: 0.5 },
    importBtnGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: theme.spacing(1.8), paddingHorizontal: theme.spacing(3),
    },
    importBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // Tip
    tipCard: {
      flexDirection: 'row', gap: 8, backgroundColor: `${theme.colors.primary}08`,
      borderRadius: theme.borderRadius.small, padding: theme.spacing(1.5),
      borderWidth: 1, borderColor: `${theme.colors.primary}20`,
    },
    tipText: { color: theme.colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },


  });
