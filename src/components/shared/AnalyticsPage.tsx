import { useEffect, useState } from 'react';
import { Users, Map, FolderKanban, Mic, FileText, MessageSquare, BarChart3, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

interface Stats {
  totalUsers: number;
  activeToday: number;
  roadmapsGenerated: number;
  projectsCreated: number;
  mockInterviews: number;
  resumesBuilt: number;
  mentorSessions: number;
  feedbackCount: number;
}

interface AnalyticsData {
  stats: Stats;
  featureUsage: { name: string; count: number }[];
  dailyTrend: { date: string; users: number }[];
  feedbackStats: { best_feature: string; count: number }[];
  missingFeatures: { missing_feature: string; count: number }[];
}

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    if (!profile.is_admin) {
      setLoading(false);
      return;
    }

    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.is_admin]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const result = await response.json();
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError(result.error || 'Failed to load analytics');
        }
        setLoading(false);
        return;
      }

      const analyticsData: AnalyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">
            Analytics is restricted to administrators only. If you believe you should have access, please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center">
            <ShieldAlert size={40} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statCards = [
    { label: 'Total Users', value: data.stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Active Today', value: data.stats.activeToday, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Roadmaps Generated', value: data.stats.roadmapsGenerated, icon: Map, color: 'text-emerald-400' },
    { label: 'Projects Created', value: data.stats.projectsCreated, icon: FolderKanban, color: 'text-purple-400' },
    { label: 'Mock Interviews', value: data.stats.mockInterviews, icon: Mic, color: 'text-orange-400' },
    { label: 'Resumes Built', value: data.stats.resumesBuilt, icon: FileText, color: 'text-cyan-400' },
    { label: 'Mentor Sessions', value: data.stats.mentorSessions, icon: MessageSquare, color: 'text-yellow-400' },
    { label: 'Feedback', value: data.stats.feedbackCount, icon: BarChart3, color: 'text-pink-400' },
  ];

  const displayTrend = data.dailyTrend.length > 0
    ? data.dailyTrend
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toLocaleDateString('en', { weekday: 'short' }), users: 0 };
      });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <BarChart3 size={20} className="text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform usage metrics and insights</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.featureUsage}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Active Users</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-white mb-4">Most Loved Features</h3>
          {data.feedbackStats.length > 0 ? (
            <div className="space-y-3">
              {data.feedbackStats.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">{f.best_feature}</span>
                  <span className="text-primary-400 font-semibold">{f.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No feedback data yet</p>
          )}
        </div>
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-white mb-4">Most Requested Features</h3>
          {data.missingFeatures.length > 0 ? (
            <div className="space-y-3">
              {data.missingFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">{f.missing_feature}</span>
                  <span className="text-yellow-400 font-semibold">{f.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No feature requests yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
