import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Zap, BookOpen, Code, Award, Target, Briefcase, GraduationCap, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const dummyWeeklyData = [
  { day: 'Mon', hours: 3 }, { day: 'Tue', hours: 4 }, { day: 'Wed', hours: 2 },
  { day: 'Thu', hours: 5 }, { day: 'Fri', hours: 3 }, { day: 'Sat', hours: 6 }, { day: 'Sun', hours: 2 },
];

const dummySkillGrowth = [
  { week: 'Week 1', skills: 2 }, { week: 'Week 2', skills: 4 }, { week: 'Week 3', skills: 5 },
  { week: 'Week 4', skills: 7 }, { week: 'Week 5', skills: 9 }, { week: 'Week 6', skills: 12 },
];

export default function DashboardHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [totalHours, setTotalHours] = useState(0);
  const [skillHours, setSkillHours] = useState<Record<string, number>>({});
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [resumeScore, setResumeScore] = useState(0);
  const [placementReadiness, setPlacementReadiness] = useState(0);
  const [internshipReadiness, setInternshipReadiness] = useState(0);
  const [weeklyData, setWeeklyData] = useState(dummyWeeklyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const loadDashboardData = async () => {
    if (!profile?.id) return;
    try {
      // Time logs
      const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('hours, category')
        .eq('user_id', profile.id);

      const hours = timeLogs?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0;
      setTotalHours(Math.round(hours * 10) / 10);

      // Category breakdown
      const catHours: Record<string, number> = {};
      (timeLogs || []).forEach((log) => {
        catHours[log.category] = (catHours[log.category] || 0) + (log.hours || 0);
      });
      setSkillHours(catHours);

      // Projects completed
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'completed');
      setProjectsCompleted(projects?.length || 0);

      // Resume score - count resume sections completed
      const { data: resumes } = await supabase
        .from('resumes')
        .select('education, experience, skills, projects')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (resumes && resumes.length > 0) {
        const r = resumes[0];
        const eduCount = Array.isArray(r.education) ? r.education.length : 0;
        const expCount = Array.isArray(r.experience) ? r.experience.length : 0;
        const skillCount = Array.isArray(r.skills) ? r.skills.length : 0;
        const projCount = Array.isArray(r.projects) ? r.projects.length : 0;
        const total = eduCount + expCount + skillCount + projCount;
        // Score out of 100: max ~25 points each category, capped
        const score = Math.min(100, Math.round((total / 20) * 100));
        setResumeScore(score);
      }

      // Weekly time logs for chart
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekLogs } = await supabase
        .from('time_logs')
        .select('hours, date')
        .eq('user_id', profile.id)
        .gte('date', weekAgo.toISOString().split('T')[0]);

      if (weekLogs && weekLogs.length > 0) {
        const dayMap: Record<string, number> = {};
        weekLogs.forEach((log) => {
          const d = new Date(log.date);
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
          dayMap[dayName] = (dayMap[dayName] || 0) + (log.hours || 0);
        });
        setWeeklyData(dummyWeeklyData.map((d) => ({ ...d, hours: dayMap[d.day] || d.hours })));
      }

      // Calculate readiness scores
      calculateReadiness();
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadiness = async () => {
    if (!profile?.id) return;
    try {
      // Get various data for readiness calculation
      const [roadmaps, projectsAll, leetcodeData, timeData, resumesData] = await Promise.all([
        supabase.from('roadmaps').select('roadmap_data').eq('user_id', profile.id).limit(1),
        supabase.from('projects').select('status').eq('user_id', profile.id),
        supabase.from('leetcode_stats').select('easy, medium, hard').eq('user_id', profile.id).maybeSingle(),
        supabase.from('time_logs').select('hours').eq('user_id', profile.id),
        supabase.from('resumes').select('education, experience, skills, projects').eq('user_id', profile.id).limit(1),
      ]);

      let score = 0;
      // Has roadmap (+15)
      if (roadmaps.data && roadmaps.data.length > 0) score += 15;
      // Roadmap stages completed (+15 max)
      if (roadmaps.data?.[0]?.roadmap_data) {
        const stages = roadmaps.data[0].roadmap_data as { completed: boolean }[];
        const completedStages = stages.filter((s) => s.completed).length;
        score += Math.min(15, Math.round((completedStages / Math.max(stages.length, 1)) * 15));
      }
      // Projects (completed ones) (+15 max)
      const completedProjects = projectsAll.data?.filter((p) => p.status === 'completed').length || 0;
      score += Math.min(15, completedProjects * 5);
      // LeetCode (+15 max)
      if (leetcodeData.data) {
        const total = (leetcodeData.data.easy || 0) + (leetcodeData.data.medium || 0) + (leetcodeData.data.hard || 0);
        score += Math.min(15, Math.round((total / 200) * 15));
      }
      // Time invested (+15 max)
      const totalHrs = timeData.data?.reduce((s, t) => s + (t.hours || 0), 0) || 0;
      score += Math.min(15, Math.round((totalHrs / 100) * 15));
      // Resume score (+15 max) - calculate from resume sections
      let rScore = 0;
      if (resumesData.data?.[0]) {
        const r = resumesData.data[0];
        const eduCount = Array.isArray(r.education) ? r.education.length : 0;
        const expCount = Array.isArray(r.experience) ? r.experience.length : 0;
        const skillCount = Array.isArray(r.skills) ? r.skills.length : 0;
        const projCount = Array.isArray(r.projects) ? r.projects.length : 0;
        rScore = Math.min(100, Math.round(((eduCount + expCount + skillCount + projCount) / 20) * 100));
      }
      score += Math.min(15, Math.round((rScore / 100) * 15));
      // Skills (+10 max)
      const skillCount = profile.skills?.length || 0;
      score += Math.min(10, Math.round((skillCount / 5) * 10));

      const placementR = Math.min(100, score);
      const internshipR = Math.min(100, Math.round(score * 0.93));

      setPlacementReadiness(placementR);
      setInternshipReadiness(internshipR);

      // Update profile with readiness
      await supabase.from('profiles').update({
        placement_readiness: placementR,
        internship_readiness: internshipR,
        total_learning_hours: totalHrs,
        skill_hours: skillHours,
      }).eq('id', profile.id);
    } catch (err) {
      console.error('Error calculating readiness:', err);
      setPlacementReadiness(profile.placement_readiness || 0);
      setInternshipReadiness(profile.internship_readiness || 0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const currentGoal = profile?.goal || 'Software Developer';
  const progressPercent = Math.min(100, Math.round((totalHours / 100) * 100));

  const skillBreakdown = Object.entries(skillHours).map(([skill, hrs]) => ({ skill, hrs }));
  const totalSkillHours = skillBreakdown.reduce((sum, s) => sum + s.hrs, 0);

  const statCards = [
    { label: 'Current Goal', value: currentGoal, icon: <Target size={22} />, gradient: 'from-emerald-400 to-emerald-600' },
    { label: 'Progress', value: `${progressPercent}%`, icon: <Zap size={22} />, gradient: 'from-blue-400 to-blue-600', bar: true },
    { label: 'Hours Invested', value: totalHours || profile?.total_learning_hours || 0, icon: <Clock size={22} />, suffix: 'hrs', gradient: 'from-purple-400 to-purple-600' },
    { label: 'Projects Done', value: projectsCompleted, icon: <Code size={22} />, gradient: 'from-orange-400 to-orange-600' },
    { label: 'Resume Score', value: resumeScore, icon: <Award size={22} />, suffix: '/100', gradient: 'from-pink-400 to-pink-600' },
    { label: 'Placement', value: `${placementReadiness || profile?.placement_readiness || 0}%`, icon: <Briefcase size={22} />, gradient: 'from-cyan-400 to-cyan-600' },
    { label: 'Internship', value: `${internshipReadiness || profile?.internship_readiness || 0}%`, icon: <GraduationCap size={22} />, gradient: 'from-teal-400 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back, {profile?.name?.split(' ')[0] || 'Developer'}
        </h1>
        <p className="text-gray-400 mt-1">
          You are on track to become a <span className="text-primary-400 font-semibold">{currentGoal}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  {card.suffix && <span className="text-gray-400 text-xs">{card.suffix}</span>}
                </div>
              </div>
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.gradient} text-white`}>
                {card.icon}
              </div>
            </div>
            {card.bar && (
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Skill Hours Breakdown */}
      {skillBreakdown.length > 0 && (
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-white mb-4">Skill Hours Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {skillBreakdown.map((s) => (
              <div key={s.skill} className="p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">{s.skill}</p>
                <p className="text-lg font-bold text-white">{Math.round(s.hrs)} hrs</p>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${(s.hrs / Math.max(totalSkillHours, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Weekly Progress</h3>
          <p className="text-sm text-gray-400 mb-4">Hours invested this week</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="hours" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Skill Growth</h3>
          <p className="text-sm text-gray-400 mb-4">Skills mastered over time</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dummySkillGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Line type="monotone" dataKey="skills" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-900/20 to-cyan-900/20 border border-primary-500/20 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Ready to level up?</h3>
            <p className="text-gray-400 text-sm mt-1">Explore AI-powered features to accelerate your career</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/dashboard/roadmap')} className="btn-primary px-5 py-2.5 rounded-lg text-sm">
              Generate Roadmap
            </button>
            <button onClick={() => navigate('/dashboard/mentor')} className="btn-secondary px-5 py-2.5 rounded-lg text-sm">
              Start Mentor Chat
            </button>
            <button onClick={() => navigate('/dashboard/resume')} className="btn-secondary px-5 py-2.5 rounded-lg text-sm">
              Build Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
