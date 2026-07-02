import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Linkedin, Sparkles, Copy, Check, RefreshCw, ChevronRight,
  TrendingUp, Target, Users, Calendar, CheckCircle2,
  AlertTriangle, Star, Award, Zap, Lightbulb, ArrowRight,
  ExternalLink, BarChart3, Shield, Flame, Globe
} from 'lucide-react';

interface LinkedInProfile {
  id: string;
  headline: string;
  about: string;
  skills: string[];
  experience: { company: string; role: string; duration: string }[];
  education: { institution: string; degree: string }[];
  certifications: string[];
  profile_url: string;
  generated_headline: string;
  generated_about: string;
  generated_skills: string[];
}

interface LinkedInAnalysis {
  id: string;
  overall_score: number;
  headline_score: number;
  about_score: number;
  skills_score: number;
  experience_score: number;
  suggestions: string[];
  strengths: string[];
  profile_url: string;
}

interface NetworkingTask {
  id: string;
  title: string;
  description: string;
  category: string;
  is_completed: boolean;
  week_number: number;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

async function callLinkedInAI(type: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/linkedin-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ type, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    console.error('LinkedIn AI call failed:', err);
    // Fallback mock responses
    if (type === 'headline') {
      return {
        headline: 'Full-Stack Developer | React & Node.js | Building Scalable Web Applications',
      };
    }
    if (type === 'about') {
      return {
        about: 'I am a passionate software developer with expertise in building modern web applications. My journey started with a curiosity for how things work on the internet, which led me to master technologies like React, Node.js, and TypeScript. I love solving complex problems and turning ideas into production-ready applications. I am actively seeking opportunities to contribute to innovative teams and grow my skills in system design and cloud architecture.',
      };
    }
    if (type === 'skills') {
      return {
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS', 'System Design', 'REST APIs', 'GraphQL'],
      };
    }
    return {
      overall_score: 65,
      headline_score: 70,
      about_score: 60,
      skills_score: 75,
      experience_score: 55,
      suggestions: ['Add more quantifiable achievements to your experience', 'Expand your About section to 200+ words', 'Include a professional headshot', 'Add 3-5 more relevant skills', 'Request recommendations from peers'],
      strengths: ['Clear headline with role and skills', 'Relevant technical skills listed'],
    };
  }
}

const TASK_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  connection: <Users size={14} />,
  post: <Globe size={14} />,
  engagement: <Sparkles size={14} />,
  profile: <Shield size={14} />,
  skill: <Star size={14} />,
};

