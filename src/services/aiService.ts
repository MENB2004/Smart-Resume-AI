import { Resume } from '../types/resume';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ATSAnalysisResult {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  matchPercentage?: number;
}

export interface ImportedResumeData {
  personalInfo?: Partial<Resume['personalInfo']>;
  education?: Resume['education'];
  experience?: Resume['experience'];
  skills?: Resume['skills'];
  projects?: Resume['projects'];
  certifications?: Resume['certifications'];
  achievements?: string[];
  languages?: string[];
  targetRole?: string;
  summary?: string;
}

// ─── Gemini API helper ─────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(prompt: string, imageBase64?: string, mimeType?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.unshift({ inlineData: { mimeType, data: imageBase64 } });
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    // Strip markdown code fences if present
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

// ─── Role keyword DB (used as fallback when Gemini unavailable) ───────────────

const ROLE_KEYWORDS: Record<string, string[]> = {
  'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'APIs', 'Responsive Design', 'Git', 'REST'],
  'Cybersecurity Engineer': ['Network Security', 'Vulnerability Assessment', 'Penetration Testing', 'SIEM', 'SOC', 'Linux', 'Cryptography', 'Firewalls'],
  'Backend Developer': ['Node.js', 'SQL', 'APIs', 'Docker', 'Git', 'REST', 'Express', 'PostgreSQL', 'MongoDB', 'Database Design'],
  'Full Stack Developer': ['React', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'Git', 'APIs', 'REST', 'HTML', 'CSS'],
  'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'Pandas', 'NumPy', 'Statistics', 'TensorFlow', 'Data Visualization'],
  'Software Engineer': ['Python', 'Java', 'C++', 'DSA', 'SQL', 'Git', 'Object-Oriented Programming', 'Algorithms', 'Software Architecture'],
};
const DEFAULT_KEYWORDS = ['Python', 'React', 'SQL', 'DSA', 'Machine Learning', 'APIs', 'Git', 'Problem-Solving'];

// ─── Service ───────────────────────────────────────────────────────────────────

