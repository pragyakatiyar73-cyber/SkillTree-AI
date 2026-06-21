import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const INTERNSHIP_DAILY_TASKS: Task[] = [
  { id: 'int-d1', title: 'Solve 2 DSA problems', completed: false },
  { id: 'int-d2', title: 'Work on personal project 1hr', completed: false },
  { id: 'int-d3', title: 'Read 1 technical article', completed: false },
  { id: 'int-d4', title: 'Practice 1 mock interview question', completed: false },
  { id: 'int-d5', title: 'Update GitHub with 1 commit', completed: false },
  { id: 'int-d6', title: 'Review 1 CS fundamental', completed: false },
];

const INTERNSHIP_WEEKLY_TASKS: Task[] = [
  { id: 'int-w1', title: 'Complete 1 project feature', completed: false },
  { id: 'int-w2', title: 'Write a blog post', completed: false },
  { id: 'int-w3', title: 'Participate in coding contest', completed: false },
  { id: 'int-w4', title: 'Update portfolio', completed: false },
];

const PLACEMENT_DAILY_TASKS: Task[] = [
  { id: 'place-d1', title: 'Solve 3 DSA problems (1 hard)', completed: false },
  { id: 'place-d2', title: 'Resume review & update', completed: false },
  { id: 'place-d3', title: 'Apply to 2 companies', completed: false },
  { id: 'place-d4', title: 'Practice system design', completed: false },
  { id: 'place-d5', title: 'Mock interview practice', completed: false },
  { id: 'place-d6', title: 'Network on LinkedIn', completed: false },
];

const PLACEMENT_WEEKLY_TASKS: Task[] = [
  { id: 'place-w1', title: 'Complete 1 full mock interview', completed: false },
  { id: 'place-w2', title: 'Apply to 5 companies', completed: false },
  { id: 'place-w3', title: 'Network with 3 professionals', completed: false },
  { id: 'place-w4', title: 'Revise core CS subjects', completed: false },
];

const INTERNSHIP_SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'Git',
  'REST APIs',
  'HTML/CSS',
  'Problem Solving',
  'Communication',
];

const PLACEMENT_SKILLS = [
  'Data Structures',
  'Algorithms',
  'System Design',
  'Database Design',
  'Full Stack',
  'Communication',
  'Problem Solving',
  'Leadership',
];

const MILESTONES = [
  { week: 1, title: 'Foundation', description: 'Build core concepts' },
  { week: 3, title: 'Projects', description: 'Create portfolio projects' },
  { week: 6, title: 'Practice', description: 'Mock interviews & coding' },
  { week: 10, title: 'Applications', description: 'Start applying' },
  { week: 14, title: 'Final Push', description: 'Intensive preparation' },
];

const getDaysInWeek = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      isToday:
        date.toDateString() === new Date().toDateString(),
    };
  });
};

