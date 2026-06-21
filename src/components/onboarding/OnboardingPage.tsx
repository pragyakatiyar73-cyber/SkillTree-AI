import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

const SKILLS = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'DSA',
  'SQL',
  'Git',
  'TypeScript',
  'Docker'
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

interface OnboardingFormData {
  name: string;
  college: string;
  branch: string;
  year: string;
  goal: string;
  skills: string[];
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: profile?.name || '',
    college: profile?.college || '',
    branch: profile?.branch || '',
    year: profile?.year || '',
    goal: profile?.goal || '',
    skills: profile?.skills || []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        college: profile.college || '',
        branch: profile.branch || '',
        year: profile.year || '',
        goal: profile.goal || '',
        skills: profile.skills || []
      });
    }
  }, [profile]);

  const validateStep = (): boolean => {
    setError('');

    switch (currentStep) {
      case 0:
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.college.trim()) {
          setError('College name is required');
          return false;
        }
        if (!formData.branch.trim()) {
          setError('Branch is required');
          return false;
        }
        if (!formData.year) {
          setError('Please select your year');
          return false;
        }
        return true;

      case 1:
        if (!formData.goal) {
          setError('Please select a career goal');
          return false;
        }
        return true;

      case 2:
        if (formData.skills.length === 0) {
          setError('Please select at least one skill');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
    setError('');
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleComplete = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile({
        name: formData.name,
        college: formData.college,
        branch: formData.branch,
        year: formData.year,
        goal: formData.goal,
        skills: formData.skills,
        onboarding_complete: true
      });

      setShowSuccess(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-950 to-surface-900 flex items-center justify-center px-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 border border-primary-500/30 mb-6 animate-pulse">
            <CheckCircle className="text-primary-400" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ready to Go</h1>
          <p className="text-gray-400 mb-8">
            Your profile is all set! Let's start building your personalized career roadmap.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-950 to-surface-900 px-4 sm:px-6 lg:px-8 py-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Complete Your Profile</h1>
          <p className="text-gray-400 mb-8">Help us personalize your learning experience</p>

          {/* Progress indicator */}
          <div className="flex justify-between items-center gap-2">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-primary-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Step {currentStep + 1} of 4
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Glass Card */}
        <div className="glass-card p-8 lg:p-12">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-white">Basic Information</h2>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">College Name</label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="Your College"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="Computer Science, Electronics, etc."
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Current Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
            </div>
          )}

          {/* Step 2: Career Goal */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-white">What's your career goal?</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CAREER_GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setFormData({ ...formData, goal })}
                    className={`p-4 rounded-xl border-2 transition-all text-center font-medium ${
                      formData.goal === goal
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Skills Assessment */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-white">What skills do you have?</h2>
              <p className="text-gray-400 text-sm">Select all that apply</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 font-medium ${
                      formData.skills.includes(skill)
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        formData.skills.includes(skill)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-500'
                      }`}
                    >
                      {formData.skills.includes(skill) && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Final Step */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn text-center">
              <h2 className="text-3xl font-bold text-white">You're all set!</h2>

              <div className="space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-500/20 border border-primary-500/30">
                  <CheckCircle className="text-primary-400" size={48} />
                </div>
              </div>

              <p className="text-gray-400">
                Let's build your personalized career roadmap and start your journey to success.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-left space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Career Goal</p>
                  <p className="text-white font-medium">{formData.goal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Skills</p>
                  <p className="text-white font-medium">{formData.skills.length} selected</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-12">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="btn-primary ml-auto flex items-center gap-2 disabled:opacity-50"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="btn-primary ml-auto disabled:opacity-50"
              >
                {loading ? 'Setting up...' : "Let's Go!"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
