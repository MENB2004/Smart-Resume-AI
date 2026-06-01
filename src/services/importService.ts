import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { ImportedResumeData, aiService } from './aiService';
import { Resume } from '../types/resume';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MergeMode = 'replace' | 'fill_empty' | 'merge';

export interface PickedDocument {
  name: string;
  mimeType: string;
  base64?: string;
  text?: string;
  uri: string;
}

// ─── File Picker ──────────────────────────────────────────────────────────────

/**
 * Opens the system document picker and returns the file contents.
 * Supports: PDF, TXT, JSON, CSV, DOCX (reads as text where possible).
 */
export async function pickAndReadDocument(): Promise<PickedDocument | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'text/plain',
        'application/json',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return null;

    const file = result.assets[0];
    const mimeType = file.mimeType ?? 'application/octet-stream';

    // On web: use fetch to read the file URI as text or base64
    if (Platform.OS === 'web') {
      const response = await fetch(file.uri);

      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        const text = await response.text();
        return { name: file.name, mimeType, text, uri: file.uri };
      } else {
        // PDF / image → base64 for Gemini vision
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        return { name: file.name, mimeType, base64, uri: file.uri };
      }
    }

    // Native (iOS / Android): use FileSystem to read
    const { default: FileSystem } = await import('expo-file-system');

    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      const text = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' });
      return { name: file.name, mimeType, text, uri: file.uri };
    } else {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      return { name: file.name, mimeType, base64, uri: file.uri };
    }
  } catch (err) {
    console.error('pickAndReadDocument error:', err);
    return null;
  }
}

/** Convert a Blob to a base64 string (web only) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── LinkedIn Export Parser ────────────────────────────────────────────────────

/**
 * Parses a LinkedIn data-export ZIP/JSON file.
 * LinkedIn lets you download your data from:
 *   Settings → Data Privacy → Get a copy of your data
 *
 * We support either:
 *   (a) A single JSON file (e.g. Profile.json, Positions.json…)
 *   (b) Pasted JSON text that is an array or object
 */
export async function parseLinkedInFile(doc: PickedDocument): Promise<ImportedResumeData> {
  // Try to parse the text as JSON
  const text = doc.text ?? '';
  if (!text) {
    throw new Error('Could not read LinkedIn export file. Please ensure it is a JSON file.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. Please upload a LinkedIn export JSON file (e.g. Profile.json).');
  }

  // Detect which LinkedIn export file this is based on filename / structure
  const name = doc.name.replace(/\.json$/i, '').replace(/_/g, ' ');
  const files: Record<string, any> = {};

  if (Array.isArray(parsed)) {
    // Single file export: guess by filename
    files[name] = parsed;
  } else if (typeof parsed === 'object') {
    // Could be an all-in-one export object, or a single profile object
    if (parsed.FirstName || parsed.LastName) {
      files['Profile'] = [parsed];
    } else {
      // Try each key as a file
      Object.assign(files, parsed);
    }
  }

  return aiService.parseLinkedInExport(files);
}

// ─── Merge Strategies ─────────────────────────────────────────────────────────

/**
 * Merges imported data into an existing resume according to the selected mode.
 * - replace: overwrite everything with imported data
 * - fill_empty: only fill in fields that are currently empty
 * - merge: combine lists (arrays), prefer imported scalar values
 */
export function mergeResumeData(
  base: Resume,
  imported: ImportedResumeData,
  mode: MergeMode
): Resume {
  const result: Resume = { ...base };

  if (mode === 'replace') {
    if (imported.personalInfo) {
      result.personalInfo = { ...base.personalInfo, ...filterNulls(imported.personalInfo) };
    }
    if (imported.targetRole) result.targetRole = imported.targetRole;
    if (imported.education?.length) result.education = imported.education;
    if (imported.experience?.length) result.experience = imported.experience;
    if (imported.skills?.length) result.skills = mergeSkillCategories(base.skills, imported.skills, 'replace');
    if (imported.projects?.length) result.projects = imported.projects;
    if (imported.certifications?.length) result.certifications = imported.certifications;
    if (imported.achievements?.length) result.achievements = imported.achievements;
    if (imported.languages?.length) result.languages = imported.languages;
  } else if (mode === 'fill_empty') {
    if (imported.personalInfo) {
      const pi = { ...base.personalInfo };
      for (const key of Object.keys(imported.personalInfo) as (keyof typeof imported.personalInfo)[]) {
        const importedVal = imported.personalInfo[key];
        if (!pi[key as keyof typeof pi] && importedVal) {
          (pi as any)[key] = importedVal;
        }
      }
      result.personalInfo = pi;
    }
    if (!result.targetRole && imported.targetRole) result.targetRole = imported.targetRole;
    if (!result.education?.length && imported.education?.length) result.education = imported.education;
    if (!result.experience?.length && imported.experience?.length) result.experience = imported.experience;
    if (imported.skills?.length) result.skills = mergeSkillCategories(base.skills, imported.skills, 'fill_empty');
    if (!result.projects?.length && imported.projects?.length) result.projects = imported.projects;
    if (!result.certifications?.length && imported.certifications?.length) result.certifications = imported.certifications;
    if ((!result.achievements?.length) && imported.achievements?.length) result.achievements = imported.achievements;
    if (!result.languages?.length && imported.languages?.length) result.languages = imported.languages;
  } else {
    // merge: combine arrays, fill scalars
    if (imported.personalInfo) {
      const pi = { ...base.personalInfo };
      for (const key of Object.keys(imported.personalInfo) as (keyof typeof imported.personalInfo)[]) {
        const importedVal = imported.personalInfo[key];
        if (!pi[key as keyof typeof pi] && importedVal) (pi as any)[key] = importedVal;
      }
      result.personalInfo = pi;
    }
    if (!result.targetRole && imported.targetRole) result.targetRole = imported.targetRole;
    result.education = deduplicateById([...base.education, ...(imported.education || [])]);
    result.experience = deduplicateById([...base.experience, ...(imported.experience || [])]);
    result.skills = mergeSkillCategories(base.skills, imported.skills || [], 'merge');
    result.projects = deduplicateById([...base.projects, ...(imported.projects || [])]);
    result.certifications = deduplicateById([...base.certifications, ...(imported.certifications || [])]);
    result.achievements = [...new Set([...base.achievements, ...(imported.achievements || [])])];
    result.languages = [...new Set([...base.languages, ...(imported.languages || [])])];
  }

  result.lastUpdated = new Date().toISOString().split('T')[0];
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterNulls(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''));
}

function deduplicateById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  let counter = 1;
  for (const item of arr) {
    const key = JSON.stringify({ ...item, id: '' });
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ ...item, id: String(counter++) });
    }
  }
  return out;
}

function mergeSkillCategories(
  base: Resume['skills'],
  imported: Resume['skills'],
  mode: MergeMode
): Resume['skills'] {
  const categories = ['Languages', 'Frameworks & Libraries', 'Tools & Platforms', 'Soft Skills'];
  return categories.map(cat => {
    const basecat = base.find(c => c.category === cat) ?? { category: cat, items: [] };
    const importedcat = imported.find(c => c.category === cat) ?? { category: cat, items: [] };
    if (mode === 'replace') return { category: cat, items: importedcat.items.length ? importedcat.items : basecat.items };
    if (mode === 'fill_empty') return { category: cat, items: basecat.items.length ? basecat.items : importedcat.items };
    // merge: combine unique
    return { category: cat, items: [...new Set([...basecat.items, ...importedcat.items])] };
  });
}
