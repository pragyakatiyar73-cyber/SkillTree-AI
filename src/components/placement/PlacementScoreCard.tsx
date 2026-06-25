import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePlacementScore, type PlacementScore } from '../../lib/placementScore';
import { Shield, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PlacementScoreCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState<PlacementScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScore = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await calculatePlacementScore(user.id);
      setScore(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadScore();
  }, [loadScore]);

  // Auto-update when progress changes via realtime subscription
  useEffect(() => {
    if (!user) return;
    let timeout: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel('placement-score-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress', filter: `user_id=eq.${user.id}` },
        () => {
          // Debounce: wait 500ms then recalculate
          clearTimeout(timeout);
          timeout = setTimeout(loadScore, 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leetcode_stats', filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(loadScore, 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(loadScore, 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mock_interviews', filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(loadScore, 500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resumes', filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(loadScore, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [user, loadScore]);

  if (loading) {
    return (
      <div className="stat-card flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-emerald-400" size={24} />
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className="stat-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-300">Placement Readiness</h3>
        </div>
        <p className="text-xs text-gray-500">Unable to calculate score.</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  return (
    <div
      className="stat-card p-6 cursor-pointer hover:border-primary-500/30 transition-all duration-300"
      onClick={() => navigate('/dashboard/placement')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-300">Placement Readiness</h3>
        </div>
        <ChevronRight size={16} className="text-gray-500" />
      </div>

      <div className="flex items-center gap-5">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 progress-ring" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              stroke={score.strokeColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{score.overall}</span>
            <span className="text-[10px] text-gray-400">/100</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold mb-2 ${score.levelColor}`}>{score.level}</div>
          <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${score.progressBarColor}`}
              style={{ width: `${score.overall}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            {score.strongAreas.length > 0 && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                {score.strongAreas.length} Strong
              </span>
            )}
            {score.weakAreas.length > 0 && (
              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                {score.weakAreas.length} Weak
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
