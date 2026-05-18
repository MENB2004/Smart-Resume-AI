export interface Resume {
  id: string;
  title: string;
  lastUpdated: string;
  level: 'fresher' | 'experienced';
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github?: string;
    portfolio: string;
    summary: string;
  };
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
    cgpa?: string;
  }>;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string;
    attachmentUri?: string;
    attachmentName?: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    techStack: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    attachmentUri?: string;
    attachmentName?: string;
  }>;
  achievements: string[];
  languages: string[];
}
