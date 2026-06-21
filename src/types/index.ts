export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  college: string | null;
  branch: string | null;
  year: string | null;
  goal: string | null;
  skills: string[];
  onboarding_complete: boolean;
  avatar_url: string | null;
  theme: string;
  leetcode_username: string | null;
  placement_readiness: number;
  internship_readiness: number;
  total_learning_hours: number;
  skill_hours: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  goal: string;
  roadmap_data: RoadmapStage[];
  created_at: string;
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  skills: string[];
  projects: string[];
  duration: string;
  completed: boolean;
  order: number;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  skills: string[];
  difficulty: string;
  status: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  study_hours: number;
  dsa_hours: number;
  project_hours: number;
  skills_completed: number;
  projects_completed: number;
  date: string;
  created_at: string;
}

export interface SkillItem { skill: string; level: number }
export interface CertItem { name: string; issuer: string; date: string }

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template: string;
  theme: 'light' | 'dark';
  education: ResumeEducation[];
  skills: SkillItem[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  certifications: CertItem[];
  created_at: string;
  updated_at: string;
}

export interface ResumePersonal {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface ResumeProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface MockInterview {
  id: string;
  user_id: string;
  questions: InterviewQuestion[];
  answers: string[];
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
  date: string;
  question_evaluations?: QuestionEvaluation[];
  report_summary?: string;
  duration_seconds?: number;
}

export interface QuestionEvaluation {
  score: number;
  correctPoints: string[];
  missingPoints: string[];
  improvements: string[];
  feedback: string;
  idealAnswer: string;
}

export interface InterviewReport {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
}

export interface LeetCodeStats {
  id: string;
  user_id: string;
  easy: number;
  medium: number;
  hard: number;
  contest_rating: number | null;
  ranking: number | null;
  recent_activity: number;
  total_solved: number;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  category: string;
  hours: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  best_feature: string | null;
  missing_feature: string | null;
  rating: number | null;
  comments: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
}

export interface AnalyticsDaily {
  id: string;
  date: string;
  active_users: number;
  new_signups: number;
  roadmaps_generated: number;
  projects_created: number;
  mock_interviews: number;
  resumes_built: number;
  mentor_sessions: number;
  feedback_submitted: number;
  created_at: string;
}

export type ThemeMode = 'dark' | 'light';