export default function PlacementPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'internship' | 'placement'>('internship');
  const [internshipDaily, setInternshipDaily] = useState<Task[]>(INTERNSHIP_DAILY_TASKS);
  const [internshipWeekly, setInternshipWeekly] = useState<Task[]>(INTERNSHIP_WEEKLY_TASKS);
  const [placementDaily, setPlacementDaily] = useState<Task[]>(PLACEMENT_DAILY_TASKS);
  const [placementWeekly, setPlacementWeekly] = useState<Task[]>(PLACEMENT_WEEKLY_TASKS);

  const weekDays = getDaysInWeek();

  const currentDailyTasks = activeTab === 'internship' ? internshipDaily : placementDaily;
  const currentWeeklyTasks =
    activeTab === 'internship' ? internshipWeekly : placementWeekly;
  const relevantSkills = activeTab === 'internship' ? INTERNSHIP_SKILLS : PLACEMENT_SKILLS;

  const dailyCompletion = useMemo(() => {
    const completed = currentDailyTasks.filter(t => t.completed).length;
    return Math.round((completed / currentDailyTasks.length) * 100);
  }, [currentDailyTasks]);

  const weeklyCompletion = useMemo(() => {
    const completed = currentWeeklyTasks.filter(t => t.completed).length;
    return Math.round((completed / currentWeeklyTasks.length) * 100);
  }, [currentWeeklyTasks]);

  const overallCompletion = useMemo(() => {
    const allTasks = [...currentDailyTasks, ...currentWeeklyTasks];
    const completed = allTasks.filter(t => t.completed).length;
    return Math.round((completed / allTasks.length) * 100);
  }, [currentDailyTasks, currentWeeklyTasks]);

  const toggleTask = (taskId: string, isDaily: boolean) => {
    if (activeTab === 'internship') {
      if (isDaily) {
        setInternshipDaily(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        );
      } else {
        setInternshipWeekly(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        );
      }
    } else {
      if (isDaily) {
        setPlacementDaily(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        );
      } else {
        setPlacementWeekly(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        );
      }
    }
  };

  const motivationalMessages = {
    internship: [
      'Every line of code brings you closer to your dream internship!',
      'Building projects today, landing internships tomorrow!',
      'Consistency is the key to a great internship offer!',
      'Keep pushing! Your future internship self will thank you!',
    ],
    placement: [
      'You\'re on the path to landing your dream job!',
      'Every interview practice makes you sharper!',
      'Preparation now, success later!',
      'Your placement offer is waiting!',
    ],
  };

  const todayMessage =
    motivationalMessages[activeTab][
      Math.floor(Math.random() * motivationalMessages[activeTab].length)
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Placement Hub</h1>
              <p className="text-gray-400">Your journey to success</p>
            </div>
          </div>
        </div>

        <div className="mb-8 glass-card p-6 border-l-4 border-emerald-500">
          <p className="text-emerald-300 text-lg font-medium text-center">
            {todayMessage}
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('internship')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'internship'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            Internship Preparation
          </button>
          <button
            onClick={() => setActiveTab('placement')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'placement'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            Placement Preparation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar size={24} className="text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Current Week</h2>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-center transition-all ${
                      day.isToday
                        ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border-2 border-emerald-500'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-400 mb-1">{day.day}</p>
                    <p
                      className={`text-lg font-bold ${
                        day.isToday ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {day.date}
                    </p>
                    {day.isToday && (
                      <p className="text-xs text-emerald-400 mt-1 font-semibold">Today</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Daily Tasks</h3>
                <span className="text-sm font-semibold text-emerald-400">
                  {dailyCompletion}% Complete
                </span>
              </div>
              <div className="space-y-3">
                {currentDailyTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, true)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all text-left group"
                  >
                    {task.completed ? (
                      <CheckCircle2
                        size={24}
                        className="text-emerald-400 flex-shrink-0"
                      />
                    ) : (
                      <Circle size={24} className="text-gray-500 flex-shrink-0 group-hover:text-emerald-400" />
                    )}
                    <span
                      className={`flex-1 font-medium ${
                        task.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-300 group-hover:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 w-full bg-white/5 rounded-full h-2 border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${dailyCompletion}%` }}
                />
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Weekly Tasks</h3>
                <span className="text-sm font-semibold text-emerald-400">
                  {weeklyCompletion}% Complete
                </span>
              </div>
              <div className="space-y-3">
                {currentWeeklyTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, false)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all text-left group"
                  >
                    {task.completed ? (
                      <CheckCircle2
                        size={24}
                        className="text-emerald-400 flex-shrink-0"
                      />
                    ) : (
                      <Circle size={24} className="text-gray-500 flex-shrink-0 group-hover:text-emerald-400" />
                    )}
                    <span
                      className={`flex-1 font-medium ${
                        task.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-300 group-hover:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 w-full bg-white/5 rounded-full h-2 border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyCompletion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={24} className="text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Overall Progress</h3>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-full h-full">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeDasharray={`${(overallCompletion / 100) * 351.86} 351.86`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">
                          {overallCompletion}%
                        </p>
                        <p className="text-xs text-gray-400">Complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily:</span>
                  <span className="text-emerald-400 font-semibold">{dailyCompletion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weekly:</span>
                  <span className="text-emerald-400 font-semibold">{weeklyCompletion}%</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recommended Skills</h3>
              <div className="flex flex-wrap gap-2">
                {relevantSkills.map(skill => (
                  <div
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-medium"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Preparation Milestones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MILESTONES.map((milestone, idx) => (
              <div
                key={milestone.week}
                className="relative flex flex-col items-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-3 transition-all ${
                    idx < Math.ceil(overallCompletion / 20)
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white">{milestone.title}</p>
                  <p className="text-xs text-gray-400">{milestone.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Week {milestone.week}</p>
                </div>
                {idx < MILESTONES.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-[calc(100%+1rem)] h-1 transition-all ${
                      idx < Math.ceil(overallCompletion / 20)
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : 'bg-white/10'
                    }`}
                    style={{
                      transform: 'translateX(-50%)',
                      zIndex: -1,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
