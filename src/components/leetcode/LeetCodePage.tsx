import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeetCodeStats } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Plus, Minus, TrendingUp, Flame, RefreshCw, ExternalLink, Trophy, Activity,
  Target, Calendar, Star, ChevronRight, Lock, BookOpen, Zap, Brain, ArrowRight,
  Award, Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';

const DSA_TOPICS = [
  { name: 'Arrays & Strings', problems: 150, order: 1, difficulty: 'Easy' },
  { name: 'Hash Maps & Sets', problems: 80, order: 2, difficulty: 'Easy' },
  { name: 'Two Pointers', problems: 60, order: 3, difficulty: 'Easy' },
  { name: 'Stacks & Queues', problems: 70, order: 4, difficulty: 'Easy' },
  { name: 'Linked Lists', problems: 60, order: 5, difficulty: 'Easy' },
  { name: 'Binary Trees', problems: 100, order: 6, difficulty: 'Medium' },
  { name: 'Binary Search', problems: 80, order: 7, difficulty: 'Medium' },
  { name: 'Recursion & Backtracking', problems: 90, order: 8, difficulty: 'Medium' },
  { name: 'Dynamic Programming', problems: 120, order: 9, difficulty: 'Hard' },
  { name: 'Graphs', problems: 100, order: 10, difficulty: 'Hard' },
  { name: 'Advanced DP', problems: 80, order: 11, difficulty: 'Hard' },
  { name: 'System Design Basics', problems: 40, order: 12, difficulty: 'Hard' },
];

