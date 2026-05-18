import { Resume } from '../types/resume';

interface ATSAnalysisResult {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  matchPercentage?: number;
}

// Mock AI Service since we are using a mock backend for now
export const aiService = {
  async analyzeResume(resume: Resume): Promise<ATSAnalysisResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Basic heuristic logic for mock score
    let score = 50;
    const missingKeywords = [];
    const suggestions = [];

    if (resume.personalInfo.fullName && resume.personalInfo.email) {
      score += 10;
    } else {
      suggestions.push("Add complete personal information");
    }

    if (resume.experience.length > 0) {
      score += 20;
    } else {
      suggestions.push("Add at least one work experience");
    }

    if (resume.skills.length > 5) {
      score += 10;
    } else {
      missingKeywords.push("Leadership", "Communication", "Agile");
      suggestions.push("Add more relevant skills to pass ATS filters");
    }

    if (resume.projects.length > 0) {
      score += 10;
    } else {
      suggestions.push("Include technical projects with measurable impact");
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      score,
      missingKeywords: missingKeywords.length ? missingKeywords : ["Python", "Docker"],
      suggestions: suggestions.length ? suggestions : ["Use action verbs in experience", "Quantify your achievements"],
    };
  },

  async matchJobDescription(resume: Resume, jobDescription: string): Promise<ATSAnalysisResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response based on description length
    const matchPercentage = jobDescription.length > 50 ? 75 : 40;

    return {
      score: matchPercentage,
      matchPercentage,
      missingKeywords: ["React Native", "Redux", "GraphQL"],
      suggestions: [
        "The job requires more frontend experience",
        "Highlight your React Native projects more prominently",
      ]
    };
  }
};
