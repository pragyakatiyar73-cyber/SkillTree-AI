import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, MessageSquare, Plus, Trash2, Sparkles,
  Youtube, ExternalLink, ChevronRight, BookOpen, Brain,
  Target, Zap, X, Menu, CheckCircle2, Calendar, Lightbulb,
  FolderKanban, TrendingUp, AlertTriangle, Clock, Award,
  BarChart3, ChevronDown, Flame, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  session_id?: string;
}

interface MentorSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  is_completed: boolean;
  due_date: string;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  topics: string[];
  duration_weeks: number;
  hours_per_week: number;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const QUICK_PROMPTS = [
  { icon: BookOpen, label: 'Study Plan', prompt: 'Create a 3-month study plan for becoming a full-stack developer' },
  { icon: Brain, label: 'Explain DSA', prompt: 'Explain dynamic programming with examples and when to use it' },
  { icon: Target, label: 'Interview Prep', prompt: 'Give me top 10 must-know topics for software engineering interviews' },
  { icon: Zap, label: 'Quiz Me', prompt: 'Quiz me on React hooks — give me 5 questions with answers' },
];

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 ml-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-primary-300 mt-2 mb-1">{children}</h3>,
        code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
          inline ? (
            <code className="px-1.5 py-0.5 bg-black/30 rounded text-primary-300 text-xs font-mono">
              {children}
            </code>
          ) : (
            <pre className="my-2 p-3 bg-black/40 rounded-lg overflow-x-auto">
              <code className="text-primary-200 text-xs font-mono leading-relaxed">{children}</code>
            </pre>
          ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary-500 pl-3 my-2 text-gray-400 italic">{children}</blockquote>
        ),
        hr: () => <hr className="my-3 border-white/10" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="w-full text-xs border border-white/10 rounded">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="px-2 py-1 bg-white/10 font-semibold text-left border-b border-white/10">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1 border-b border-white/5">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── YouTube Panel ────────────────────────────────────────────────────────────

