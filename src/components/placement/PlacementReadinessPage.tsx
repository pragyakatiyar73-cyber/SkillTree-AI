import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePlacementScore, type PlacementScore } from '../../lib/placementScore';
import {
  Shield, Trophy, AlertTriangle, Lightbulb, Code2, FolderKanban,
  FileText, MessageSquare, Brain, Linkedin, ChevronRight,
  ArrowUp, ArrowDown, Minus, Target, Sparkles, BarChart3, Award,
  Zap, CheckCircle2, XCircle, Clock, TrendingUp, Rocket
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ScoreBreakdown {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  icon: React.ReactNode;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface ScoreHistory {
  date: string;
  score: number;
}

export default function PlacementReadinessPage() {
  const { user } = useAuth();
  const [score, setScore] = useState<PlacementScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'recommendations'>('overview');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await calculatePlacementScore(user!.id);
        if (!cancelled) {
          setScore(result);
          const mockHistory: ScoreHistory[] = [
            { date: '2w ago', score: Math.max(0, result.overall - 15) },
            { date: '1w ago', score: Math.max(0, result.overall - 8) },
            { date: '3d ago', score: Math.max(0, result.overall - 3) },
            { date: 'Today', score: result.overall },
          ];
          setHistory(mockHistory);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load score');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-surface-800 border-t-emerald-500 animate-spin" />
          <Shield className="absolute inset-0 m-auto text-emerald-400" size={28} />
        </div>
        <p className="text-gray-400 animate-pulse">Analyzing your placement readiness...</p>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <XCircle className="text-red-400" size={48} />
        <p className="text-red-400">{error || 'Failed to load score'}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary text-sm">Retry</button>
      </div>
    );
  }

  const breakdowns: ScoreBreakdown[] = [
    { name: 'DSA Progress', score: score.dsa, weight: 30, weighted: Math.round(score.dsa * 0.30), icon: <Code2 size={18} />, description: 'Based on LeetCode problems solved (Easy, Medium, Hard)', trend: score.dsa > 50 ? 'up' : score.dsa > 20 ? 'stable' : 'down' },
    { name: 'Projects Completed', score: score.projects, weight: 25, weighted: Math.round(score.projects * 0.25), icon: <FolderKanban size={18} />, description: 'Ratio of completed vs total projects in your portfolio', trend: score.projects > 50 ? 'up' : score.projects > 20 ? 'stable' : 'down' },
    { name: 'Resume Completion', score: score.resume, weight: 15, weighted: Math.round(score.resume * 0.15), icon: <FileText size={18} />, description: 'Completeness of resume sections and AI score', trend: score.resume > 60 ? 'up' : score.resume > 30 ? 'stable' : 'down' },
    { name: 'Communication Skills', score: score.communication, weight: 15, weighted: Math.round(score.communication * 0.15), icon: <MessageSquare size={18} />, description: 'Score from latest mock interview evaluation', trend: score.communication > 60 ? 'up' : score.communication > 30 ? 'stable' : 'down' },
    { name: 'Aptitude Progress', score: score.aptitude, weight: 10, weighted: Math.round(score.aptitude * 0.10), icon: <Brain size={18} />, description: 'Based on study hours and DSA practice time', trend: score.aptitude > 50 ? 'up' : score.aptitude > 20 ? 'stable' : 'down' },
    { name: 'LinkedIn Profile', score: score.linkedin, weight: 5, weighted: Math.round(score.linkedin * 0.05), icon: <Linkedin size={18} />, description: 'Whether your LinkedIn URL is added to your profile', trend: score.linkedin === 100 ? 'up' : 'down' },
  ];

  const radarData = breakdowns.map(b => ({ subject: b.name, A: b.score, fullMark: 100 }));
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';
  const getScoreBarColor = (s: number) => s >= 70 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const getScoreBgColor = (s: number) => s >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
  const getTrendIcon = (trend: string) => trend === 'up' ? <ArrowUp size={14} className="text-emerald-400" /> : trend === 'down' ? <ArrowDown size={14} className="text-red-400" /> : <Minus size={14} className="text-gray-400" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-emerald-400" size={28} />
            Placement Readiness Score
          </h1>
          <p className="text-gray-400 mt-1">Your comprehensive assessment across 6 key placement dimensions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={14} /><span>Last updated: Just now</span>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-shrink-0">
            <svg className="w-72 h-72 progress-ring" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={score.overall <= 40 ? '#f87171' : score.overall <= 70 ? '#fbbf24' : '#34d399'} />
                  <stop offset="100%" stopColor={score.overall <= 40 ? '#dc2626' : score.overall <= 70 ? '#f59e0b' : '#10b981'} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="150" cy="150" r="140" fill="none" stroke="#0f172a" strokeWidth="20" />
              <circle cx="150" cy="150" r="140" fill="none" stroke="url(#scoreGradient)" strokeWidth="20" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} filter="url(#glow)" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-white">{score.overall}</span>
              <span className="text-lg text-gray-400 mt-1">/ 100</span>
              <div className={`mt-3 px-4 py-1 rounded-full text-sm font-semibold ${score.overall <= 40 ? 'bg-red-500/20 text-red-400' : score.overall <= 70 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {score.level}
              </div>
            </div>
          </div>
          <div className="flex-1 w-full space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Overall Progress</span>
                <span className={`text-sm font-bold ${score.levelColor}`}>{score.overall}%</span>
              </div>
              <div className="w-full h-4 bg-surface-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${score.progressBarColor}`} style={{ width: `${score.overall}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0 (Beginner)</span><span>40 (Intermediate)</span><span>70 (Placement Ready)</span><span>100</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${getScoreBgColor(score.overall)}`}>
                <div className="flex items-center gap-2 mb-2"><Trophy size={16} className="text-emerald-400" /><span className="text-sm text-gray-300">Strong Areas</span></div>
                <p className="text-2xl font-bold text-emerald-400">{score.strongAreas.length}</p>
                <p className="text-xs text-gray-500 mt-1">{score.strongAreas.length > 0 ? score.strongAreas.slice(0, 2).join(', ') + (score.strongAreas.length > 2 ? '...' : '') : 'None yet — keep working!'}</p>
              </div>
              <div className={`p-4 rounded-xl border ${score.weakAreas.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-400" /><span className="text-sm text-gray-300">Weak Areas</span></div>
                <p className="text-2xl font-bold text-red-400">{score.weakAreas.length}</p>
                <p className="text-xs text-gray-500 mt-1">{score.weakAreas.length > 0 ? score.weakAreas.slice(0, 2).join(', ') + (score.weakAreas.length > 2 ? '...' : '') : 'Great — no weak areas!'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {score.weakAreas.map((area) => (
                <button key={area} onClick={() => {
                  if (area.includes('DSA')) window.location.href = '/dashboard/leetcode';
                  else if (area.includes('Project')) window.location.href = '/dashboard/projects';
                  else if (area.includes('Resume')) window.location.href = '/dashboard/resume';
                  else if (area.includes('Communication')) window.location.href = '/dashboard/mock-interview';
                  else if (area.includes('LinkedIn')) window.location.href = '/dashboard/settings';
                  else window.location.href = '/dashboard/roadmap';
                }} className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                  <Target size={12} />Improve {area}<ChevronRight size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'overview' as const, label: 'Overview', icon: <BarChart3 size={16} /> },
          { id: 'breakdown' as const, label: 'Detailed Breakdown', icon: <Zap size={16} /> },
          { id: 'recommendations' as const, label: 'Recommendations', icon: <Lightbulb size={16} /> },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-emerald-400" />Skill Radar</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name="Your Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" />Score Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, fill: '#34d399' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdowns.map((item) => (
              <div key={item.name} className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${getScoreBgColor(item.score)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-300"><span className={getScoreColor(item.score)}>{item.icon}</span><span className="text-sm font-medium">{item.name}</span></div>
                  <div className="flex items-center gap-1">{getTrendIcon(item.trend)}</div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
                <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(item.score)}`} style={{ width: `${item.score}%` }} />
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
                <div className="mt-2 text-xs text-gray-500">Weight: <span className="text-gray-300">{item.weight}%</span><span className="mx-2">·</span>Contribution: <span className={getScoreColor(item.weighted)}>{item.weighted} pts</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Zap size={18} className="text-emerald-400" />Detailed Score Breakdown</h3>
            <div className="space-y-6">
              {breakdowns.map((item, index) => (
                <div key={item.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getScoreBgColor(item.score)}`}><span className={getScoreColor(item.score)}>{item.icon}</span></div>
                      <div><p className="text-sm font-medium text-white">{item.name}</p><p className="text-xs text-gray-500">{item.description}</p></div>
                    </div>
                    <div className="text-right"><p className={`text-lg font-bold ${getScoreColor(item.score)}`}>{item.score}</p><p className="text-xs text-gray-500">{item.weight}% weight</p></div>
                  </div>
                  <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(item.score)}`} style={{ width: `${item.score}%`, transitionDelay: `${index * 100}ms` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Raw Score: {item.score}/100</span>
                    <span className={getScoreColor(item.weighted)}>Weighted Contribution: {item.weighted} pts</span>
                  </div>
                  {index < breakdowns.length - 1 && <div className="border-t border-white/5 mt-4" />}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Weighted Score</span>
              <span className="text-2xl font-bold text-emerald-400">{score.overall} / 100</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Lightbulb size={18} className="text-amber-400" />Personalized Recommendations</h3>
            <div className="space-y-4">
              {score.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-sm font-bold text-amber-400">{index + 1}</span></div>
                  <div><p className="text-sm text-gray-300 leading-relaxed">{rec}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard title="Practice DSA" description="Solve more LeetCode problems to boost your DSA score" icon={<Code2 size={20} className="text-emerald-400" />} href="/dashboard/leetcode" score={score.dsa} target={70} />
            <ActionCard title="Build Projects" description="Complete more projects to strengthen your portfolio" icon={<FolderKanban size={20} className="text-emerald-400" />} href="/dashboard/projects" score={score.projects} target={70} />
            <ActionCard title="Polish Resume" description="Fill all resume sections for maximum score" icon={<FileText size={20} className="text-emerald-400" />} href="/dashboard/resume" score={score.resume} target={70} />
            <ActionCard title="Mock Interviews" description="Practice communication and technical skills" icon={<MessageSquare size={20} className="text-emerald-400" />} href="/dashboard/mock-interview" score={score.communication} target={70} />
            <ActionCard title="Study More" description="Increase daily study hours for aptitude growth" icon={<Brain size={20} className="text-emerald-400" />} href="/dashboard/progress" score={score.aptitude} target={70} />
            <ActionCard title="LinkedIn Profile" description="Add your LinkedIn URL for professional visibility" icon={<Linkedin size={20} className="text-emerald-400" />} href="/dashboard/settings" score={score.linkedin} target={100} />
          </div>
        </div>
      )}

      <div className={`p-6 rounded-xl border ${score.overall >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : score.overall >= 40 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${score.overall >= 70 ? 'bg-emerald-500/20' : score.overall >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
            {score.overall >= 70 ? <Award size={24} className="text-emerald-400" /> : score.overall >= 40 ? <Target size={24} className="text-amber-400" /> : <Rocket size={24} className="text-red-400" />}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${score.overall >= 70 ? 'text-emerald-400' : score.overall >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {score.overall >= 70 ? 'You are Placement Ready!' : score.overall >= 40 ? 'Keep Pushing — You are on the Right Track!' : 'Let us Build Your Foundation First!'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {score.overall >= 70 ? 'Your profile is competitive. Focus on mock interviews and company-specific preparation.' : score.overall >= 40 ? 'Follow the recommendations above to reach Placement Ready status.' : 'Start with DSA basics and 2-3 projects. Consistency beats intensity.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon, href, score, target }: { title: string; description: string; icon: React.ReactNode; href: string; score: number; target: number }) {
  const progress = Math.min(100, (score / target) * 100);
  const isComplete = score >= target;
  return (
    <a href={href} className={`block p-5 rounded-xl border transition-all hover:scale-[1.02] ${isComplete ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-medium text-white">{title}</span></div>
        {isComplete ? <CheckCircle2 size={16} className="text-emerald-400" /> : <ChevronRight size={16} className="text-gray-500" />}
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-gray-500">{score} / {target} target</span>
        <span className={isComplete ? 'text-emerald-400' : 'text-amber-400'}>{isComplete ? 'Done' : `${Math.round(progress)}%`}</span>
      </div>
    </a>
  );
}
