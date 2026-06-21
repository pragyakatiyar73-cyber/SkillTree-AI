import { useState, useEffect } from 'react';
import { ChevronDown, Zap, CheckCircle2, Circle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Roadmap, RoadmapStage } from '../../types';

const CAREER_GOALS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'AI Engineer',
  'Cyber Security',
  'DevOps',
  'Mobile Developer',
];

const ROADMAP_TEMPLATES: Record<string, RoadmapStage[]> = {
  'Full Stack Developer': [
    {
      id: '1',
      title: 'Web Fundamentals',
      description: 'Master HTML, CSS, and JavaScript basics to build interactive web pages',
      skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
      projects: ['Personal Portfolio', 'Landing Page'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Frontend Framework',
      description: 'Learn React for building dynamic user interfaces',
      skills: ['React', 'JSX', 'Hooks', 'State Management'],
      projects: ['Todo App', 'Weather Dashboard'],
      duration: '6 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Backend Development',
      description: 'Build server-side applications with Node.js and Express',
      skills: ['Node.js', 'Express', 'REST APIs', 'Authentication'],
      projects: ['API Server', 'User Management System'],
      duration: '6 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Databases & APIs',
      description: 'Work with databases and integrate complex APIs',
      skills: ['SQL', 'MongoDB', 'Database Design', 'API Integration'],
      projects: ['E-Commerce Store', 'Social Media App'],
      duration: '4 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Projects & DSA',
      description: 'Build real projects and master data structures and algorithms',
      skills: ['System Design', 'DSA', 'Git', 'Deployment'],
      projects: ['Chat Application', 'Project Portfolio'],
      duration: '8 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview Prep',
      description: 'Prepare for technical interviews and behavioral rounds',
      skills: ['Mock Interviews', 'Resume Review', 'Interview Techniques'],
      projects: ['Mock Interviews', 'Interview Practice'],
      duration: '4 weeks',
      completed: false,
      order: 6,
    },
  ],
  'Frontend Developer': [
    {
      id: '1',
      title: 'HTML & CSS Mastery',
      description: 'Build strong foundations in HTML5 and CSS3',
      skills: ['HTML5', 'CSS3', 'Flexbox', 'Grid'],
      projects: ['Responsive Website', 'CSS Art'],
      duration: '3 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'JavaScript Essentials',
      description: 'Master JavaScript fundamentals and DOM manipulation',
      skills: ['JavaScript', 'DOM', 'Events', 'Async/Await'],
      projects: ['Interactive Gallery', 'Form Validation'],
      duration: '4 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'React Deep Dive',
      description: 'Become proficient with React ecosystem',
      skills: ['React', 'Redux', 'Context API', 'React Router'],
      projects: ['Dashboard', 'E-Commerce Frontend'],
      duration: '8 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Advanced Styling',
      description: 'Learn Tailwind, SCSS, and CSS-in-JS',
      skills: ['Tailwind CSS', 'SCSS', 'Styled Components', 'Design Systems'],
      projects: ['Design System', 'Component Library'],
      duration: '3 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Performance & Testing',
      description: 'Optimize performance and master testing frameworks',
      skills: ['Web Performance', 'Jest', 'React Testing', 'Debugging'],
      projects: ['Performance Audit', 'Tested Component Suite'],
      duration: '4 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview & Portfolio',
      description: 'Build impressive portfolio and interview preparation',
      skills: ['Portfolio Website', 'Mock Interviews', 'Code Review'],
      projects: ['Portfolio Showcase', 'Case Studies'],
      duration: '3 weeks',
      completed: false,
      order: 6,
    },
  ],
  'Backend Developer': [
    {
      id: '1',
      title: 'Programming Fundamentals',
      description: 'Learn core programming concepts with Python or Java',
      skills: ['Python', 'OOP', 'Data Structures', 'Algorithms'],
      projects: ['CLI Tools', 'Algorithms Implementation'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Web Framework',
      description: 'Master a backend framework like Django or Spring',
      skills: ['Django/Spring', 'REST APIs', 'Authentication', 'Middleware'],
      projects: ['API Server', 'User System'],
      duration: '6 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Database Design',
      description: 'Design and optimize databases',
      skills: ['SQL', 'Database Design', 'Indexing', 'Query Optimization'],
      projects: ['Database Schema', 'Complex Queries'],
      duration: '4 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Advanced Concepts',
      description: 'Learn caching, message queues, and microservices',
      skills: ['Redis', 'Message Queues', 'Microservices', 'Docker'],
      projects: ['Cached API', 'Async Tasks'],
      duration: '5 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'System Design',
      description: 'Design scalable systems and handle high traffic',
      skills: ['System Design', 'Scalability', 'Load Balancing', 'Monitoring'],
      projects: ['Distributed System', 'Scaling Project'],
      duration: '6 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview Preparation',
      description: 'Prepare for backend engineering interviews',
      skills: ['Mock Interviews', 'Design Patterns', 'Problem Solving'],
      projects: ['Mock Interview Sessions', 'Design Documents'],
      duration: '4 weeks',
      completed: false,
      order: 6,
    },
  ],
  'Data Analyst': [
    {
      id: '1',
      title: 'SQL Fundamentals',
      description: 'Master SQL queries and database operations',
      skills: ['SQL', 'Queries', 'Joins', 'Aggregations'],
      projects: ['Analysis Queries', 'Reports'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Data Visualization',
      description: 'Learn data visualization tools and techniques',
      skills: ['Tableau/PowerBI', 'Data Visualization', 'Dashboards'],
      projects: ['Sales Dashboard', 'Analytics Report'],
      duration: '4 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Python for Data',
      description: 'Use Python for data analysis and manipulation',
      skills: ['Python', 'Pandas', 'NumPy', 'Data Cleaning'],
      projects: ['Data Analysis Project', 'ETL Pipeline'],
      duration: '6 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Statistical Analysis',
      description: 'Learn statistics and hypothesis testing',
      skills: ['Statistics', 'Hypothesis Testing', 'A/B Testing', 'Regression'],
      projects: ['Statistical Analysis', 'A/B Test Report'],
      duration: '4 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Business Analytics',
      description: 'Connect data insights to business decisions',
      skills: ['KPI Development', 'Business Acumen', 'Storytelling'],
      projects: ['Business Report', 'Strategy Presentation'],
      duration: '4 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview Preparation',
      description: 'Prepare for data analyst interviews',
      skills: ['Case Studies', 'Technical Interview', 'Portfolio'],
      projects: ['Case Study Analysis', 'Interview Portfolio'],
      duration: '3 weeks',
      completed: false,
      order: 6,
    },
  ],
  'AI Engineer': [
    {
      id: '1',
      title: 'ML Fundamentals',
      description: 'Learn machine learning basics and algorithms',
      skills: ['Python', 'ML Algorithms', 'Scikit-learn', 'Model Training'],
      projects: ['Classification Model', 'Regression Project'],
      duration: '6 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Deep Learning',
      description: 'Master neural networks and deep learning frameworks',
      skills: ['TensorFlow', 'PyTorch', 'Neural Networks', 'CNNs/RNNs'],
      projects: ['Image Classification', 'NLP Project'],
      duration: '8 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'NLP & LLMs',
      description: 'Work with natural language processing and large language models',
      skills: ['NLP', 'Transformers', 'LLMs', 'Fine-tuning'],
      projects: ['Text Analysis', 'Chatbot'],
      duration: '6 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Model Deployment',
      description: 'Deploy and serve ML models in production',
      skills: ['MLOps', 'Docker', 'APIs', 'Model Serving'],
      projects: ['Deployed Model', 'ML API'],
      duration: '4 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Advanced Topics',
      description: 'Explore cutting-edge AI research and applications',
      skills: ['Computer Vision', 'Reinforcement Learning', 'Generative AI'],
      projects: ['Research Project', 'Advanced Application'],
      duration: '6 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview Preparation',
      description: 'Prepare for AI engineering interviews',
      skills: ['Technical Interviews', 'System Design', 'Research Discussions'],
      projects: ['Portfolio Project', 'Interview Prep'],
      duration: '4 weeks',
      completed: false,
      order: 6,
    },
  ],
  'Cyber Security': [
    {
      id: '1',
      title: 'Networking Basics',
      description: 'Understand network fundamentals and protocols',
      skills: ['TCP/IP', 'DNS', 'HTTP/HTTPS', 'Network Architecture'],
      projects: ['Network Lab', 'Protocol Analysis'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Security Fundamentals',
      description: 'Learn security concepts and common vulnerabilities',
      skills: ['OWASP', 'Encryption', 'Authentication', 'Security Principles'],
      projects: ['Vulnerability Assessment', 'Security Audit'],
      duration: '5 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Penetration Testing',
      description: 'Learn ethical hacking and penetration testing',
      skills: ['Metasploit', 'Burp Suite', 'Exploit Techniques', 'Payloads'],
      projects: ['CTF Challenges', 'Pen Test Lab'],
      duration: '6 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Security Tools & Scripts',
      description: 'Master security tools and scripting',
      skills: ['Linux', 'Bash', 'Python for Security', 'Tools'],
      projects: ['Automated Scripts', 'Security Tools'],
      duration: '4 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Advanced Defense',
      description: 'Learn incident response and security architecture',
      skills: ['Incident Response', 'Forensics', 'Security Architecture'],
      projects: ['Incident Response Plan', 'Security Design'],
      duration: '5 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview & Certification',
      description: 'Prepare for interviews and security certifications',
      skills: ['CEH/OSCP', 'Interview Prep', 'Red Teaming'],
      projects: ['Certification Prep', 'Portfolio'],
      duration: '4 weeks',
      completed: false,
      order: 6,
    },
  ],
  'DevOps': [
    {
      id: '1',
      title: 'Linux & Scripting',
      description: 'Master Linux systems and shell scripting',
      skills: ['Linux', 'Bash', 'Shell Scripts', 'System Admin'],
      projects: ['Automation Scripts', 'Linux Tutorials'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Version Control & CI/CD',
      description: 'Learn Git, GitHub, and CI/CD pipelines',
      skills: ['Git', 'GitHub/GitLab', 'GitHub Actions', 'Jenkins'],
      projects: ['CI/CD Pipeline', 'GitHub Automation'],
      duration: '4 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Containerization',
      description: 'Master Docker and container technologies',
      skills: ['Docker', 'Container Registry', 'Image Optimization'],
      projects: ['Docker Applications', 'Container Setup'],
      duration: '4 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Kubernetes & Orchestration',
      description: 'Learn Kubernetes for container orchestration',
      skills: ['Kubernetes', 'Helm', 'Deployments', 'Services'],
      projects: ['Kubernetes Cluster', 'Helm Charts'],
      duration: '6 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Monitoring & Infrastructure',
      description: 'Set up monitoring and infrastructure as code',
      skills: ['Prometheus', 'Terraform', 'IaC', 'Cloud Platforms'],
      projects: ['Monitoring Stack', 'Infrastructure Setup'],
      duration: '5 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'Interview Preparation',
      description: 'Prepare for DevOps engineering interviews',
      skills: ['System Design', 'Troubleshooting', 'Best Practices'],
      projects: ['Design Portfolio', 'Case Studies'],
      duration: '3 weeks',
      completed: false,
      order: 6,
    },
  ],
  'Mobile Developer': [
    {
      id: '1',
      title: 'Programming Fundamentals',
      description: 'Learn core programming concepts for mobile',
      skills: ['Java/Kotlin', 'Swift', 'OOP', 'Data Structures'],
      projects: ['Basic Apps', 'Algorithm Implementation'],
      duration: '4 weeks',
      completed: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Mobile UI/UX',
      description: 'Master mobile UI design and user experience',
      skills: ['UI Design', 'Layouts', 'Navigation', 'Animations'],
      projects: ['UI Designs', 'Navigation Systems'],
      duration: '4 weeks',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Native Development',
      description: 'Build native mobile apps for iOS or Android',
      skills: ['iOS Development', 'Android Development', 'Native APIs'],
      projects: ['Native Apps', 'Feature Implementation'],
      duration: '8 weeks',
      completed: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Cross-Platform Development',
      description: 'Learn React Native or Flutter',
      skills: ['React Native', 'Flutter', 'Cross-Platform APIs'],
      projects: ['Cross-Platform App', 'Multi-Platform Release'],
      duration: '6 weeks',
      completed: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Backend Integration & Databases',
      description: 'Connect mobile apps to backends and databases',
      skills: ['REST APIs', 'Firebase', 'Local Storage', 'Sync'],
      projects: ['API Integration', 'Database App'],
      duration: '4 weeks',
      completed: false,
      order: 5,
    },
    {
      id: '6',
      title: 'App Publishing & Interviews',
      description: 'Publish apps and prepare for interviews',
      skills: ['App Store', 'Play Store', 'Testing', 'Performance'],
      projects: ['Published App', 'Interview Portfolio'],
      duration: '3 weeks',
      completed: false,
      order: 6,
    },
  ],
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, [user]);

  const loadRoadmap = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setRoadmap(data);
        setSelectedGoal(data.goal);
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!user) return;

    const goalToUse = customGoal || selectedGoal;
    if (!goalToUse) return;

    setGenerating(true);

    try {
      const stages = ROADMAP_TEMPLATES[goalToUse] || ROADMAP_TEMPLATES['Full Stack Developer'];

      const newRoadmap = {
        user_id: user.id,
        goal: goalToUse,
        roadmap_data: stages,
      };

      if (roadmap?.id) {
        await supabase
          .from('roadmaps')
          .update(newRoadmap)
          .eq('id', roadmap.id);
      } else {
        const { data } = await supabase
          .from('roadmaps')
          .insert([newRoadmap])
          .select()
          .single();

        if (data) {
          setRoadmap(data);
        }
      }

      setRoadmap(prev =>
        prev ? { ...prev, ...newRoadmap } : { id: 'new', ...newRoadmap, created_at: new Date().toISOString() }
      );
      setSelectedGoal('');
      setCustomGoal('');
      setShowCustomInput(false);
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleStageCompletion = async (stageId: string) => {
    if (!roadmap) return;

    const updatedStages = roadmap.roadmap_data.map(stage =>
      stage.id === stageId ? { ...stage, completed: !stage.completed } : stage
    );

    try {
      await supabase
        .from('roadmaps')
        .update({ roadmap_data: updatedStages })
        .eq('id', roadmap.id);

      setRoadmap(prev =>
        prev ? { ...prev, roadmap_data: updatedStages } : null
      );
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const calculateProgress = () => {
    if (!roadmap) return 0;
    const completed = roadmap.roadmap_data.filter(s => s.completed).length;
    return Math.round((completed / roadmap.roadmap_data.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
            <Zap className="w-16 h-16 text-primary-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Create Your Career Roadmap</h1>
            <p className="text-gray-400 mb-8">
              Select a career goal or enter a custom goal to generate your personalized learning roadmap.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <button
                  onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white flex items-center justify-between hover:border-primary-500/50 transition-colors"
                >
                  <span>{selectedGoal || 'Select a career goal'}</span>
                  <ChevronDown size={20} className={`transition-transform ${goalDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {goalDropdownOpen && (
                  <div className="absolute top-full mt-2 w-full bg-surface-900 border border-white/10 rounded-lg shadow-lg z-50">
                    {CAREER_GOALS.map(goal => (
                      <button
                        key={goal}
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowCustomInput(false);
                          setGoalDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors"
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-400 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:border-primary-500/50 transition-colors"
              >
                Enter Custom Goal
              </button>

              {showCustomInput && (
                <input
                  type="text"
                  placeholder="Enter your custom career goal..."
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              )}

              <button
                onClick={handleGenerateRoadmap}
                disabled={(!selectedGoal && !customGoal) || generating}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Generate Roadmap
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-surface-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Your Career Roadmap</h1>
              <p className="text-gray-400">{roadmap.goal}</p>
            </div>
            <button
              onClick={() => {
                setRoadmap(null);
                setSelectedGoal('');
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:border-primary-500/50 transition-colors"
            >
              New Roadmap
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Progress</span>
              <span className="text-sm font-semibold text-primary-400">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-500/20" />

          {/* Stages */}
          <div className="space-y-8">
            {roadmap.roadmap_data.map((stage, index) => (
              <div key={stage.id} className="relative pl-24">
                {/* Timeline dot */}
                <button
                  onClick={() => toggleStageCompletion(stage.id)}
                  className="absolute left-0 top-0 w-16 h-16 flex items-center justify-center transition-all duration-300"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-surface-950 border-2 border-primary-500 flex items-center justify-center cursor-pointer hover:bg-primary-500/10 transition-colors">
                      {stage.completed ? (
                        <CheckCircle2 size={32} className="text-primary-400" />
                      ) : (
                        <Circle size={32} className="text-primary-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Stage Card */}
                <div
                  className={`bg-white/5 border rounded-xl p-6 backdrop-blur-xl transition-all duration-300 ${
                    stage.completed
                      ? 'border-primary-500/30 bg-primary-500/5'
                      : 'border-white/10 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-primary-400">Stage {index + 1}</span>
                        {stage.completed && <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full">Completed</span>}
                      </div>
                      <h3 className={`text-xl font-bold ${stage.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {stage.title}
                      </h3>
                    </div>
                    <span className="text-sm font-semibold text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                      {stage.duration}
                    </span>
                  </div>

                  <p className={`mb-4 ${stage.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                    {stage.description}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Skills to Learn</p>
                    <div className="flex flex-wrap gap-2">
                      {stage.skills.map(skill => (
                        <span
                          key={skill}
                          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                            stage.completed
                              ? 'bg-primary-500/10 text-primary-400'
                              : 'bg-primary-500/20 text-primary-300'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">Projects</p>
                    <ul className="space-y-1">
                      {stage.projects.map(project => (
                        <li key={project} className={`text-sm flex items-center gap-2 ${stage.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
