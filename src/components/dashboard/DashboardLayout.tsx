import { Sidebar } from './index';
import TopNavbar from './TopNavbar';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  roadmap: 'AI Roadmap',
  projects: 'Projects',
  resume: 'Resume Builder',
  mentor: 'Mentor AI',
  progress: 'Progress & Time Tracker',
  leetcode: 'LeetCode Tracker',
  'mock-interview': 'Mock Interview',
  placement: 'Placement Hub',
  settings: 'Settings',
  analytics: 'Platform Analytics',
  feedback: 'Feedback',
};

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const title = pageTitles[currentPage] || 'Dashboard';

  return (
    <div className="flex h-screen bg-surface-950">
      <div className="relative">
        <Sidebar currentPage={currentPage} onNavigate={navigate} />
      </div>
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <TopNavbar pageTitle={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 lg:px-8 lg:py-8 max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