export const aiService = {

  // ── Existing rule-based ATS analyser (kept as-is) ─────────────────────────

  async analyzeResume(resume: Resume): Promise<ATSAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const role = resume.targetRole || 'Software Engineer';
    const targetKeywords = ROLE_KEYWORDS[role] || DEFAULT_KEYWORDS;

    let flatText = `${resume.personalInfo.fullName || ''} ${resume.personalInfo.summary || ''}`;
    resume.skills.forEach(c => { flatText += ` ${c.category} ${c.items.join(' ')}`; });
    resume.experience.forEach(e => { flatText += ` ${e.role} ${e.company} ${e.description}`; });
    resume.projects.forEach(p => {
      flatText += ` ${p.title} ${p.description} ${p.techStack || ''} ${p.technologies || ''} ${p.impact || ''}`;
      if (p.bullets) flatText += ` ${p.bullets.join(' ')}`;
    });
    if (resume.achievements) flatText += ` ${resume.achievements.join(' ')}`;
    if (resume.coursework) flatText += ` ${resume.coursework.join(' ')}`;

    const flatLower = flatText.toLowerCase();
    const missingKeywords = targetKeywords.filter(kw => !flatLower.includes(kw.toLowerCase()));

    let score = 100;
    const suggestions: string[] = [];

    if (missingKeywords.length > 0) {
      score -= Math.min(30, missingKeywords.length * 5);
      suggestions.push(`Add missing role-specific keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
    } else {
      suggestions.push(`✓ Your resume includes all primary keywords for a ${role}.`);
    }
    if (!resume.personalInfo.summary || resume.personalInfo.summary.length < 30) {
      score -= 10;
      suggestions.push('Add or expand your Professional Summary.');
    } else { suggestions.push('✓ Professional Summary looks comprehensive.'); }
    const projectsWithoutTech = resume.projects.filter(p => !p.techStack && !p.technologies);
    if (projectsWithoutTech.length > 0) { score -= 10; suggestions.push('Add technology tags to all projects.'); }
    else if (resume.projects.length > 0) { suggestions.push('✓ Projects include technology stacks.'); }
    const hasBullets = resume.projects.some(p => p.bullets && p.bullets.length > 0);
    if (!hasBullets && resume.projects.length > 0) { score -= 10; suggestions.push('Use AI Bullet Points to create action-verb bullets.'); }
    else if (resume.projects.length > 0) { suggestions.push('✓ Format complies with action-verb ATS standards.'); }
    if (resume.level === 'experienced' && resume.experience.length === 0) { score -= 15; suggestions.push('Add at least one work experience entry.'); }
    if (!resume.achievements || resume.achievements.length === 0) { score -= 5; suggestions.push('Add professional achievements to stand out.'); }

    return { score: Math.max(35, Math.min(100, score)), missingKeywords, suggestions };
  },

  async matchJobDescription(resume: Resume, jobDescription: string): Promise<ATSAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 600));
    if (!jobDescription) return { score: 0, missingKeywords: [], suggestions: ['Please paste a job description first.'] };

    const jdWords = jobDescription.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/);
    const commonKeywords = ['react','node','javascript','typescript','python','java','sql','docker','kubernetes','aws','cloud','git','apis','rest','agile','scrum','cybersecurity','security','penetration','linux','networks','dsa','algorithms','machine learning','nlp','data science'];
    const jdKeywords = commonKeywords.filter(kw => jdWords.includes(kw) || jobDescription.toLowerCase().includes(kw));

    let resumeText = `${resume.personalInfo.summary || ''}`;
    resume.skills.forEach(c => { resumeText += ` ${c.items.join(' ')}`; });
    resume.projects.forEach(p => { resumeText += ` ${p.title} ${p.techStack} ${p.description}`; });
    resume.experience.forEach(e => { resumeText += ` ${e.role} ${e.description}`; });
    const resumeLower = resumeText.toLowerCase();

    const missingKeywords = jdKeywords
      .filter(kw => !resumeLower.includes(kw))
      .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1));

    const matchCount = jdKeywords.length - missingKeywords.length;
    const matchPercentage = jdKeywords.length > 0 ? Math.round((matchCount / jdKeywords.length) * 100) : 50;
    const suggestions = missingKeywords.length > 0
      ? [`Add JD-specific keywords: ${missingKeywords.slice(0, 4).join(', ')}.`]
      : ['✓ Perfect match! Your resume contains all keywords from the job description.'];

    return { score: matchPercentage, matchPercentage, missingKeywords, suggestions };
  },

  // ── NEW: Parse any freeform text into structured resume data ──────────────

  async parseTextToResume(text: string, existingResume?: Partial<Resume>): Promise<ImportedResumeData> {
    const prompt = `
You are a professional resume parser. Extract structured resume data from the following text.
The text may be a LinkedIn profile, a bio, an old CV, a job application, a certificate, or any combination.

Return ONLY valid JSON matching this exact schema (use null for missing fields, empty arrays for missing lists):
{
  "personalInfo": {
    "fullName": string | null,
    "email": string | null,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "github": string | null,
    "portfolio": string | null,
    "summary": string | null
  },
  "targetRole": string | null,
  "education": [{ "id": "1", "degree": string, "institution": string, "year": string, "cgpa": string | null }],
  "experience": [{ "id": "1", "role": string, "company": string, "duration": string, "description": string }],
  "skills": [
    { "category": "Languages", "items": [string] },
    { "category": "Frameworks & Libraries", "items": [string] },
    { "category": "Tools & Platforms", "items": [string] },
    { "category": "Soft Skills", "items": [string] }
  ],
  "projects": [{ "id": "1", "title": string, "description": string, "techStack": string, "impact": string | null, "bullets": [] }],
  "certifications": [{ "id": "1", "name": string }],
  "achievements": [string],
  "languages": [string]
}

Rules:
- Generate sequential IDs ("1", "2", "3"…) for array items
- For skills, categorise intelligently (programming languages → Languages, React/Node → Frameworks, Git/Docker → Tools)
- Write the summary in first person, professional tone, 2-3 sentences
- If the text mentions a target role or job title, put it in targetRole
- Only extract what is clearly present in the text, do not invent data

TEXT TO PARSE:
${text.slice(0, 8000)}
`;
    const raw = await callGemini(prompt);
    return safeParseJSON<ImportedResumeData>(raw, {});
  },

  // ── NEW: Parse a document (base64 PDF / image) via Gemini vision ──────────

  async parseDocumentToResume(base64: string, mimeType: string): Promise<ImportedResumeData> {
    const prompt = `
You are a professional resume and document parser. 
Examine this document carefully. It may be a CV, certificate, award letter, transcript, or LinkedIn export.
Extract all resume-relevant information and return ONLY valid JSON with this schema:
{
  "personalInfo": { "fullName": null, "email": null, "phone": null, "location": null, "linkedin": null, "github": null, "portfolio": null, "summary": null },
  "targetRole": null,
  "education": [],
  "experience": [],
  "skills": [
    { "category": "Languages", "items": [] },
    { "category": "Frameworks & Libraries", "items": [] },
    { "category": "Tools & Platforms", "items": [] },
    { "category": "Soft Skills", "items": [] }
  ],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "languages": []
}
Generate sequential string IDs ("1","2","3"…) for array items.
For certificates: put the certificate name in certifications array.
For transcripts: put courses in education.coursework and the degree+institution in education.
Only extract what is visible, do not invent data.
`;
    const raw = await callGemini(prompt, base64, mimeType);
    return safeParseJSON<ImportedResumeData>(raw, {});
  },

  // ── NEW: Auto-fill from target role ───────────────────────────────────────

  async autoFillFromRole(targetRole: string, level: 'fresher' | 'experienced'): Promise<{
    summary: string;
    skills: Resume['skills'];
    suggestedKeywords: string[];
  }> {
    const prompt = `
You are a professional career coach and resume writer.
Generate a professional resume starter for:
- Target Role: ${targetRole}
- Experience Level: ${level === 'fresher' ? 'Entry Level / Fresher (0-1 years)' : 'Experienced Professional (2+ years)'}

Return ONLY valid JSON:
{
  "summary": "A compelling 2-3 sentence professional summary in first person, tailored for ATS, mentioning the role and key value proposition",
  "skills": [
    { "category": "Languages", "items": ["list", "of", "relevant", "programming", "languages"] },
    { "category": "Frameworks & Libraries", "items": ["relevant", "frameworks"] },
    { "category": "Tools & Platforms", "items": ["relevant", "tools", "and", "platforms"] },
    { "category": "Soft Skills", "items": ["Communication", "Problem Solving", "Team Collaboration"] }
  ],
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

Skills should be specific and ATS-relevant for a ${targetRole}.
`;
    const raw = await callGemini(prompt);
    return safeParseJSON(raw, {
      summary: '',
      skills: [
        { category: 'Languages', items: [] },
        { category: 'Frameworks & Libraries', items: [] },
        { category: 'Tools & Platforms', items: [] },
        { category: 'Soft Skills', items: [] },
      ],
      suggestedKeywords: [],
    });
  },

  // ── NEW: Rewrite / enhance professional summary ───────────────────────────

  async enhanceSummary(currentSummary: string, targetRole: string, level: 'fresher' | 'experienced'): Promise<string> {
    const prompt = `
You are an expert resume writer. Rewrite and enhance the following professional summary for ATS optimisation.
Target Role: ${targetRole}
Level: ${level === 'fresher' ? 'Entry Level' : 'Experienced'}
Current Summary: "${currentSummary}"

Rules:
- Write in first person
- 2-3 impactful sentences
- Include the role name naturally
- Strong action-oriented opening
- End with a value proposition
- ATS-friendly keywords for ${targetRole}

Return ONLY valid JSON: { "summary": "the rewritten summary text" }
`;
    const raw = await callGemini(prompt);
    const parsed = safeParseJSON<{ summary: string }>(raw, { summary: currentSummary });
    return parsed.summary || currentSummary;
  },

  // ── NEW: Generate ATS bullet points for a project ─────────────────────────

  async generateBullets(
    projectTitle: string,
    description: string,
    techStack: string,
    impact?: string
  ): Promise<string[]> {
    const prompt = `
You are an expert resume writer specialising in ATS optimisation.
Generate 3 powerful ATS bullet points for this project:

Project Title: ${projectTitle}
Description: ${description}
Tech Stack: ${techStack}
Impact/Result: ${impact || 'Not specified'}

Rules:
- Start EVERY bullet with a strong past-tense action verb (Built, Developed, Engineered, Designed, Implemented, Architected, Optimised, Reduced, Increased, Led)
- Include specific technologies from the tech stack
- Add quantified impact where possible (e.g., "reduced load time by 40%", "serving 500+ users")
- Each bullet must be 1 sentence, concise but impactful
- No bullet should start with "I"

Return ONLY valid JSON: { "bullets": ["bullet 1", "bullet 2", "bullet 3"] }
`;
    const raw = await callGemini(prompt);
    const parsed = safeParseJSON<{ bullets: string[] }>(raw, { bullets: [] });
    return parsed.bullets || [];
  },

  // ── NEW: Suggest skills for a specific category ────────────────────────────

  async suggestSkillsForCategory(
    category: string,
    targetRole: string,
    existingSkills: string[]
  ): Promise<string[]> {
    const prompt = `
Suggest 6-10 relevant ${category} skills for a ${targetRole} resume.
Already listed skills (don't repeat these): ${existingSkills.join(', ') || 'none'}

Return ONLY valid JSON: { "skills": ["skill1", "skill2", "skill3", ...] }
Only include skills that are genuinely relevant and commonly expected for ${targetRole}.
`;
    const raw = await callGemini(prompt);
    const parsed = safeParseJSON<{ skills: string[] }>(raw, { skills: [] });
    return parsed.skills || [];
  },

  // ── NEW: Parse LinkedIn JSON export ───────────────────────────────────────

  parseLinkedInExport(files: Record<string, any>): ImportedResumeData {
    const result: ImportedResumeData = {
      personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
      education: [],
      experience: [],
      skills: [
        { category: 'Languages', items: [] },
        { category: 'Frameworks & Libraries', items: [] },
        { category: 'Tools & Platforms', items: [] },
        { category: 'Soft Skills', items: [] },
      ],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
    };

    // Profile.json
    const profile = files['Profile'] || files['profile'];
    if (profile) {
      const p = Array.isArray(profile) ? profile[0] : profile;
      result.personalInfo!.fullName = `${p.FirstName || ''} ${p.LastName || ''}`.trim();
      result.personalInfo!.summary = p.Summary || p.Headline || '';
      result.personalInfo!.location = p.GeoLocation || p.Location || '';
      result.targetRole = p.Headline || '';
    }

    // Email Addresses.csv → handled as JSON by importService
    const emails = files['Email Addresses'] || files['email_addresses'];
    if (Array.isArray(emails) && emails.length > 0) {
      result.personalInfo!.email = emails[0]['Email Address'] || emails[0].email || '';
    }

    // Positions.json → experience
    const positions = files['Positions'] || files['positions'];
    if (Array.isArray(positions)) {
      result.experience = positions.map((p: any, i: number) => ({
        id: String(i + 1),
        role: p.Title || '',
        company: p.CompanyName || p.Company || '',
        duration: `${p.StartedOn || ''} - ${p.FinishedOn || 'Present'}`.trim(),
        description: p.Description || '',
      }));
    }

    // Education.json → education
    const education = files['Education'] || files['education'];
    if (Array.isArray(education)) {
      result.education = education.map((e: any, i: number) => ({
        id: String(i + 1),
        degree: `${e.DegreeName || ''} in ${e.FieldOfStudy || ''}`.trim().replace(/^\s*in\s*/, ''),
        institution: e.SchoolName || '',
        year: e.EndDate ? e.EndDate.substring(0, 4) : '',
        cgpa: e.Grade || undefined,
      }));
    }

    // Skills.json → skills
    const skills = files['Skills'] || files['skills'];
    if (Array.isArray(skills)) {
      const names = skills.map((s: any) => s.Name || s.name || '').filter(Boolean);
      // Naively put all in Tools & Platforms; user can re-categorise
      result.skills![3] = { category: 'Tools & Platforms', items: names };
    }

    // Certifications.json
    const certs = files['Certifications'] || files['certifications'];
    if (Array.isArray(certs)) {
      result.certifications = certs.map((c: any, i: number) => ({
        id: String(i + 1),
        name: c.Name || c.name || '',
      }));
    }

    return result;
  },
};