function YouTubePanel({
  videos,
  loading,
  query,
  onClose,
}: {
  videos: YouTubeVideo[];
  loading: boolean;
  query: string;
  onClose: () => void;
}) {
  if (!loading && videos.length === 0 && !query) return null;

  return (
    <div className="w-full border-t border-white/10 bg-surface-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Youtube size={16} className="text-red-400" />
          <span className="text-sm font-semibold text-white">Learn with YouTube</span>
          {query && <span className="text-xs text-gray-500 truncate max-w-[160px]">— {query}</span>}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent flex-shrink-0" />
          <span className="text-sm text-gray-400">Finding videos for you...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">No videos found.</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin">
          {videos.map((v) => (
            <a
              key={v.videoId}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-52 group rounded-xl overflow-hidden border border-white/10 hover:border-red-500/40 transition-all bg-white/5 hover:bg-white/10"
            >
              <div className="relative">
                <img src={v.thumbnail} alt={v.title} className="w-full h-28 object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center">
                    <ExternalLink size={14} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-white line-clamp-2 leading-snug mb-1">{v.title}</p>
                <p className="text-xs text-gray-500 truncate">{v.channel}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle }: { task: DailyTask; onToggle: (id: string, completed: boolean) => void }) {
  const priorityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  const categoryColors = {
    dsa: 'text-emerald-400',
    project: 'text-purple-400',
    learning: 'text-blue-400',
    interview: 'text-orange-400',
    resume: 'text-cyan-400',
    communication: 'text-pink-400',
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${task.is_completed ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id, !task.is_completed)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
            task.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500 hover:border-emerald-400'
          }`}
        >
          {task.is_completed && <CheckCircle2 size={12} className="text-white" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs ${categoryColors[task.category as keyof typeof categoryColors] || 'text-gray-400'}`}>
              {task.category}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={10} /> {task.due_date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('dashboard');

  // Chat state
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MentorSession | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytQuery, setYtQuery] = useState('');
  const [ytVisible, setYtVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');

  // Dashboard state
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [skillProgress, setSkillProgress] = useState<Record<string, number>>({});
  const [projectIdeas, setProjectIdeas] = useState<string[]>([]);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('dsa');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ── Load sessions ────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    setSessionsLoading(true);
    try {
      const { data, error: err } = await supabase.from('mentor_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (err) throw err;
      const list = data ?? [];
      setSessions(list);
      if (list.length > 0 && !sessions.length) {
        setCurrentSession(list[0]);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setSessionsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    setMessages([]);
    try {
      const { data, error: err } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (err) throw err;
      setMessages((data ?? []) as Message[]);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentSession?.id) {
      loadMessages(currentSession.id);
    }
  }, [currentSession?.id]);

  // ── Load Dashboard Data ──────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setTasksLoading(true);
    try {
      // Daily tasks
      const today = new Date().toISOString().split('T')[0];
      const { data: tasksData } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', today)
        .order('priority', { ascending: false });
      if (tasksData) setDailyTasks(tasksData);

      // LeetCode stats for weak areas
      const { data: lcData } = await supabase.from('leetcode_stats').select('*').eq('user_id', user.id).maybeSingle();
      const { data: lcTopics } = await supabase.from('leetcode_topic_progress').select('*').eq('user_id', user.id);
      
      const weaknesses: string[] = [];
      if (lcTopics) {
        lcTopics.forEach((t: { topic_name: string; problems_solved: number; total_problems: number }) => {
          const ratio = t.total_problems > 0 ? t.problems_solved / t.total_problems : 0;
          if (ratio < 0.3) weaknesses.push(t.topic_name);
        });
      }
      if (!lcData || (lcData.easy + lcData.medium + lcData.hard) < 20) {
        weaknesses.push('DSA Fundamentals');
      }
      if (weaknesses.length === 0) {
        weaknesses.push('Advanced System Design');
        weaknesses.push('Behavioral Interview Skills');
      }
      setWeakAreas(weaknesses.slice(0, 5));

      // Skill progress from user_topic_progress
      const { data: topicProgress } = await supabase.from('user_topic_progress').select('*, learning_topics(name, category)').eq('user_id', user.id);
      const skillMap: Record<string, number> = {};
      if (topicProgress) {
        topicProgress.forEach((tp: { learning_topics: { category: string }; progress_percent: number }) => {
          const cat = tp.learning_topics?.category || 'General';
          skillMap[cat] = Math.max(skillMap[cat] || 0, tp.progress_percent || 0);
        });
      }
      setSkillProgress(skillMap);

      // Project recommendations based on skills
      const ideas: string[] = [];
      const skills = profile?.skills || [];
      if (skills.includes('React') || skills.includes('JavaScript') || skills.includes('TypeScript')) {
        ideas.push('Full-Stack Task Manager with real-time updates');
        ideas.push('E-commerce dashboard with analytics charts');
      }
      if (skills.includes('Node.js') || skills.includes('Python')) {
        ideas.push('REST API with authentication and rate limiting');
        ideas.push('Microservices-based URL shortener');
      }
      if (skills.includes('React') && skills.includes('Node.js')) {
        ideas.push('Social media platform with real-time chat');
      }
      if (ideas.length === 0) {
        ideas.push('Portfolio website with dynamic blog');
        ideas.push('Weather dashboard with location API');
        ideas.push('Todo app with drag-and-drop prioritization');
      }
      setProjectIdeas(ideas.slice(0, 4));

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [user?.id, profile?.skills]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, loadDashboardData]);

  // ── Task toggle ─────────────────────────────────────────────────────────
  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await supabase.from('daily_tasks').update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', taskId);
      setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
    } catch (err) {
      console.error('Toggle task error:', err);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('daily_tasks').insert([{
        user_id: user.id,
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        priority: newTaskPriority,
        due_date: today,
      }]).select().single();
      if (data) {
        setDailyTasks(prev => [data, ...prev]);
        setNewTaskTitle('');
        setShowTaskInput(false);
      }
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  // ── Create new session ───────────────────────────────────────────────────
  const createSession = async (firstMessage?: string) => {
    if (!user?.id) return null;
    const title = firstMessage ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '') : 'New Chat';
    const { data, error: err } = await supabase.from('mentor_sessions').insert({ user_id: user.id, title }).select().single();
    if (err) throw err;
    const session = data as MentorSession;
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    setMessages([]);
    setYtVideos([]);
    setYtVisible(false);
    return session;
  };

  const handleNewChat = async () => {
    try {
      await createSession();
      setSidebarOpen(false);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  // ── Delete session ───────────────────────────────────────────────────────
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('mentor_sessions').delete().eq('id', sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSession(remaining[0]);
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    }
  };

  // ── YouTube search ─────────────────────────────────────────────────────
  const searchYouTube = async (topic: string) => {
    setYtVisible(true);
    setYtLoading(true);
    setYtQuery(topic);
    setYtVideos([]);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/youtube-search`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'YouTube search failed');
      setYtVideos(json.videos ?? []);
    } catch (e) {
      console.error('YouTube search error:', e);
    } finally {
      setYtLoading(false);
    }
  };

  const extractTopic = (text: string): string => {
    const cleaned = text.replace(/[?!.,;:]/g, '').replace(/\b(what is|how to|explain|tell me about|show me|teach me|i want to learn|help me with|create|give me|can you)\b/gi, '').trim();
    return cleaned.slice(0, 60);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming || !user?.id) return;
    setInput('');
    setError('');

    let session = currentSession;
    if (!session) {
      try {
        session = await createSession(content);
        if (!session) return;
      } catch {
        setError('Failed to start a new chat session. Please try again.');
        return;
      }
    }

    if (messages.length === 0) {
      const title = content.slice(0, 60) + (content.length > 60 ? '…' : '');
      await supabase.from('mentor_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', session.id);
      setCurrentSession(s => s ? { ...s, title } : s);
      setSessions(prev => prev.map(s => s.id === session!.id ? { ...s, title } : s));
    }

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString(), session_id: session.id };
    setMessages(prev => [...prev, userMsg]);
    try {
      await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content, session_id: session.id });
    } catch (e) {
      console.error('Failed to save user message:', e);
    }

    const topic = extractTopic(content);
    if (topic.length > 3) searchYouTube(topic);

    setStreaming(true);
    setStreamingContent('');
    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    abortRef.current = new AbortController();
    let fullResponse = '';

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-mentor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Request failed (${res.status})`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        const json = await res.json();
        fullResponse = json.content ?? json.message ?? JSON.stringify(json);
        setStreamingContent(fullResponse);
      } else {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                fullResponse += delta;
                setStreamingContent(fullResponse);
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'AI response failed';
      setError(msg.includes('API key') ? msg : `Something went wrong: ${msg}`);
      fullResponse = '';
    }

    setStreaming(false);
    setStreamingContent('');
    if (fullResponse) {
      const aiMsg: Message = { id: `ai-${Date.now()}`, role: 'assistant', content: fullResponse, created_at: new Date().toISOString(), session_id: session.id };
      setMessages(prev => [...prev, aiMsg]);
      try {
        await Promise.all([
          supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: fullResponse, session_id: session.id }),
          supabase.from('mentor_sessions').update({ updated_at: new Date().toISOString() }).eq('id', session.id),
        ]);
      } catch (e) {
        console.error('Failed to save AI message:', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamingContent('');
  };

  // ── Dashboard Content ────────────────────────────────────────────────────
  const completedTasks = dailyTasks.filter(t => t.is_completed).length;
  const pendingTasks = dailyTasks.filter(t => !t.is_completed);
  const completionRate = dailyTasks.length > 0 ? Math.round((completedTasks / dailyTasks.length) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed sm:static inset-y-0 left-0 z-40 w-72 flex flex-col border-r border-white/10 bg-surface-900 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Bot size={16} className="text-primary-400" />
            </div>
            <span className="text-sm font-bold text-white">AI Mentor</span>
          </div>
          <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg text-primary-400 text-xs font-medium transition-all">
            <Plus size={13} /> New Chat
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'chat' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Chat
          </button>
        </div>

        {/* Sessions list (chat tab only) */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare size={28} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No chats yet</p>
                <p className="text-gray-600 text-xs mt-1">Start a conversation below</p>
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => { setCurrentSession(session); setSidebarOpen(false); }}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm cursor-pointer ${currentSession?.id === session.id ? 'bg-primary-500/15 text-white border border-primary-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                  <span className="flex-1 truncate text-xs">{session.title}</span>
                  <div onClick={(e) => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={13} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Dashboard sidebar content */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Stats */}
            <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-primary-400" />
                <span className="text-xs font-semibold text-white">Today's Progress</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Tasks</span>
                  <span className="text-white">{completedTasks}/{dailyTasks.length}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-primary-400">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Weak Areas */}
            {weakAreas.length > 0 && (
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs font-semibold text-white">Focus Areas</span>
                </div>
                <div className="space-y-1">
                  {weakAreas.map((area, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <ChevronRight size={10} className="text-red-400" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Progress */}
            {Object.entries(skillProgress).length > 0 && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Skill Progress</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(skillProgress).map(([skill, progress]) => (
                    <div key={skill}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{skill}</span>
                        <span className="text-emerald-400">{progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar footer tips */}
            <div className="flex items-start gap-2 p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
              <Sparkles size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Ask me to create study plans, explain concepts, generate quizzes, or recommend resources.
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-surface-900/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors sm:hidden">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={16} className="text-primary-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">
              {activeTab === 'dashboard' ? 'AI Mentor Dashboard' : (currentSession?.title ?? 'AI Mentor')}
            </span>
          </div>
          {/* Tab switcher (mobile/desktop inline) */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'chat' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Chat
            </button>
          </div>
        </div>

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Welcome Banner */}
              <div className="stat-card bg-gradient-to-br from-primary-500/10 to-emerald-500/10 border-primary-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Award className="text-primary-400" size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Your AI Learning Command Center</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Track daily tasks, identify weak areas, get project recommendations, and monitor your skill progress.
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-emerald-400" size={20} />
                    <h2 className="text-lg font-bold text-white">Daily Tasks</h2>
                    <span className="text-xs text-gray-500">{completedTasks}/{dailyTasks.length} completed</span>
                  </div>
                  <button
                    onClick={() => setShowTaskInput(!showTaskInput)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium transition-all"
                  >
                    <Plus size={13} /> Add Task
                  </button>
                </div>

                {/* Add Task Input */}
                {showTaskInput && (
                  <div className="stat-card space-y-3">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="What do you want to accomplish today?"
                      className="input-field w-full"
                      onKeyDown={(e) => e.key === 'Enter' && createTask()}
                    />
                    <div className="flex gap-3">
                      <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} className="input-field text-sm py-2">
                        <option value="dsa">DSA</option>
                        <option value="project">Project</option>
                        <option value="learning">Learning</option>
                        <option value="interview">Interview</option>
                        <option value="resume">Resume</option>
                        <option value="communication">Communication</option>
                      </select>
                      <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="input-field text-sm py-2">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button onClick={createTask} disabled={!newTaskTitle.trim()} className="btn-primary text-sm px-4">Create</button>
                      <button onClick={() => setShowTaskInput(false)} className="btn-secondary text-sm px-4">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Tasks List */}
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                  </div>
                ) : dailyTasks.length === 0 ? (
                  <div className="stat-card text-center py-8">
                    <Calendar className="text-gray-600 mx-auto mb-3" size={32} />
                    <p className="text-gray-400 text-sm">No tasks for today yet</p>
                    <p className="text-gray-500 text-xs mt-1">Add tasks or ask the AI to generate a study plan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.map(task => (
                      <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                    ))}
                    {dailyTasks.filter(t => t.is_completed).map(task => (
                      <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                    ))}
                  </div>
                )}
              </div>

              {/* Grid: Weak Areas + Project Ideas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weak Areas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-400" size={20} />
                    <h2 className="text-lg font-bold text-white">Areas to Improve</h2>
                  </div>
                  <div className="stat-card space-y-3">
                    {weakAreas.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No weak areas identified yet. Keep practicing!</p>
                    ) : (
                      weakAreas.map((area, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-amber-400">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{area}</p>
                            <p className="text-xs text-gray-500">Focus on this topic to strengthen your skills</p>
                          </div>
                          <button
                            onClick={() => { setActiveTab('chat'); setInput(`Help me improve my ${area} skills. Create a focused study plan.`); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                          >
                            Get Help
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Project Recommendations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="text-purple-400" size={20} />
                    <h2 className="text-lg font-bold text-white">Recommended Projects</h2>
                    <span className="text-xs text-gray-500">Based on your skills</span>
                  </div>
                  <div className="stat-card space-y-3">
                    {projectIdeas.map((idea, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <FolderKanban size={14} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white group-hover:text-purple-300 transition-colors">{idea}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab('chat'); setInput(`Help me plan and build this project: ${idea}. Give me a step-by-step roadmap.`); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400"
                        >
                          Plan
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setActiveTab('chat'); setInput(`Suggest more project ideas based on my skills: ${(profile?.skills || []).join(', ')}`); }}
                      className="w-full text-center text-xs text-gray-500 hover:text-primary-400 transition-colors py-2"
                    >
                      Get more project ideas from AI
                    </button>
                  </div>
                </div>
              </div>

              {/* Skill Progress */}
              {Object.entries(skillProgress).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-400" size={20} />
                    <h2 className="text-lg font-bold text-white">Skill Progress</h2>
                  </div>
                  <div className="stat-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(skillProgress).map(([skill, progress]) => (
                        <div key={skill} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white">{skill}</span>
                            <span className={`text-sm font-bold ${progress >= 70 ? 'text-emerald-400' : progress >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="text-primary-400" size={20} />
                  <h2 className="text-lg font-bold text-white">AI Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Study Plan', icon: BookOpen, prompt: 'Create a personalized 4-week study plan for me' },
                    { label: 'Weak Areas', icon: AlertTriangle, prompt: 'Analyze my weak areas and create a focused improvement plan' },
                    { label: 'Daily Tasks', icon: Calendar, prompt: 'Generate 5 high-impact tasks for today based on my goals' },
                    { label: 'Project Ideas', icon: FolderKanban, prompt: 'Suggest 3 projects that would strengthen my portfolio' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => { setActiveTab('chat'); setInput(action.prompt); }}
                      className="stat-card hover:border-primary-500/30 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-500/15 group-hover:bg-primary-500/25 flex items-center justify-center mb-3 transition-colors">
                        <action.icon size={18} className="text-primary-400" />
                      </div>
                      <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">{action.label}</p>
                      <p className="text-xs text-gray-500 mt-1">Ask AI</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                </div>
              ) : !messagesLoading && messages.length === 0 && !streaming ? (
                <WelcomeScreen onPrompt={handleSend} />
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                  {messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {streaming && (
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mt-0.5">
                        <Bot size={16} className="text-primary-400" />
                      </div>
                      <div className="flex-1 max-w-2xl bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200">
                        {streamingContent ? (
                          <MarkdownContent content={streamingContent} />
                        ) : (
                          <TypingDots />
                        )}
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="mx-auto max-w-lg p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* YouTube panel */}
            {ytVisible && (
              <YouTubePanel videos={ytVideos} loading={ytLoading} query={ytQuery} onClose={() => setYtVisible(false)} />
            )}

            {/* Input area */}
            <div className="border-t border-white/10 bg-surface-900/90 backdrop-blur-sm px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-3 items-end bg-white/5 border border-white/10 hover:border-white/20 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/30 rounded-2xl transition-all px-4 py-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything — concepts, study plans, quizzes, interview tips..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none leading-relaxed min-h-[24px] max-h-[160px]"
                    rows={1}
                    disabled={streaming}
                  />
                  {streaming ? (
                    <button
                      onClick={handleStopStreaming}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 flex items-center justify-center transition-all"
                      title="Stop"
                    >
                      <div className="w-3 h-3 bg-red-400 rounded-sm" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg shadow-primary-500/25"
                      title="Send (Enter)"
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Enter to send · Shift+Enter for new line · YouTube videos shown automatically
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-0.5 ${isUser ? 'bg-primary-500/20 border-primary-500/30' : 'bg-white/10 border-white/15'}`}>
        {isUser ? (
          <span className="text-xs font-bold text-primary-400">You</span>
        ) : (
          <Bot size={16} className="text-primary-400" />
        )}
      </div>
      <div className={`max-w-[85%] sm:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-primary-500/20 text-white rounded-tr-sm border border-primary-500/20' : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mb-6">
        <Bot size={32} className="text-primary-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Your AI Mentor</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">
        I can explain concepts, build study plans, generate quizzes, suggest resources, and keep you motivated on your learning journey.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPrompt(prompt)}
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30 rounded-xl text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 group-hover:bg-primary-500/25 flex items-center justify-center flex-shrink-0 transition-colors">
              <Icon size={16} className="text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{prompt.slice(0, 40)}…</p>
            </div>
            <ChevronRight size={14} className="text-gray-600 group-hover:text-primary-400 ml-auto transition-colors" />
          </button>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><Bot size={12} className="text-primary-500" /> Powered by GPT-4o mini</span>
        <span>·</span>
        <span className="flex items-center gap-1.5"><Youtube size={12} className="text-red-500" /> Auto YouTube search</span>
      </div>
    </div>
  );
}
