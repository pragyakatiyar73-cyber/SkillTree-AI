import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Layers, Database, GitBranch, Rocket, FolderTree,
  CheckCircle, Clock, ChevronDown, ChevronUp, Copy, Check
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<AIProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'tech' | 'folders' | 'schema' | 'roadmap'>('overview');
  const [copied, setCopied] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (id && user?.id) loadProject(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const loadProject = async (projectId: string) => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (err) throw err;
      if (!data) {
        setError('Project not found or you do not have access.');
      } else {
        setProject(data as AIProject);
      }
    } catch {
      setError('Project not found or you do not have access.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/dashboard/projects')} className="btn-primary">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: typeof activeTab; label: string; icon: typeof Layers }[] = [
    { key: 'overview', label: 'Overview', icon: Rocket },
    { key: 'features', label: 'Features', icon: Layers },
    { key: 'tech', label: 'Tech Stack', icon: Database },
    { key: 'folders', label: 'Structure', icon: FolderTree },
    { key: 'schema', label: 'Database', icon: Database },
    { key: 'roadmap', label: 'Roadmap', icon: GitBranch },
  ];

  const totalTech = Object.values(project.tech_stack ?? {}).flat().length;
  const totalFeatures = project.features?.length ?? 0;
  const totalPhases = project.roadmap?.length ?? 0;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{project.title}</h1>
            <p className="text-xs text-gray-500 truncate">{project.idea}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">{totalFeatures}</p>
            <p className="text-xs text-gray-500 mt-1">Features</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">{totalTech}</p>
            <p className="text-xs text-gray-500 mt-1">Technologies</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">{totalPhases}</p>
            <p className="text-xs text-gray-500 mt-1">Phases</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-thin">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === key
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <Rocket size={20} className="text-primary-400" />
                  Project Overview
                </h2>
                <div className="text-gray-300 text-sm leading-relaxed space-y-3 whitespace-pre-wrap">
                  {project.overview}
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Generated from idea: <span className="text-gray-400 italic">"{project.idea}"</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers size={20} className="text-primary-400" />
                Features ({totalFeatures})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.features.map((f, i) => (
                  <div key={i} className="glass-card p-5 hover:border-primary-500/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={15} className="text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">{f.name}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database size={20} className="text-primary-400" />
                Tech Stack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(project.tech_stack ?? {}).map(([layer, items]) => (
                  items.length > 0 && (
                    <div key={layer} className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-primary-300 capitalize mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                        {layer}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item: string) => (
                          <span
                            key={item}
                            className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderTree size={20} className="text-primary-400" />
                  Folder Structure
                </h2>
                <button
                  onClick={() => handleCopy(project.folder_structure)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="glass-card p-5 overflow-x-auto">
                <pre className="text-xs font-mono text-primary-200 leading-relaxed whitespace-pre">
                  {project.folder_structure}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database size={20} className="text-primary-400" />
                  Database Schema
                </h2>
                <button
                  onClick={() => handleCopy(project.database_schema)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="glass-card p-5 overflow-x-auto">
                <pre className="text-xs font-mono text-primary-200 leading-relaxed whitespace-pre">
                  {project.database_schema}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GitBranch size={20} className="text-primary-400" />
                Development Roadmap
              </h2>
              <div className="relative pl-6 space-y-4">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-primary-500/20" />

                {project.roadmap.map((phase, i) => {
                  const isOpen = expandedPhases.has(i);
                  return (
                    <div key={i} className="relative">
                      <div className="absolute -left-[17px] top-2 w-3 h-3 rounded-full bg-primary-500 border-2 border-surface-950" />
                      <div className="glass-card p-4 hover:border-primary-500/30 transition-all">
                        <button
                          onClick={() => togglePhase(i)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white">{phase.phase}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={11} />
                              {phase.duration}
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronUp size={14} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={14} className="text-gray-500" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            {phase.tasks.map((task, ti) => (
                              <div key={ti} className="flex items-start gap-2.5">
                                <CheckCircle size={13} className="text-primary-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-300">{task}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
