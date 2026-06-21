import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword, loading: authLoading, connectionError, retryConnection } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await retryConnection();
    setRetrying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch') || msg.includes('refused')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
              <p className="text-gray-400 text-sm">
                Unable to connect to the server. This may be due to your internet connection or the server being temporarily unavailable.
              </p>
            </div>
            <button onClick={handleRetry} disabled={retrying} className="btn-primary w-full flex items-center justify-center gap-2">
              <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Retrying...' : 'Retry Connection'}
            </button>
            <Link to="/login" className="block text-sm text-gray-400 hover:text-gray-300">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-950 to-surface-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-6">
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400 text-sm">
              Reset link sent! Check your email for instructions.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  disabled={loading || success}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || success}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            Check your email for a link to reset your password.
          </p>
        </div>
      </div>
    </div>
  );
}