const TASK_CATEGORY_COLORS: Record<string, string> = {
  connection: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  post: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  engagement: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  profile: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  skill: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

export default function LinkedInCareerPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'analyzer'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<LinkedInProfile | null>(null);
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [tasks, setTasks] = useState<NetworkingTask[]>([]);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [connections, setConnections] = useState(profile?.current_connections || 0);
  const [connectionsGoal, setConnectionsGoal] = useState(profile?.connections_goal || 500);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: linkedinData } = await supabase.from('linkedin_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (linkedinData) setProfileData(linkedinData);
      const { data: analysisData } = await supabase.from('linkedin_analyses').select('*').eq('user_id', user.id).order('analyzed_at', { ascending: false }).limit(1).maybeSingle();
      if (analysisData) setAnalysis(analysisData);
      const { data: tasksData } = await supabase.from('networking_tasks').select('*').eq('user_id', user.id).order('week_number', { ascending: true });
      if (tasksData) setTasks(tasksData);
      setConnections(profile?.current_connections || 0);
      setConnectionsGoal(profile?.connections_goal || 500);
    } catch (err) {
      console.error('Error fetching LinkedIn data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateHeadline = async () => {
    if (!user || !profile) return;
    setGenerating(prev => ({ ...prev, headline: true }));
    try {
      const result = await callLinkedInAI('headline', {
        profile: {
          name: profile.name || '',
          skills: profile.skills || [],
          role: profile.goal || '',
          college: profile.college || '',
          branch: profile.branch || '',
          year: profile.year || '',
        },
      });
      const headline = String(result.headline || '');
      if (profileData?.id) {
        await supabase.from('linkedin_profiles').update({ generated_headline: headline }).eq('id', profileData.id);
      } else {
        const { data } = await supabase.from('linkedin_profiles').insert({
          user_id: user.id,
          generated_headline: headline,
          headline: '',
          about: '',
          skills: [],
        }).select().single();
        if (data) setProfileData(data);
      }
      setProfileData(prev => prev ? { ...prev, generated_headline: headline } : null);
    } catch (err) {
      console.error('Headline generation error:', err);
    } finally {
      setGenerating(prev => ({ ...prev, headline: false }));
    }
  };

  const generateAbout = async () => {
    if (!user || !profile) return;
    setGenerating(prev => ({ ...prev, about: true }));
    try {
      const result = await callLinkedInAI('about', {
        profile: {
          name: profile.name || '',
          skills: profile.skills || [],
          role: profile.goal || '',
          college: profile.college || '',
          branch: profile.branch || '',
          year: profile.year || '',
          goal: profile.goal || '',
        },
      });
      const about = String(result.about || '');
      if (profileData?.id) {
        await supabase.from('linkedin_profiles').update({ generated_about: about }).eq('id', profileData.id);
      } else {
        const { data } = await supabase.from('linkedin_profiles').insert({
          user_id: user.id,
          generated_about: about,
          headline: '',
          about: '',
          skills: [],
        }).select().single();
        if (data) setProfileData(data);
      }
      setProfileData(prev => prev ? { ...prev, generated_about: about } : null);
    } catch (err) {
      console.error('About generation error:', err);
    } finally {
      setGenerating(prev => ({ ...prev, about: false }));
    }
  };

  const generateSkills = async () => {
    if (!user || !profile) return;
    setGenerating(prev => ({ ...prev, skills: true }));
    try {
      const result = await callLinkedInAI('skills', {
        profile: {
          name: profile.name || '',
          skills: profile.skills || [],
          role: profile.goal || '',
        },
      });
      const skills = Array.isArray(result.skills) ? result.skills : [];
      if (profileData?.id) {
        await supabase.from('linkedin_profiles').update({ generated_skills: skills }).eq('id', profileData.id);
      } else {
        const { data } = await supabase.from('linkedin_profiles').insert({
          user_id: user.id,
          generated_skills: skills,
          headline: '',
          about: '',
          skills: [],
        }).select().single();
        if (data) setProfileData(data);
      }
      setProfileData(prev => prev ? { ...prev, generated_skills: skills } : null);
    } catch (err) {
      console.error('Skills generation error:', err);
    } finally {
      setGenerating(prev => ({ ...prev, skills: false }));
    }
  };

  const analyzeProfile = async () => {
    if (!user || !profileUrl.trim()) return;
    setAnalyzing(true);
    try {
      const result = await callLinkedInAI('analyze', {
        profileData: {
          name: profile.name || '',
          headline: profileData?.headline || '',
          about: profileData?.about || '',
          skills: profileData?.skills || [],
          experience: profileData?.experience || [],
          education: profileData?.education || [],
          profileUrl: profileUrl,
        },
      });
      const analysisData = {
        user_id: user.id,
        profile_url: profileUrl,
        overall_score: Number(result.overall_score) || 50,
        headline_score: Number(result.headline_score) || 50,
        about_score: Number(result.about_score) || 50,
        skills_score: Number(result.skills_score) || 50,
        experience_score: Number(result.experience_score) || 50,
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
      };
      const { data } = await supabase.from('linkedin_analyses').insert([analysisData]).select().single();
      if (data) {
        setAnalysis(data);
        await supabase.from('profiles').update({ linkedin_score: analysisData.overall_score }).eq('id', user.id);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await supabase.from('networking_tasks').update({
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
    } catch (err) {
      console.error('Toggle task error:', err);
    }
  };

  const updateConnections = async (newVal: number) => {
    if (!user) return;
    setConnections(newVal);
    try {
      await supabase.from('profiles').update({ current_connections: newVal }).eq('id', user.id);
    } catch (err) {
      console.error('Update connections error:', err);
    }
  };

  const updateGoal = async (newVal: number) => {
    if (!user) return;
    setConnectionsGoal(newVal);
    try {
      await supabase.from('profiles').update({ connections_goal: newVal }).eq('id', user.id);
    } catch (err) {
      console.error('Update goal error:', err);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };
  const getScoreRing = (score: number) => {
    if (score >= 80) return 'border-emerald-500/30 text-emerald-400';
    if (score >= 60) return 'border-amber-500/30 text-amber-400';
    return 'border-red-500/30 text-red-400';
  };

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const connectionProgress = connectionsGoal > 0 ? Math.min(100, Math.round((connections / connectionsGoal) * 100)) : 0;
  const weeklyTasks = tasks.filter(t => t.week_number === 1);
  const weeklyCompleted = weeklyTasks.filter(t => t.is_completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Linkedin className="text-[#0A66C2]" size={28} />
            LinkedIn Career Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">Build, analyze, and optimize your professional presence</p>
        </div>
        <a
          href={profile?.linkedin_url || 'https://linkedin.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ExternalLink size={16} />
          Open LinkedIn
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: <BarChart3 size={16} /> },
          { id: 'builder' as const, label: 'Profile Builder', icon: <Sparkles size={16} /> },
          { id: 'analyzer' as const, label: 'Profile Analyzer', icon: <Shield size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Score + Connections Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Profile Score */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Shield size={20} className="text-[#0A66C2]" />
                <span className="text-xs text-gray-500">Profile Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(analysis?.overall_score || 0)}`}>
                  {analysis?.overall_score || 0}
                </span>
                <span className="text-gray-400 text-sm">/100</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full transition-all ${getScoreBg(analysis?.overall_score || 0)}`} style={{ width: `${analysis?.overall_score || 0}%` }} />
              </div>
            </div>

            {/* Connections */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Users size={20} className="text-blue-400" />
                <span className="text-xs text-gray-500">Connections</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{connections}</span>
                <span className="text-gray-400 text-sm">/ {connectionsGoal}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${connectionProgress}%` }} />
              </div>
            </div>

            {/* Task Completion */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-xs text-gray-500">Tasks Done</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{completionRate}%</span>
                <span className="text-gray-400 text-sm">{completedTasks}/{tasks.length}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
              </div>
            </div>

            {/* Weekly Streak */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Flame size={20} className="text-amber-400" />
                <span className="text-xs text-gray-500">Week 1 Progress</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{weeklyCompleted}</span>
                <span className="text-gray-400 text-sm">/ {weeklyTasks.length} tasks</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {weeklyCompleted === weeklyTasks.length ? 'Week complete! Great job!' : `${weeklyTasks.length - weeklyCompleted} tasks remaining`}
              </p>
            </div>
          </div>

          {/* Connections Goal Editor */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-blue-400" />
              <h3 className="text-lg font-bold text-white">Connections Goal</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Current: <span className="text-white font-semibold">{connections}</span></span>
                  <span className="text-gray-400">Goal: <span className="text-white font-semibold">{connectionsGoal}</span></span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${connectionProgress}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {connectionProgress >= 100 ? 'Goal reached! Consider expanding your network further.' : `${connectionsGoal - connections} more connections to reach your goal`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={connections}
                  onChange={(e) => updateConnections(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field w-24 text-center py-2"
                  placeholder="Current"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number"
                  value={connectionsGoal}
                  onChange={(e) => updateGoal(Math.max(1, parseInt(e.target.value) || 500))}
                  className="input-field w-24 text-center py-2"
                  placeholder="Goal"
                />
              </div>
            </div>
          </div>

          {/* Weekly Networking Tasks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-400" />
              <h3 className="text-lg font-bold text-white">Weekly Networking Tasks</h3>
              <span className="text-xs text-gray-500">Week 1</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {tasks.length === 0 ? (
                <div className="stat-card text-center py-8">
                  <Lightbulb className="text-gray-600 mx-auto mb-3" size={32} />
                  <p className="text-gray-400 text-sm">No networking tasks yet</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`stat-card flex items-start gap-4 transition-all ${task.is_completed ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => toggleTask(task.id, !task.is_completed)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                        task.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500 hover:border-emerald-400'
                      }`}
                    >
                      {task.is_completed && <CheckCircle2 size={14} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded border ${TASK_CATEGORY_COLORS[task.category] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                          <span className="flex items-center gap-1">
                            {TASK_CATEGORY_ICONS[task.category] || <Star size={12} />}
                            {task.category}
                          </span>
                        </span>
                      </div>
                      {task.description && (
                        <p className={`text-xs mt-1 ${task.is_completed ? 'text-gray-600' : 'text-gray-500'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('builder')}
              className="stat-card hover:border-[#0A66C2]/30 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/15 group-hover:bg-[#0A66C2]/25 flex items-center justify-center mb-3 transition-colors">
                <Sparkles size={18} className="text-[#0A66C2]" />
              </div>
              <p className="text-sm font-medium text-white group-hover:text-[#0A66C2] transition-colors">Profile Builder</p>
              <p className="text-xs text-gray-500 mt-1">Generate headline, about, and skills</p>
              <ArrowRight size={14} className="text-gray-600 mt-3 group-hover:text-[#0A66C2] transition-colors" />
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className="stat-card hover:border-[#0A66C2]/30 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/15 group-hover:bg-[#0A66C2]/25 flex items-center justify-center mb-3 transition-colors">
                <Shield size={18} className="text-[#0A66C2]" />
              </div>
              <p className="text-sm font-medium text-white group-hover:text-[#0A66C2] transition-colors">Profile Analyzer</p>
              <p className="text-xs text-gray-500 mt-1">Get your profile score and tips</p>
              <ArrowRight size={14} className="text-gray-600 mt-3 group-hover:text-[#0A66C2] transition-colors" />
            </button>
            <div className="stat-card bg-gradient-to-br from-[#0A66C2]/10 to-emerald-500/10 border-[#0A66C2]/20">
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-[#0A66C2]" />
              </div>
              <p className="text-sm font-medium text-white">Profile Tips</p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li className="flex items-center gap-1"><ChevronRight size={10} className="text-[#0A66C2]" /> Use a professional headshot</li>
                <li className="flex items-center gap-1"><ChevronRight size={10} className="text-[#0A66C2]" /> Write a keyword-rich headline</li>
                <li className="flex items-center gap-1"><ChevronRight size={10} className="text-[#0A66C2]" /> Post weekly about your learnings</li>
                <li className="flex items-center gap-1"><ChevronRight size={10} className="text-[#0A66C2]" /> Engage with industry posts daily</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── BUILDER TAB ── */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Headline Generator */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-[#0A66C2]" />
              <h3 className="text-lg font-bold text-white">Headline Generator</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Generate a professional headline using your skills and career goals</p>
            <div className="space-y-3">
              {profileData?.generated_headline && (
                <div className="p-4 bg-[#0A66C2]/5 rounded-xl border border-[#0A66C2]/20">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white leading-relaxed">{profileData.generated_headline}</p>
                    <button
                      onClick={() => copyToClipboard(profileData.generated_headline, 'headline')}
                      className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'headline' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={generateHeadline}
                disabled={generating.headline}
                className="btn-primary flex items-center gap-2"
              >
                {generating.headline ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating.headline ? 'Generating...' : profileData?.generated_headline ? 'Regenerate Headline' : 'Generate Headline'}
              </button>
            </div>
          </div>

          {/* About Section Generator */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-[#0A66C2]" />
              <h3 className="text-lg font-bold text-white">About Section Generator</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Create a compelling About section that tells your professional story</p>
            <div className="space-y-3">
              {profileData?.generated_about && (
                <div className="p-4 bg-[#0A66C2]/5 rounded-xl border border-[#0A66C2]/20">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{profileData.generated_about}</p>
                    <button
                      onClick={() => copyToClipboard(profileData.generated_about, 'about')}
                      className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'about' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={generateAbout}
                disabled={generating.about}
                className="btn-primary flex items-center gap-2"
              >
                {generating.about ? <RefreshCw size={16} className="animate-spin" /> : <Award size={16} />}
                {generating.about ? 'Generating...' : profileData?.generated_about ? 'Regenerate About' : 'Generate About Section'}
              </button>
            </div>
          </div>

          {/* Skills Generator */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-[#0A66C2]" />
              <h3 className="text-lg font-bold text-white">Skills Generator</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Get AI-recommended skills for your LinkedIn profile</p>
            <div className="space-y-3">
              {profileData?.generated_skills && profileData.generated_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileData.generated_skills.map((skill, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(skill, `skill-${i}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20 hover:bg-[#0A66C2]/20 transition-colors text-sm"
                    >
                      <Zap size={12} />
                      {skill}
                      {copied === `skill-${i}` && <Check size={12} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={generateSkills}
                disabled={generating.skills}
                className="btn-primary flex items-center gap-2"
              >
                {generating.skills ? <RefreshCw size={16} className="animate-spin" /> : <Star size={16} />}
                {generating.skills ? 'Generating...' : profileData?.generated_skills?.length ? 'Regenerate Skills' : 'Generate Skills'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZER TAB ── */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          {/* URL Input */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-[#0A66C2]" />
              <h3 className="text-lg font-bold text-white">Profile Analyzer</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Paste your LinkedIn profile URL to get a detailed analysis and improvement suggestions</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="input-field w-full"
                  onKeyDown={(e) => e.key === 'Enter' && analyzeProfile()}
                />
              </div>
              <button
                onClick={analyzeProfile}
                disabled={analyzing || !profileUrl.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                {analyzing ? 'Analyzing...' : 'Analyze Profile'}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Overall Score Card */}
              <div className="stat-card bg-gradient-to-br from-[#0A66C2]/10 to-emerald-500/10 border-[#0A66C2]/20">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center ${getScoreRing(analysis.overall_score)}`}>
                    <span className="text-3xl font-bold">{analysis.overall_score}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white mb-1">{analysis.overall_score >= 80 ? 'Excellent Profile!' : analysis.overall_score >= 60 ? 'Good Profile' : 'Needs Improvement'}</h3>
                    <p className="text-sm text-gray-400">
                      {analysis.overall_score >= 80
                        ? 'Your profile is well-optimized. Keep it updated and active.'
                        : analysis.overall_score >= 60
                        ? 'Your profile is decent. Follow the suggestions below to improve.'
                        : 'Your profile needs significant improvements. Start with the suggestions below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Headline', score: analysis.headline_score, icon: <Sparkles size={16} /> },
                  { label: 'About', score: analysis.about_score, icon: <Award size={16} /> },
                  { label: 'Skills', score: analysis.skills_score, icon: <Star size={16} /> },
                  { label: 'Experience', score: analysis.experience_score, icon: <TrendingUp size={16} /> },
                ].map((item) => (
                  <div key={item.label} className="stat-card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[#0A66C2]">{item.icon}</span>
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all ${getScoreBg(item.score)}`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Improvements */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Improvement Suggestions</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, i) => (
                      <div key={i} className="stat-card flex items-start gap-3 p-4">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                        </div>
                        <p className="text-sm text-gray-300">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.strengths.map((strength, i) => (
                      <div key={i} className="stat-card flex items-start gap-3 p-4 bg-emerald-500/5 border-emerald-500/10">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        </div>
                        <p className="text-sm text-gray-300">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
