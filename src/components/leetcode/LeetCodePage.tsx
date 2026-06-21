import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeetCodeStats } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Plus, Minus, TrendingUp, Flame, RefreshCw, ExternalLink, Trophy, Activity } from 'lucide-react';

export default function LeetCodePage() {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState(profile?.leetcode_username || '');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<{ title: string; difficulty: string; time: string }[]>([]);

  const EASY_TOTAL = 800;
  const MEDIUM_TOTAL = 400;
  const HARD_TOTAL = 200;

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  useEffect(() => {
    if (profile?.leetcode_username) {
      setUsername(profile.leetcode_username);
    }
  }, [profile?.leetcode_username]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leetcode_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStats(data);
      } else {
        setStats({
          id: '',
          user_id: user.id,
          easy: 0,
          medium: 0,
          hard: 0,
          total_solved: 0,
          contest_rating: null,
          ranking: null,
          recent_activity: 0,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching LeetCode stats:', error);
      setStats({
        id: '',
        user_id: user.id,
        easy: 0,
        medium: 0,
        hard: 0,
        total_solved: 0,
        contest_rating: null,
        ranking: null,
        recent_activity: 0,
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeetCodeData = useCallback(async () => {
    if (!username.trim() || !user) return;
    setFetching(true);
    setFetchError('');
    setFetchSuccess(false);

    try {
      const res = await fetch(`https://leetcode-stats-api.onrender.com/${username.trim()}`);
      if (!res.ok) throw new Error('Failed to fetch LeetCode data');
      const data = await res.json();

      if (data.status === 'error') throw new Error(data.message || 'User not found');

      const newStats = {
        easy: data.easySolved || 0,
        medium: data.mediumSolved || 0,
        hard: data.hardSolved || 0,
        total_solved: data.totalSolved || 0,
        contest_rating: data.contestRating || null,
        ranking: data.ranking || null,
        recent_activity: data.recentSubmissions?.length || 0,
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase
      if (stats?.id) {
        await supabase
          .from('leetcode_stats')
          .update(newStats)
          .eq('id', stats.id);
      } else {
        const { data: inserted } = await supabase
          .from('leetcode_stats')
          .insert([{ user_id: user.id, ...newStats }])
          .select()
          .single();
        if (inserted) setStats(inserted);
      }

      // Save username to profile
      await updateProfile({ leetcode_username: username.trim() });

      // Set recent submissions
      if (data.recentSubmissions) {
        setRecentSubmissions(
          data.recentSubmissions.slice(0, 5).map((s: { title: string; difficulty: string; time: string }) => ({
            title: s.title || '',
            difficulty: s.difficulty || '',
            time: s.time || '',
          }))
        );
      }

      setStats((prev) => prev ? { ...prev, ...newStats } : null);
      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch data. Check the username and try again.');
    } finally {
      setFetching(false);
    }
  }, [username, user, stats, updateProfile]);

  const updateStatsInDB = async (newStats: Partial<LeetCodeStats>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (stats?.id) {
        await supabase.from('leetcode_stats').update(newStats).eq('id', stats.id);
      } else {
        const { data } = await supabase
          .from('leetcode_stats')
          .insert([{ user_id: user.id, ...newStats }])
          .select()
          .single();
        if (data) setStats(data);
      }
    } catch (err) {
      console.error('Error updating stats:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIncrement = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!stats) return;
    const maxValues = { easy: EASY_TOTAL, medium: MEDIUM_TOTAL, hard: HARD_TOTAL };
    if (stats[difficulty] < maxValues[difficulty]) {
      const newVal = stats[difficulty] + 1;
      const updated = { ...stats, [difficulty]: newVal, total_solved: stats.easy + stats.medium + stats.hard + (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1 : 1) - 0 };
      updated.total_solved = updated.easy + updated.medium + updated.hard;
      setStats(updated);
      updateStatsInDB({ [difficulty]: newVal, total_solved: updated.total_solved });
    }
  };

  const handleDecrement = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!stats) return;
    if (stats[difficulty] > 0) {
      const newVal = stats[difficulty] - 1;
      const updated = { ...stats, [difficulty]: newVal };
      updated.total_solved = updated.easy + updated.medium + updated.hard;
      setStats(updated);
      updateStatsInDB({ [difficulty]: newVal, total_solved: updated.total_solved });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const totalSolved = stats.easy + stats.medium + stats.hard;
  const overallProgress = (totalSolved / (EASY_TOTAL + MEDIUM_TOTAL + HARD_TOTAL)) * 100;
  const easyProgress = (stats.easy / EASY_TOTAL) * 100;
  const mediumProgress = (stats.medium / MEDIUM_TOTAL) * 100;
  const hardProgress = (stats.hard / HARD_TOTAL) * 100;

  const pieData = [
    { name: 'Easy', value: stats.easy, color: '#10b981' },
    { name: 'Medium', value: stats.medium, color: '#f59e0b' },
    { name: 'Hard', value: stats.hard, color: '#ef4444' },
  ];

  const weakAreas = [
    { name: 'Dynamic Programming', progress: Math.min(100, Math.floor((stats.hard / HARD_TOTAL) * 150)), color: 'from-blue-500 to-blue-600' },
    { name: 'Graphs', progress: Math.min(100, Math.floor((stats.medium / MEDIUM_TOTAL) * 120)), color: 'from-purple-500 to-purple-600' },
    { name: 'Backtracking', progress: Math.min(100, Math.floor((stats.easy / EASY_TOTAL) * 80)), color: 'from-pink-500 to-pink-600' },
    { name: 'System Design', progress: Math.min(100, Math.floor((totalSolved / 200) * 30)), color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">LeetCode Tracker</h1>
          <p className="text-gray-400 text-sm">Track your LeetCode progress and improve your skills</p>
        </div>
        <a
          href={`https://leetcode.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ExternalLink size={16} />
          View Profile
        </a>
      </div>

      {/* Username Input */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-white mb-4">Connect LeetCode Account</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your LeetCode username"
              className="input-field pr-10"
              onKeyDown={(e) => e.key === 'Enter' && fetchLeetCodeData()}
            />
            {username && (
              <button
                onClick={() => { setUsername(''); updateProfile({ leetcode_username: null }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                &times;
              </button>
            )}
          </div>
          <button
            onClick={fetchLeetCodeData}
            disabled={fetching || !username.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {fetching ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {fetching ? 'Fetching...' : 'Fetch Stats'}
          </button>
        </div>
        {fetchError && (
          <p className="text-red-400 text-sm mt-2">{fetchError}</p>
        )}
        {fetchSuccess && (
          <p className="text-primary-400 text-sm mt-2">Stats synced successfully!</p>
        )}
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Solved</p>
              <p className="text-3xl font-bold text-white mt-1">{totalSolved}</p>
            </div>
            <TrendingUp className="text-primary-500" size={28} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Contest Rating</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats.contest_rating ? Math.round(stats.contest_rating) : '--'}
              </p>
            </div>
            <Trophy className="text-yellow-500" size={28} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Global Ranking</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats.ranking ? `#${stats.ranking.toLocaleString()}` : '--'}
              </p>
            </div>
            <Flame className="text-orange-500" size={28} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Progress</p>
              <p className="text-3xl font-bold text-white mt-1">{overallProgress.toFixed(1)}%</p>
            </div>
            <Activity className="text-blue-500" size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem Counters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Easy */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Easy Problems</h2>
              <span className="text-green-400 font-semibold">{stats.easy}/{EASY_TOTAL}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
              <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${easyProgress}%` }} />
            </div>
            <div className="flex items-center gap-4 justify-center">
              <button onClick={() => handleDecrement('easy')} disabled={isSaving || stats.easy === 0} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg transition-colors text-red-400">
                <Minus size={18} />
              </button>
              <div className="text-center min-w-[60px]">
                <p className="text-2xl font-bold text-white">{stats.easy}</p>
                <p className="text-gray-400 text-xs">{easyProgress.toFixed(1)}%</p>
              </div>
              <button onClick={() => handleIncrement('easy')} disabled={isSaving || stats.easy >= EASY_TOTAL} className="p-2.5 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg transition-colors text-green-400">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Medium */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Medium Problems</h2>
              <span className="text-amber-400 font-semibold">{stats.medium}/{MEDIUM_TOTAL}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
              <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${mediumProgress}%` }} />
            </div>
            <div className="flex items-center gap-4 justify-center">
              <button onClick={() => handleDecrement('medium')} disabled={isSaving || stats.medium === 0} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg transition-colors text-red-400">
                <Minus size={18} />
              </button>
              <div className="text-center min-w-[60px]">
                <p className="text-2xl font-bold text-white">{stats.medium}</p>
                <p className="text-gray-400 text-xs">{mediumProgress.toFixed(1)}%</p>
              </div>
              <button onClick={() => handleIncrement('medium')} disabled={isSaving || stats.medium >= MEDIUM_TOTAL} className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 rounded-lg transition-colors text-amber-400">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Hard */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Hard Problems</h2>
              <span className="text-red-400 font-semibold">{stats.hard}/{HARD_TOTAL}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
              <div className="bg-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${hardProgress}%` }} />
            </div>
            <div className="flex items-center gap-4 justify-center">
              <button onClick={() => handleDecrement('hard')} disabled={isSaving || stats.hard === 0} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg transition-colors text-red-400">
                <Minus size={18} />
              </button>
              <div className="text-center min-w-[60px]">
                <p className="text-2xl font-bold text-white">{stats.hard}</p>
                <p className="text-gray-400 text-xs">{hardProgress.toFixed(1)}%</p>
              </div>
              <button onClick={() => handleIncrement('hard')} disabled={isSaving || stats.hard >= HARD_TOTAL} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg transition-colors text-red-400">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="stat-card h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Distribution</h2>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(2,6,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      <div className="stat-card">
        <h2 className="text-lg font-bold text-white mb-4">Topics to Improve</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weakAreas.map((area) => (
            <div key={area.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <h3 className="text-white font-semibold mb-2 text-sm">{area.name}</h3>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full bg-gradient-to-r ${area.color} transition-all duration-500`} style={{ width: `${area.progress}%` }} />
              </div>
              <p className="text-xs text-gray-400">{area.progress}% proficiency</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="stat-card">
        <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-300 text-sm font-medium">{sub.title}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  sub.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400'
                    : sub.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {sub.difficulty}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">
            Connect your LeetCode account above to see recent activity
          </p>
        )}
      </div>
    </div>
  );
}
