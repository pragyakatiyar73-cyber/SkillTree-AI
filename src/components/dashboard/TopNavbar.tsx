import { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface TopNavbarProps {
  pageTitle: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export default function TopNavbar({ pageTitle, breadcrumbs }: TopNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationCount] = useState(3);
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-20 bg-surface-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left Section - Title and Breadcrumbs */}
        <div className="flex items-center gap-4">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-600">/</span>}
                  <span className={crumb.path ? 'hover:text-gray-300 cursor-pointer' : 'text-white'}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-400 hover:text-gray-300" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-gray-400 hover:text-gray-300" />
            ) : (
              <Moon size={20} className="text-gray-400 hover:text-gray-300" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-xs font-semibold">
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-surface-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-white/10 bg-surface-900/50">
                    <p className="text-sm font-semibold text-white">{profile?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email || 'user@example.com'}</p>
                  </div>

                  {/* Profile Info */}
                  <div className="p-4 space-y-2 border-b border-white/10">
                    {profile?.college && (
                      <div>
                        <p className="text-xs text-gray-400">College</p>
                        <p className="text-sm text-gray-300">{profile.college}</p>
                      </div>
                    )}
                    {profile?.branch && (
                      <div>
                        <p className="text-xs text-gray-400">Branch</p>
                        <p className="text-sm text-gray-300">{profile.branch}</p>
                      </div>
                    )}
                    {profile?.goal && (
                      <div>
                        <p className="text-xs text-gray-400">Goal</p>
                        <p className="text-sm text-gray-300 truncate">{profile.goal}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-2 space-y-1">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-md transition-colors text-sm">
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors text-sm"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
