import { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const featureOptions = [
  'AI Roadmap Generator',
  'Resume Builder',
  'AI Mentor Chat',
  'Mock Interviews',
  'Project Generator',
  'Progress Tracking',
  'LeetCode Tracker',
  'Placement Hub',
  'Time Tracker',
];

export default function FeedbackPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [bestFeature, setBestFeature] = useState('');
  const [missingFeature, setMissingFeature] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('feedback').insert({
        user_id: user.id,
        best_feature: bestFeature || null,
        missing_feature: missingFeature || null,
        rating: rating || null,
        comments: comments || null,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-gray-400">
            Your feedback helps us improve SkillTree AI. We appreciate your time!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Feedback</h1>
            <p className="text-gray-400 text-sm">Help us improve SkillTree AI</p>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Overall Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Best Feature */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What's your favorite feature?
          </label>
          <select
            value={bestFeature}
            onChange={(e) => setBestFeature(e.target.value)}
            className="input-field"
          >
            <option value="">Select a feature...</option>
            {featureOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Missing Feature */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What feature would you like us to add?
          </label>
          <input
            type="text"
            value={missingFeature}
            onChange={(e) => setMissingFeature(e.target.value)}
            placeholder="Describe a feature you'd like to see..."
            className="input-field"
          />
        </div>

        {/* Comments */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Additional Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your thoughts, suggestions, or anything else..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (!rating && !bestFeature && !missingFeature && !comments)}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Submitting...'
          ) : (
            <>
              <Send size={18} />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
