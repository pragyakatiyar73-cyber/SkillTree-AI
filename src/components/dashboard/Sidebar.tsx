import { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  FolderKanban,
  FileText,
  MessageSquare,
  TrendingUp,
  Code2,
  BookOpen,
  Mic,
  Briefcase,
  Settings,
  Menu,
  X,
  LogOut,
  TreeDeciduous,
  ChevronDown,
  BarChart3,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (path: string) => void;
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Roadmap', icon: <Map size={20} />, path: '/dashboard/roadmap' },
  { label: 'Projects', icon: <FolderKanban size={20} />, path: '/dashboard/projects' },
  { label: 'Resume', icon: <FileText size={20} />, path: '/dashboard/resume' },
  { label: 'Mentor AI', icon: <MessageSquare size={20} />, path: '/dashboard/mentor' },
  { label: 'Progress', icon: <TrendingUp size={20} />, path: '/dashboard/progress' },
  { label: 'LeetCode', icon: <Code2 size={20} />, path: '/dashboard/leetcode' },
  { label: 'Learning Hub', icon: <BookOpen size={20} />, path: '/dashboard/learning' },
  { label: 'Mock Interview', icon: <Mic size={20} />, path: '/dashboard/mock-interview' },
  { label: 'Placement Hub', icon: <Briefcase size={20} />, path: '/dashboard/placement' },
  { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/dashboard/analytics', adminOnly: true },
  { label: 'Feedback', icon: <Star size={20} />, path: '/dashboard/feedback' },
  { label: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const navItems = allNavItems.filter(
    (item) => !item.adminOnly || profile?.is_admin
  );

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setIsMobileOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center">
            <TreeDeciduous size={24} className="text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">SkillTree AI</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {!isCollapsed && (
          <div className="bg-white/5 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white font-semibold">
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{profile?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-surface-900 border-r border-white/10 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-[-12px] w-6 h-6 bg-surface-800 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-300 ${
              isCollapsed ? '-rotate-90' : 'rotate-90'
            }`}
          />
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-surface-900/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-2">
          <TreeDeciduous size={20} className="text-emerald-400" />
          <span className="text-sm font-semibold">SkillTree AI</span>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur z-20 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-surface-900 border-r border-white/10 z-30 overflow-y-auto">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
