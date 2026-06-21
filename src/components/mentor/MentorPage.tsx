import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, MessageSquare, Plus, Trash2, Sparkles,
  Youtube, ExternalLink, ChevronRight, BookOpen, Brain,
  Target, Zap, X, Menu
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
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
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
        <div
          key={i}
          className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorPage() {
  const { user } = useAuth();

  // Sessions
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MentorSession | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Input / streaming
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // YouTube
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytQuery, setYtQuery] = useState('');
  const [ytVisible, setYtVisible] = useState(false);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');

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
      const { data, error: err } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (err) throw err;
      const list = data ?? [];
      setSessions(list);
      // Only set current session on initial load, not when it's already set
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

  // ── Load messages for current session ───────────────────────────────────

  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    setMessages([]);
    try {
      const { data, error: err } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
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

  // ── Create new session ───────────────────────────────────────────────────

  const createSession = async (firstMessage?: string) => {
    if (!user?.id) return null;
    const title = firstMessage
      ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '')
      : 'New Chat';
    const { data, error: err } = await supabase
      .from('mentor_sessions')
      .insert({ user_id: user.id, title })
      .select()
      .single();
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

  // ── YouTube search ───────────────────────────────────────────────────────

  const searchYouTube = async (topic: string) => {
    setYtVisible(true);
    setYtLoading(true);
    setYtQuery(topic);
    setYtVideos([]);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/youtube-search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
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

  // Extract a clean topic keyword from user message for YouTube
  const extractTopic = (text: string): string => {
    const cleaned = text
      .replace(/[?!.,;:]/g, '')
      .replace(/\b(what is|how to|explain|tell me about|show me|teach me|i want to learn|help me with|create|give me|can you)\b/gi, '')
      .trim();
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

    // If this is the first message in the session, update its title
    if (messages.length === 0) {
      const title = content.slice(0, 60) + (content.length > 60 ? '…' : '');
      await supabase.from('mentor_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', session.id);
      setCurrentSession(s => s ? { ...s, title } : s);
      setSessions(prev => prev.map(s => s.id === session!.id ? { ...s, title } : s));
    }

    // Persist user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      session_id: session.id,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content,
        session_id: session.id,
      });
    } catch (e) {
      console.error('Failed to save user message:', e);
    }

    // Kick off YouTube search in background
    const topic = extractTopic(content);
    if (topic.length > 3) searchYouTube(topic);

    // Stream AI response
    setStreaming(true);
    setStreamingContent('');

    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();
    let fullResponse = '';

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-mentor`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: historyForApi }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Request failed (${res.status})`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        // Fallback: non-streaming response (shouldn't happen, but handle gracefully)
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
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        created_at: new Date().toISOString(),
        session_id: session.id,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Persist AI message + bump session updated_at
      try {
        await Promise.all([
          supabase.from('chat_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
            session_id: session.id,
          }),
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

  // ── Empty state ───────────────────────────────────────────────────────────

  const showWelcome = !messagesLoading && messages.length === 0 && !streaming;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">

      {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed sm:static inset-y-0 left-0 z-40 w-72
          flex flex-col border-r border-white/10 bg-surface-900
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Bot size={16} className="text-primary-400" />
            </div>
            <span className="text-sm font-bold text-white">AI Mentor</span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg text-primary-400 text-xs font-medium transition-all"
          >
            <Plus size={13} />
            New Chat
          </button>
        </div>

        {/* Sessions list */}
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
              <button
                key={session.id}
                onClick={() => { setCurrentSession(session); setSidebarOpen(false); }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-left transition-all text-sm
                  ${currentSession?.id === session.id
                    ? 'bg-primary-500/15 text-white border border-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}
                `}
              >
                <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate text-xs">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </button>
            ))
          )}
        </div>

        {/* Sidebar footer tips */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-start gap-2 p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
            <Sparkles size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Ask me to create study plans, explain concepts, generate quizzes, or recommend resources.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar (mobile) */}
        <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-surface-900/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={16} className="text-primary-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">
              {currentSession?.title ?? 'AI Mentor'}
            </span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : showWelcome ? (
            <WelcomeScreen onPrompt={handleSend} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {/* Streaming bubble */}
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
          <YouTubePanel
            videos={ytVideos}
            loading={ytLoading}
            query={ytQuery}
            onClose={() => setYtVisible(false)}
          />
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
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-0.5
        ${isUser ? 'bg-primary-500/20 border-primary-500/30' : 'bg-white/10 border-white/15'}
      ">
        {isUser ? (
          <span className="text-xs font-bold text-primary-400">You</span>
        ) : (
          <Bot size={16} className="text-primary-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`
          max-w-[85%] sm:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-primary-500/20 text-white rounded-tr-sm border border-primary-500/20'
            : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10'}
        `}
      >
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
