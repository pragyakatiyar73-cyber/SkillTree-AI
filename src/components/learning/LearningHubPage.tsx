import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  BookOpen, Play, ExternalLink, Clock, ChevronRight,
  Filter, Target, Flame, Brain, Trophy, ArrowRight, Lock, Star, Layers
} from 'lucide-react';

interface LearningTopic {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  prerequisites: string[];
  estimated_hours: number;
  order_index: number;
}

interface LearningResource {
  id: string;
  topic_id: string;
  title: string;
  url: string;
  type: string;
  difficulty: string;
  estimated_minutes: number;
  is_free: boolean;
  provider: string;
}

interface UserTopicProgress {
  id: string;
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  progress_percent: number;
  hours_spent: number;
  started_at: string | null;
  completed_at: string | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  DSA: <Brain size={18} />,
  Frontend: <Layers size={18} />,
  Backend: <ServerIcon size={18} />,
  'System Design': <Target size={18} />,
  DevOps: <Flame size={18} />,
};

function ServerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_COLORS = {
  not_started: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  mastered: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  mastered: 'Mastered',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  article: <BookOpen size={14} />,
  video: <Play size={14} />,
  course: <Layers size={14} />,
  book: <BookOpen size={14} />,
  documentation: <BookOpen size={14} />,
  practice: <Target size={14} />,
};

