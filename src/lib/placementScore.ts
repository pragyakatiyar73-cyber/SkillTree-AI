import { supabase } from './supabase';

export interface PlacementScore {
  overall: number;
  dsa: number;
  projects: number;
  resume: number;
  communication: number;
  aptitude: number;
  linkedin: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
  level: 'Beginner' | 'Intermediate' | 'Placement Ready';
  levelColor: string;
  progressBarColor: string;
}

export async function calculatePlacementScore(userId: string): Promise<PlacementScore> {
  // 1. Fetch all data sources
  const { data: leetcode } = await supabase
    .from('leetcode_stats')
    .select('easy, medium, hard')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: projects } = await supabase
    .from('projects')
    .select('status')
    .eq('user_id', userId);

  const { data: resumes } = await supabase
    .from('resumes')
    .select('personal_details, education, skills, projects, experience, resume_score')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: interviews } = await supabase
    .from('mock_interviews')
    .select('communication_score, overall_score')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: progress } = await supabase
    .from('progress')
    .select('dsa_hours, study_hours, projects_completed')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, linkedin_url')
    .eq('id', userId)
    .maybeSingle();

  const { data: aptitudeTests } = await supabase
    .from('aptitude_tests')
    .select('score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Calculate individual scores (0-100)
  const leetcodeEasy = leetcode?.easy ?? 0;
  const leetcodeMedium = leetcode?.medium ?? 0;
  const leetcodeHard = leetcode?.hard ?? 0;
  const dsaScore = Math.min(100, Math.round(
    (leetcodeEasy * 1 + leetcodeMedium * 2 + leetcodeHard * 3) / 150 * 100
  ));

  const totalProjects = projects?.length ?? 0;
  const completedProjects = projects?.filter((p: { status: string }) => p.status === 'completed').length ?? 0;
  const projectsScore = Math.min(100, Math.round(
    (totalProjects === 0 ? 0 : completedProjects / totalProjects * 100)
  ));
  if (totalProjects === 0 && completedProjects === 0) {
    // give partial credit for project existence even if none completed
  }
  const adjustedProjectsScore = totalProjects === 0 ? 0 : projectsScore;
  // Actually, let me recalculate: if user has projects, score based on % completed. If no projects, 0.

  const resumeScore = Math.min(100, resumes?.resume_score ?? 0);

  const communicationScore = Math.min(100, interviews?.communication_score ?? 0);

  const totalStudyHours = (progress?.study_hours ?? 0) as number;
  const dsaHours = (progress?.dsa_hours ?? 0) as number;
  const aptitudeScore = Math.min(100, Math.round(
    (totalStudyHours + dsaHours * 2) / 50 * 100
  ));

  const linkedinScore = profile?.linkedin_url ? 100 : 0;

  // 3. Weighted overall score
  const weightedDsa = dsaScore * 0.30;
  const weightedProjects = adjustedProjectsScore * 0.25;
  const weightedResume = resumeScore * 0.15;
  const weightedCommunication = communicationScore * 0.15;
  const weightedAptitude = aptitudeScore * 0.10;
  const weightedLinkedin = linkedinScore * 0.05;

  const overall = Math.round(
    weightedDsa +
    weightedProjects +
    weightedResume +
    weightedCommunication +
    weightedAptitude +
    weightedLinkedin
  );

  // 4. Determine strong/weak areas
  const scores: { name: string; score: number; label: string }[] = [
    { name: 'DSA Progress', score: dsaScore, label: 'dsa' },
    { name: 'Projects Completed', score: adjustedProjectsScore, label: 'projects' },
    { name: 'Resume Completion', score: resumeScore, label: 'resume' },
    { name: 'Communication Skills', score: communicationScore, label: 'communication' },
    { name: 'Aptitude Progress', score: aptitudeScore, label: 'aptitude' },
    { name: 'LinkedIn Profile', score: linkedinScore, label: 'linkedin' },
  ];

  const strongAreas = scores
    .filter((s) => s.score >= 70)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.name);

  const weakAreas = scores
    .filter((s) => s.score < 50)
    .sort((a, b) => a.score - b.score)
    .map((s) => s.name);

  // 5. Personalized recommendations
  const recommendations: string[] = [];
  if (dsaScore < 50) {
    recommendations.push('Solve at least 50 easy LeetCode problems and 20 medium problems to strengthen DSA fundamentals.');
  } else if (dsaScore < 70) {
    recommendations.push('Focus on medium and hard LeetCode problems to reach an advanced DSA level.');
  }
  if (adjustedProjectsScore < 50) {
    recommendations.push('Complete more projects from your dashboard to showcase practical skills.');
  } else if (adjustedProjectsScore < 70) {
    recommendations.push('Add more projects with diverse tech stacks to strengthen your portfolio.');
  }
  if (resumeScore < 50) {
    recommendations.push('Fill out all sections in your resume builder to increase completion score.');
  } else if (resumeScore < 70) {
    recommendations.push('Add more details to projects and experience sections in your resume.');
  }
  if (communicationScore < 50) {
    recommendations.push('Practice more mock interviews to improve your communication skills.');
  } else if (communicationScore < 70) {
    recommendations.push('Record yourself during mock interviews and work on articulating thoughts clearly.');
  }
  if (aptitudeScore < 50) {
    recommendations.push('Dedicate more study hours daily to improve aptitude and problem-solving speed.');
  }
  if (!profile?.linkedin_url) {
    recommendations.push('Add your LinkedIn profile link to boost your professional visibility.');
  }
  if (overall >= 70) {
    recommendations.push('You are close to placement-ready! Focus on fine-tuning your weak areas.');
  } else if (overall >= 40) {
    recommendations.push('Keep a consistent daily routine for DSA and projects to reach the next level.');
  } else {
    recommendations.push('Start with basics: build 2-3 projects, solve 50 easy LeetCode problems, and fill your resume.');
  }

  // 6. Level and color coding
  let level: 'Beginner' | 'Intermediate' | 'Placement Ready';
  let levelColor: string;
  let progressBarColor: string;
  let strokeColor: string;
  if (overall <= 40) {
    level = 'Beginner';
    levelColor = 'text-red-400';
    progressBarColor = 'bg-red-500';
    strokeColor = '#ef4444';
  } else if (overall <= 70) {
    level = 'Intermediate';
    levelColor = 'text-amber-400';
    progressBarColor = 'bg-amber-500';
    strokeColor = '#f59e0b';
  } else {
    level = 'Placement Ready';
    levelColor = 'text-emerald-400';
    progressBarColor = 'bg-emerald-500';
    strokeColor = '#10b981';
  }

  return {
    overall,
    dsa: dsaScore,
    projects: adjustedProjectsScore,
    resume: resumeScore,
    communication: communicationScore,
    aptitude: aptitudeScore,
    linkedin: linkedinScore,
    strongAreas,
    weakAreas,
    recommendations,
    level,
    levelColor,
    progressBarColor,
    strokeColor,
  };
}
