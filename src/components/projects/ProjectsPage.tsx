import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Loader, Trash2, FolderOpen, Clock, ChevronRight,
  Lightbulb, Layers, Database, Wand2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AIProject {
  id: string;
  idea: string;
  title: string;
  overview: string;
  features: { name: string; description: string }[];
  tech_stack: Record<string, string[]>;
  folder_structure: string;
  database_schema: string;
  roadmap: { phase: string; duration: string; tasks: string[] }[];
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const EXAMPLE_IDEAS = [
  'A real-time collaborative code editor for pair programming',
  'A personal finance tracker with AI spending insights',
  'A job application tracker with resume builder',
  'A habit tracker with gamification and streaks',
  'A micro-SaaS for automated social media scheduling',
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<AIProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');
  const [showExamples, setShowExamples] = useState(true);

  useEffect(() => {
    if (user?.id) loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setProjects(data ?? []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim() || !user) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-project-gen`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);

      const { data, error: insertErr } = await supabase
        .from('ai_projects')
        .insert({
          user_id: user.id,
          idea: idea.trim(),
          title: json.title,
          overview: json.overview,
          features: json.features,
          tech_stack: json.techStack,
          folder_structure: json.folderStructure,
          database_schema: json.databaseSchema,
          roadmap: json.roadmap,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setProjects(prev => [data as AIProject, ...prev]);
      setIdea('');
      navigate(`/dashboard/projects/${data.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      setError(msg.includes('API key') ? msg : `Something went wrong: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ai_projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
            <Wand2 size={28} className="text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Project Generator</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Describe your project idea and let Gemini AI generate a complete blueprint — overview, features, tech stack, folder structure, database schema, and development roadmap.
          </p>
        </div>

        {/* Input area */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-primary-400" />
              <span className="text-sm font-medium text-white">Describe your project idea</span>
            </div>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="e.g., A real-time collaborative whiteboard app for remote teams with video chat, sticky notes, and export to PDF..."
              className="w-full h-28 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 resize-none text-sm leading-relaxed"
              disabled={generating}
            />

            {showExamples && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Or try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_IDEAS.map(ex => (
                    <button
                      key={ex}
                      onClick={() => { setIdea(ex); setShowExamples(false); }}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30 rounded-lg text-gray-300 hover:text-white transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!idea.trim() || generating}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating blueprint with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Project Blueprint
                </>
              )}
            </button>
          </div>
        </div>

        {/* Projects list */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FolderOpen size={18} className="text-primary-400" />
              Your Generated Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  className="glass-card p-5 cursor-pointer hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.idea}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {project.overview}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Layers size={12} />
                      {project.features?.length ?? 0} features
                    </span>
                    <span className="flex items-center gap-1">
                      <Database size={12} />
                      {Object.values(project.tech_stack ?? {}).flat().length} tech
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