export default function LearningHubPage() {
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [progress, setProgress] = useState<Record<string, UserTopicProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'recommended'>('all');

  const categories = ['All', 'DSA', 'Frontend', 'Backend', 'System Design', 'DevOps'];
  const difficulties = ['All', 'beginner', 'intermediate', 'advanced'];

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: topicsData } = await supabase.from('learning_topics').select('*').order('order_index');
      const { data: resourcesData } = await supabase.from('learning_resources').select('*');
      const { data: progressData } = await supabase.from('user_topic_progress').select('*').eq('user_id', user.id);

      if (topicsData) setTopics(topicsData);
      if (resourcesData) setResources(resourcesData);
      if (progressData) {
        const map: Record<string, UserTopicProgress> = {};
        progressData.forEach((p: UserTopicProgress) => { map[p.topic_id] = p; });
        setProgress(map);
      }
    } catch (err) {
      console.error('Error fetching learning data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProgress = async (topicId: string, newStatus: UserTopicProgress['status']) => {
    if (!user) return;
    const now = new Date().toISOString();
    const existing = progress[topicId];
    const progressPercent = newStatus === 'mastered' ? 100 : newStatus === 'completed' ? 90 : newStatus === 'in_progress' ? 25 : 0;

    const payload = {
      user_id: user.id,
      topic_id: topicId,
      status: newStatus,
      progress_percent: progressPercent,
      hours_spent: existing?.hours_spent || 0,
      started_at: existing?.started_at || (newStatus !== 'not_started' ? now : null),
      completed_at: newStatus === 'completed' || newStatus === 'mastered' ? now : existing?.completed_at || null,
    };

    try {
      if (existing?.id) {
        await supabase.from('user_topic_progress').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('user_topic_progress').insert([payload]);
      }
      await fetchData();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const getTopicResources = (topicId: string) => resources.filter((r) => r.topic_id === topicId);

  const getNextRecommendedTopics = () => {
    const completed = new Set(Object.entries(progress).filter(([, p]) => p.status === 'completed' || p.status === 'mastered').map(([tid]) => tid));
    return topics.filter((t) => {
      const p = progress[t.id];
      if (p?.status === 'completed' || p?.status === 'mastered') return false;
      return t.prerequisites.every((pr) => completed.has(pr));
    }).slice(0, 5);
  };

  const filteredTopics = topics.filter((t) => {
    const p = progress[t.id];
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'All' && t.difficulty !== selectedDifficulty) return false;
    if (activeTab === 'in_progress') return p?.status === 'in_progress';
    if (activeTab === 'completed') return p?.status === 'completed' || p?.status === 'mastered';
    if (activeTab === 'recommended') {
      const completed = new Set(Object.entries(progress).filter(([, pr]) => pr.status === 'completed' || pr.status === 'mastered').map(([tid]) => tid));
      return t.prerequisites.every((pr) => completed.has(pr)) && (!p || p.status === 'not_started');
    }
    return true;
  });

  const totalHours = Object.values(progress).reduce((sum, p) => sum + (p.hours_spent || 0), 0);
  const completedCount = Object.values(progress).filter((p) => p.status === 'completed' || p.status === 'mastered').length;
  const inProgressCount = Object.values(progress).filter((p) => p.status === 'in_progress').length;

  const getNextTopic = () => {
    const recommended = getNextRecommendedTopics();
    return recommended[0] || null;
  };

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
            <BookOpen className="text-emerald-400" size={28} />
            AI Learning Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">Curated learning paths with AI-powered recommendations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="text-emerald-400" size={20} />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-1">of {topics.length} topics</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-400" size={20} />
            <span className="text-xs text-gray-500">Hours</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalHours}</p>
          <p className="text-xs text-gray-500 mt-1">learning logged</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <Flame className="text-amber-400" size={20} />
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-white">{inProgressCount}</p>
          <p className="text-xs text-gray-500 mt-1">active topics</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-purple-400" size={20} />
            <span className="text-xs text-gray-500">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{profile?.current_streak || 0}</p>
          <p className="text-xs text-gray-500 mt-1">days active</p>
        </div>
      </div>

      {/* Next Recommended Topic */}
      {activeTab === 'all' && (
        <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="text-emerald-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-emerald-400 mb-1">AI Recommended Next Topic</h3>
              {getNextTopic() ? (
                <div>
                  <p className="text-lg font-bold text-white">{getNextTopic()?.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{getNextTopic()?.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-lg border ${DIFFICULTY_COLORS[getNextTopic()?.difficulty || 'beginner']}`}>
                      {getNextTopic()?.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {getNextTopic()?.estimated_hours}h
                    </span>
                    <button
                      onClick={() => {
                        const nt = getNextTopic();
                        if (nt) updateProgress(nt.id, 'in_progress');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      Start Learning
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">All topics completed! Explore advanced topics or start projects.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'all' as const, label: 'All Topics', count: topics.length },
          { id: 'recommended' as const, label: 'Recommended', count: getNextRecommendedTopics().length },
          { id: 'in_progress' as const, label: 'In Progress', count: inProgressCount },
          { id: 'completed' as const, label: 'Completed', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs text-gray-500">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-sm text-gray-400">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Level:</span>
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                selectedDifficulty === d
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="space-y-3">
        {filteredTopics.map((topic) => {
          const p = progress[topic.id];
          const isExpanded = expandedTopic === topic.id;
          const topicResources = getTopicResources(topic.id);
          const isLocked = topic.prerequisites.some((pr) => {
            const prTopic = topics.find((t) => t.name === pr);
            if (!prTopic) return false;
            const prProgress = progress[prTopic.id];
            return !prProgress || (prProgress.status !== 'completed' && prProgress.status !== 'mastered');
          });

          return (
            <div
              key={topic.id}
              className={`stat-card transition-all ${isExpanded ? 'ring-1 ring-emerald-500/20' : ''} ${isLocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {isLocked ? <Lock size={18} className="text-gray-500" /> : CATEGORY_ICONS[topic.category] || <Brain size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-white">{topic.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[topic.difficulty]}`}>
                          {topic.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                          {topic.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {topic.estimated_hours}h</span>
                        <span className="flex items-center gap-1"><BookOpen size={12} /> {topicResources.length} resources</span>
                        {topic.prerequisites.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Lock size={12} /> Requires: {topic.prerequisites.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p && (
                        <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {p && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${p.progress_percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{p.progress_percent}%</span>
                        <span className="text-xs text-gray-500">{p.hours_spent}h spent</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    {!isLocked && (
                      <>
                        {!p || p.status === 'not_started' ? (
                          <button
                            onClick={() => updateProgress(topic.id, 'in_progress')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            Start Learning
                          </button>
                        ) : p.status === 'in_progress' ? (
                          <>
                            <button
                              onClick={() => updateProgress(topic.id, 'completed')}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => updateProgress(topic.id, 'mastered')}
                              className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            >
                              Mark Mastered
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => updateProgress(topic.id, 'in_progress')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            Review Again
                          </button>
                        )}
                      </>
                    )}
                    {topicResources.length > 0 && (
                      <button
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'View'} Resources ({topicResources.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Resources */}
              {isExpanded && topicResources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Curated Resources</h4>
                  {topicResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400">{TYPE_ICONS[resource.type] || <BookOpen size={14} />}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">{resource.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span className="capitalize">{resource.type}</span>
                          <span>{resource.provider}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {resource.estimated_minutes}m</span>
                          {!resource.is_free && <span className="text-amber-400">Paid</span>}
                          <span className={`capitalize ${resource.difficulty === 'beginner' ? 'text-emerald-400' : resource.difficulty === 'advanced' ? 'text-red-400' : 'text-amber-400'}`}>
                            {resource.difficulty}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <Brain className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400">No topics found matching your filters.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); setActiveTab('all'); }}
            className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