const DAILY_CHALLENGES = [
  { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays & Strings', url: 'https://leetcode.com/problems/two-sum/' },
  { title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stacks & Queues', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { title: 'Reverse Linked List', difficulty: 'Easy', topic: 'Linked Lists', url: 'https://leetcode.com/problems/reverse-linked-list/' },
  { title: 'Maximum Subarray', difficulty: 'Medium', topic: 'Arrays & Strings', url: 'https://leetcode.com/problems/maximum-subarray/' },
  { title: 'Clone Graph', difficulty: 'Medium', topic: 'Graphs', url: 'https://leetcode.com/problems/clone-graph/' },
  { title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
  { title: 'Edit Distance', difficulty: 'Hard', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/edit-distance/' },
  { title: 'Word Ladder', difficulty: 'Hard', topic: 'Graphs', url: 'https://leetcode.com/problems/word-ladder/' },
];

interface LeetCodeTopicProgress {
  topic_name: string;
  problems_solved: number;
  total_problems: number;
  weak_subtopics: string[];
  last_practiced: string | null;
}

interface LeetCodeStreak {
  streak_date: string;
  problems_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
}

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
  const [topicProgress, setTopicProgress] = useState<Record<string, LeetCodeTopicProgress>>({});
  const [streaks, setStreaks] = useState<LeetCodeStreak[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'streaks'>('overview');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const EASY_TOTAL = 800;
  const MEDIUM_TOTAL = 400;
  const HARD_TOTAL = 200;

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchTopicProgress();
      fetchStreaks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

      if (error) throw error;

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

  const fetchTopicProgress = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('leetcode_topic_progress')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        const map: Record<string, LeetCodeTopicProgress> = {};
        data.forEach((t: LeetCodeTopicProgress) => { map[t.topic_name] = t; });
        setTopicProgress(map);
      }
    } catch (err) {
      console.error('Error fetching topic progress:', err);
    }
  };

  const fetchStreaks = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('leetcode_streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('streak_date', { ascending: false })
        .limit(30);
      if (data) setStreaks(data);
    } catch (err) {
      console.error('Error fetching streaks:', err);
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
      if (updateProfile) {
        await updateProfile({ leetcode_username: username.trim() });
      }

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

      // Record today's streak
      const today = new Date().toISOString().split('T')[0];
      const todayStreak = {
        user_id: user.id,
        streak_date: today,
        problems_solved: newStats.total_solved,
        easy_solved: newStats.easy,
        medium_solved: newStats.medium,
        hard_solved: newStats.hard,
      };
      await supabase.from('leetcode_streaks').upsert([todayStreak], { onConflict: 'user_id,streak_date' });
      await fetchStreaks();

      // Update profile streak
      await updateProfileStreak();

      setStats((prev) => prev ? { ...prev, ...newStats } : null);
      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch data. Check the username and try again.');
    } finally {
      setFetching(false);
    }
  }, [username, user, stats, updateProfile]);

  const updateProfileStreak = async () => {
    if (!user || !profile) return;
    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active_date;
    let currentStreak = profile.current_streak || 0;
    let longestStreak = profile.longest_streak || 0;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    if (updateProfile) {
      await updateProfile({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
      });
    }
  };

  const updateTopicProgress = async (topicName: string, solved: number, total: number) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        topic_name: topicName,
        problems_solved: solved,
        total_problems: total,
        last_practiced: new Date().toISOString().split('T')[0],
      };
      await supabase.from('leetcode_topic_progress').upsert([payload], { onConflict: 'user_id,topic_name' });
      await fetchTopicProgress();
    } catch (err) {
      console.error('Error updating topic progress:', err);
    }
  };

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
      const updated = { ...stats, [difficulty]: newVal, total_solved: stats.easy + stats.medium + stats.hard + 1 };
      updated.total_solved = updated.easy + updated.medium + updated.hard;
      setStats(updated);
      updateStatsInDB({ [difficulty]: newVal, total_solved: updated.total_solved });
      // Update streak for today
      const today = new Date().toISOString().split('T')[0];
      const todayStreak = {
        user_id: user!.id,
        streak_date: today,
        problems_solved: updated.total_solved,
        easy_solved: updated.easy,
        medium_solved: updated.medium,
        hard_solved: updated.hard,
      };
      supabase.from('leetcode_streaks').upsert([todayStreak], { onConflict: 'user_id,streak_date' }).then(() => fetchStreaks());
      updateProfileStreak();
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

  const getDailyChallenge = () => {
    const dayIndex = new Date().getDay();
    return DAILY_CHALLENGES[dayIndex % DAILY_CHALLENGES.length];
  };

  const getWeakTopics = () => {
    return DSA_TOPICS.map(topic => {
      const tp = topicProgress[topic.name];
      const solved = tp?.problems_solved || 0;
      const ratio = topic.problems > 0 ? solved / topic.problems : 0;
      return { ...topic, solved, ratio, isWeak: ratio < 0.3 };
    }).filter(t => t.isWeak).slice(0, 4);
  };

  const getRecommendedTopic = () => {
    for (const topic of DSA_TOPICS) {
      const tp = topicProgress[topic.name];
      const solved = tp?.problems_solved || 0;
      const ratio = topic.problems > 0 ? solved / topic.problems : 0;
      if (ratio < 0.5) return topic;
    }
    return DSA_TOPICS[0];
  };

  const getStreakData = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const streak = streaks.find(s => s.streak_date === dateStr);
      days.push({
        date: d.toLocaleDateString('en', { weekday: 'narrow', day: 'numeric' }),
        fullDate: dateStr,
        solved: streak?.problems_solved || 0,
        active: !!streak && streak.problems_solved > 0,
      });
    }
    return days;
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

  const dailyChallenge = getDailyChallenge();
  const weakTopics = getWeakTopics();
  const recommendedTopic = getRecommendedTopic();
  const streakDays = getStreakData();
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="text-emerald-400" size={28} />
            LeetCode Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">Structured DSA learning with topic paths, streaks, and weak area analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Flame className="text-amber-400" size={16} />
            <span className="text-sm font-bold text-amber-400">{currentStreak}</span>
            <span className="text-xs text-gray-500">day streak</span>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'overview' as const, label: 'Overview', icon: <Activity size={16} /> },
          { id: 'topics' as const, label: 'Topic Path', icon: <BookOpen size={16} /> },
          { id: 'streaks' as const, label: 'Streaks', icon: <Flame size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Challenge + Recommended Topic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Challenge */}
            <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="text-emerald-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-1">Daily Challenge</h3>
                  <p className="text-lg font-bold text-white">{dailyChallenge.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      dailyChallenge.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      dailyChallenge.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {dailyChallenge.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{dailyChallenge.topic}</span>
                    <a
                      href={dailyChallenge.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      Solve Now
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Next Topic */}
            <div className="stat-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="text-purple-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-400 mb-1">Recommended Next Topic</h3>
                  <p className="text-lg font-bold text-white">{recommendedTopic.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{recommendedTopic.problems} problems total</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      recommendedTopic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      recommendedTopic.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {recommendedTopic.difficulty}
                    </span>
                    <button
                      onClick={() => setActiveTab('topics')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      View Path
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
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
                  <p className="text-3xl font-bold text-white mt-1">{stats.contest_rating ? Math.round(stats.contest_rating) : '--'}</p>
                </div>
                <Trophy className="text-yellow-500" size={28} />
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Streak</p>
                  <p className="text-3xl font-bold text-white mt-1">{currentStreak}</p>
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
                {fetching ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {fetching ? 'Fetching...' : 'Fetch Stats'}
              </button>
            </div>
            {fetchError && <p className="text-red-400 text-sm mt-2">{fetchError}</p>}
            {fetchSuccess && <p className="text-primary-400 text-sm mt-2">Stats synced successfully!</p>}
          </div>

          {/* Problem Counters + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const progress = diff === 'easy' ? easyProgress : diff === 'medium' ? mediumProgress : hardProgress;
                const color = diff === 'easy' ? 'green' : diff === 'medium' ? 'amber' : 'red';
                const max = diff === 'easy' ? EASY_TOTAL : diff === 'medium' ? MEDIUM_TOTAL : HARD_TOTAL;
                return (
                  <div className="stat-card" key={diff}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-white capitalize">{diff} Problems</h2>
                      <span className={`text-${color}-400 font-semibold`}>{stats[diff]}/{max}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
                      <div className={`bg-${color}-500 h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center gap-4 justify-center">
                      <button onClick={() => handleDecrement(diff)} disabled={isSaving || stats[diff] === 0} className={`p-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg transition-colors text-red-400`}>
                        <Minus size={18} />
                      </button>
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-white">{stats[diff]}</p>
                        <p className="text-gray-400 text-xs">{progress.toFixed(1)}%</p>
                      </div>
                      <button onClick={() => handleIncrement(diff)} disabled={isSaving || stats[diff] >= max} className={`p-2.5 bg-${color}-500/20 hover:bg-${color}-500/30 disabled:opacity-50 rounded-lg transition-colors text-${color}-400`}>
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="stat-card h-fit">
              <h2 className="text-lg font-bold text-white mb-4">Distribution</h2>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
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
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-400" size={20} />
              <h2 className="text-lg font-bold text-white">Weak Topics to Focus</h2>
              <span className="text-xs text-gray-500">Based on your progress</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {weakTopics.length > 0 ? weakTopics.map((area) => (
                <div key={area.name} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all">
                  <h3 className="text-white font-semibold mb-2 text-sm">{area.name}</h3>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full bg-red-500 transition-all duration-500" style={{ width: `${Math.max(5, (area.ratio || 0) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">{area.solved}/{area.problems} solved</p>
                  <a
                    href={`https://leetcode.com/tag/${area.name.toLowerCase().replace(/\s+/g, '-')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-400 hover:text-red-300 mt-2 inline-block"
                  >
                    Practice Now
                  </a>
                </div>
              )) : (
                <div className="col-span-full text-center py-6">
                  <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={24} />
                  <p className="text-gray-400 text-sm">No weak topics detected! Keep up the great work.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOPICS TAB ── */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-emerald-400" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">DSA Learning Path</h2>
                <p className="text-sm text-gray-400 mt-1">Follow the structured topic-by-topic path. Unlock advanced topics by completing prerequisites.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {DSA_TOPICS.map((topic, index) => {
              const tp = topicProgress[topic.name];
              const solved = tp?.problems_solved || 0;
              const ratio = topic.problems > 0 ? solved / topic.problems : 0;
              const isCompleted = ratio >= 0.7;
              const isLocked = index > 0 && !DSA_TOPICS.slice(0, index).every((t) => {
                const ttp = topicProgress[t.name];
                return ttp && (ttp.problems_solved / t.problems) >= 0.3;
              });
              const isExpanded = expandedTopic === topic.name;

              return (
                <div
                  key={topic.name}
                  className={`stat-card transition-all ${isExpanded ? 'ring-1 ring-emerald-500/20' : ''} ${isLocked ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-emerald-500/20' : isLocked ? 'bg-gray-500/20' : 'bg-white/5'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={18} className="text-emerald-400" /> :
                        isLocked ? <Lock size={18} className="text-gray-500" /> :
                        <Brain size={18} className="text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-white">{index + 1}. {topic.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                              topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              topic.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {topic.difficulty}
                            </span>
                            {isCompleted && <span className="text-xs text-emerald-400">Completed</span>}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{topic.problems} problems total</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-gray-400">{solved}/{topic.problems}</span>
                          <button
                            onClick={() => setExpandedTopic(isExpanded ? null : topic.name)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.max(3, ratio * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">{Math.round(ratio * 100)}%</span>
                          <span className="text-xs text-gray-500">{Math.max(0, topic.problems - solved)} remaining</span>
                        </div>
                      </div>

                      {!isLocked && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => {
                              const newSolved = Math.min(topic.problems, solved + 1);
                              updateTopicProgress(topic.name, newSolved, topic.problems);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            +1 Solved
                          </button>
                          <button
                            onClick={() => {
                              const newSolved = Math.max(0, solved - 1);
                              updateTopicProgress(topic.name, newSolved, topic.problems);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            -1
                          </button>
                          <a
                            href={`https://leetcode.com/tag/${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                          >
                            Practice on LeetCode
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Resources */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Recommended Resources</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.name + ' tutorial')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Play size={14} className="text-red-400" />
                          <span className="text-sm text-gray-300">YouTube Tutorials</span>
                        </a>
                        <a href={`https://leetcode.com/tag/${topic.name.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Target size={14} className="text-emerald-400" />
                          <span className="text-sm text-gray-300">LeetCode Problems</span>
                        </a>
                        <a href={`https://www.geeksforgeeks.org/${topic.name.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <BookOpen size={14} className="text-blue-400" />
                          <span className="text-sm text-gray-300">GeeksforGeeks</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STREAKS TAB ── */}
      {activeTab === 'streaks' && (
        <div className="space-y-6">
          {/* Streak Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Flame className="text-amber-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-3xl font-bold text-amber-400">{currentStreak} days</p>
                </div>
              </div>
            </div>
            <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Award className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Longest Streak</p>
                  <p className="text-3xl font-bold text-emerald-400">{longestStreak} days</p>
                </div>
              </div>
            </div>
            <div className="stat-card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Days</p>
                  <p className="text-3xl font-bold text-blue-400">{streaks.filter(s => s.problems_solved > 0).length} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Calendar */}
          <div className="stat-card">
            <h2 className="text-lg font-bold text-white mb-4">Last 30 Days</h2>
            <div className="grid grid-cols-7 gap-2">
              {streakDays.map((day, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 ${
                    day.active
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-[10px] text-gray-500">{day.date}</span>
                  {day.active && <Flame size={12} className="text-amber-400" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
                <span>Inactive</span>
              </div>
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
                      sub.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                      sub.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {sub.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">
                Connect your LeetCode account to see recent activity
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
