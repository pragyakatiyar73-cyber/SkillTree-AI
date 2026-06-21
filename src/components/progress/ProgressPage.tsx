import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { TimeLog, ProgressEntry } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, BookOpen, Code, Briefcase, Plus, Trash2 } from 'lucide-react';

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [progress, setProgress] = useState<ProgressEntry | null>(null);
  const [formData, setFormData] = useState({
    category: 'Learning',
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [totals, setTotals] = useState({
    learning: 0,
    dsa: 0,
    projects: 0,
    interview: 0,
    other: 0,
  });
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ]);

  const categoryMap = {
    'Learning': 'learning',
    'DSA': 'dsa',
    'Projects': 'projects',
    'Interview Prep': 'interview',
    'Other': 'other',
  };

  const categoryColors = {
    'Learning': 'bg-blue-500/20',
    'DSA': 'bg-purple-500/20',
    'Projects': 'bg-amber-500/20',
    'Interview Prep': 'bg-pink-500/20',
    'Other': 'bg-gray-500/20',
  };

  const categoryIcons = {
    'Learning': <BookOpen size={16} />,
    'DSA': <Code size={16} />,
    'Projects': <Briefcase size={16} />,
    'Interview Prep': <Clock size={16} />,
    'Other': <Clock size={16} />,
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [logsRes, progressRes] = await Promise.all([
        supabase
          .from('time_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (logsRes.data) {
        setTimeLogs(logsRes.data);
        calculateTotals(logsRes.data);
        calculateWeeklyData(logsRes.data);
      }

      if (progressRes.data) {
        setProgress(progressRes.data);
      } else {
        setProgress({
          id: '',
          user_id: user.id,
          study_hours: 0,
          dsa_hours: 0,
          project_hours: 0,
          skills_completed: profile?.skills?.length || 0,
          projects_completed: 0,
          date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (logs: TimeLog[]) => {
    const newTotals = {
      learning: 0,
      dsa: 0,
      projects: 0,
      interview: 0,
      other: 0,
    };

    logs.forEach((log) => {
      const category = categoryMap[log.category as keyof typeof categoryMap] || 'other';
      newTotals[category as keyof typeof newTotals] += log.hours;
    });

    setTotals(newTotals);
  };

  const calculateWeeklyData = (logs: TimeLog[]) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const dailyHours = Array(7).fill(0);

    logs.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= weekStart && logDate <= today) {
        const dayIndex = logDate.getDay();
        dailyHours[dayIndex] += log.hours;
      }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setWeeklyData(days.map((day, idx) => ({ day, hours: dailyHours[idx] })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.hours) return;

    const newLog: TimeLog = {
      id: '',
      user_id: user.id,
      category: formData.category,
      hours: parseFloat(formData.hours),
      description: formData.description || null,
      date: formData.date,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('time_logs').insert([newLog]);
      if (error) throw error;

      setFormData({
        category: 'Learning',
        hours: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      await fetchData();
    } catch (error) {
      console.error('Error saving time log:', error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('time_logs').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const totalHours = Object.values(totals).reduce((a, b) => a + b, 0);
  const skillsCompleted = profile?.skills?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Progress Tracking</h1>
          <p className="text-gray-400">Monitor your learning journey and track study hours</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-3xl font-bold text-white mt-2">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="text-primary-500" size={32} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Learning Hours</p>
                <p className="text-3xl font-bold text-white mt-2">{totals.learning.toFixed(1)}</p>
              </div>
              <BookOpen className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">DSA Hours</p>
                <p className="text-3xl font-bold text-white mt-2">{totals.dsa.toFixed(1)}</p>
              </div>
              <Code className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Project Hours</p>
                <p className="text-3xl font-bold text-white mt-2">{totals.projects.toFixed(1)}</p>
              </div>
              <Briefcase className="text-amber-500" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            <div className="stat-card space-y-4">
              <h2 className="text-xl font-bold text-white">Overall Progress</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-sm">Skills Completed</p>
                    <p className="text-white font-semibold">{skillsCompleted}</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(skillsCompleted * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-sm">Projects Completed</p>
                    <p className="text-white font-semibold">{progress?.projects_completed || 0}</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((progress?.projects_completed || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-sm">Weekly Study Hours</p>
                    <p className="text-white font-semibold">{weeklyData.reduce((a, b) => a + b.hours, 0).toFixed(1)}</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(weeklyData.reduce((a, b) => a + b.hours, 0) * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Analytics Chart */}
            <div className="stat-card space-y-4">
              <h2 className="text-xl font-bold text-white">Weekly Analytics</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Time Tracker Form */}
          <div className="stat-card space-y-4">
            <h2 className="text-xl font-bold text-white">Log Study Time</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option>Learning</option>
                  <option>DSA</option>
                  <option>Projects</option>
                  <option>Interview Prep</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="0.5"
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What did you work on?"
                  className="input-field resize-none"
                  rows={3}
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus size={18} />
                Log Time
              </button>
            </form>
          </div>
        </div>

        {/* Recent Time Logs */}
        <div className="stat-card space-y-4">
          <h2 className="text-xl font-bold text-white">Recent Time Logs</h2>
          <div className="space-y-2">
            {timeLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No time logs yet. Start logging your study time above.</p>
            ) : (
              timeLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${categoryColors[log.category as keyof typeof categoryColors] || 'bg-gray-500/20'} border border-white/10 hover:border-white/20 transition-all`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-gray-300">
                      {categoryIcons[log.category as keyof typeof categoryIcons]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{log.category}</p>
                      {log.description && (
                        <p className="text-gray-400 text-sm">{log.description}</p>
                      )}
                      <p className="text-gray-500 text-xs">{log.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white font-bold">{log.hours}h</p>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="stat-card space-y-4">
          <h2 className="text-xl font-bold text-white">Hours by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-gray-400 text-sm">Learning</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">{totals.learning.toFixed(1)}h</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-gray-400 text-sm">DSA</p>
              <p className="text-2xl font-bold text-purple-400 mt-2">{totals.dsa.toFixed(1)}h</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-gray-400 text-sm">Projects</p>
              <p className="text-2xl font-bold text-amber-400 mt-2">{totals.projects.toFixed(1)}h</p>
            </div>
            <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <p className="text-gray-400 text-sm">Interview</p>
              <p className="text-2xl font-bold text-pink-400 mt-2">{totals.interview.toFixed(1)}h</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
              <p className="text-gray-400 text-sm">Other</p>
              <p className="text-2xl font-bold text-gray-400 mt-2">{totals.other.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
