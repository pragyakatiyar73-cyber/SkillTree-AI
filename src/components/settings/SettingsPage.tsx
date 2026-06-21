import { useState, useEffect } from 'react';
import { Moon, Sun, Lock, Trash2, Mail, User, GraduationCap, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface FormState {
  name: string;
  college: string;
  branch: string;
  year: string;
  goal: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const CAREER_GOALS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'AI Engineer',
  'Cyber Security',
  'DevOps',
  'Mobile Developer'
];

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formState, setFormState] = useState<FormState>({
    name: '',
    college: '',
    branch: '',
    year: '',
    goal: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormState({
        name: profile.name || '',
        college: profile.college || '',
        branch: profile.branch || '',
        year: profile.year || '',
        goal: profile.goal || '',
      });
    }
  }, [profile]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: formState.name,
        college: formState.college,
        branch: formState.branch,
        year: formState.year,
        goal: formState.goal,
      });
      showToast('success', 'Profile updated successfully!');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.newPassword) {
      showToast('error', 'New password is required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast('success', 'Password updated successfully!');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      showToast('success', 'Account deletion confirmed. Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {toast && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {toast.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <User size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    placeholder="Your name"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    College
                  </label>
                  <input
                    type="text"
                    value={formState.college}
                    onChange={(e) =>
                      setFormState({ ...formState, college: e.target.value })
                    }
                    placeholder="Your college"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={formState.branch}
                    onChange={(e) =>
                      setFormState({ ...formState, branch: e.target.value })
                    }
                    placeholder="e.g., Computer Science"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Year
                  </label>
                  <select
                    value={formState.year}
                    onChange={(e) =>
                      setFormState({ ...formState, year: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Select your year</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Career Goal
                  </label>
                  <select
                    value={formState.goal}
                    onChange={(e) =>
                      setFormState({ ...formState, goal: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Select your goal</option>
                    {CAREER_GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              {theme === 'dark' ? (
                <Moon size={24} className="text-emerald-400" />
              ) : (
                <Sun size={24} className="text-emerald-400" />
              )}
              <h2 className="text-2xl font-bold text-white">Appearance</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-400">Current theme: <span className="text-white font-semibold capitalize">{theme}</span></p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-white/5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => theme !== 'dark' && toggleTheme()}
                >
                  <Moon size={24} className="text-emerald-400 mb-2" />
                  <p className="font-medium text-white">Dark</p>
                </div>

                <div
                  className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-white/5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => theme !== 'light' && toggleTheme()}
                >
                  <Sun size={24} className="text-emerald-400 mb-2" />
                  <p className="font-medium text-white">Light</p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="btn-primary w-full"
              >
                Toggle Theme
              </button>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Account</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field bg-white/[0.03] disabled:opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Email cannot be changed. Contact support for assistance.
                </p>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={20} className="text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                      className="input-field"
                    />
                  </div>

                  <p className="text-xs text-gray-400">
                    Password must be at least 6 characters long.
                  </p>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={24} className="text-red-400" />
              <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
            </div>

            <p className="text-gray-400 mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            {showDeleteConfirm ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p className="text-red-300 font-semibold mb-4">
                  Are you absolutely sure you want to delete your account? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl font-semibold transition-all"
              >
                <Trash2 size={20} />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
