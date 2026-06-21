import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Code2 } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-surface-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="absolute top-20 right-10 opacity-20">
        <Code2 size={64} className="text-primary-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-32 left-10 opacity-20">
        <Rocket size={64} className="text-primary-500 animate-bounce" style={{ animationDuration: '4s' }} />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10">
          <p className="text-sm font-medium text-primary-400">Your AI Career Partner</p>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">Your Complete AI Career Roadmap</span>
          <br />
          <span className="text-white">From First Year to Placement</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          An intelligent career planning platform that generates personalized roadmaps, builds your resume, conducts mock interviews, and prepares you for placement success.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup" className="btn-primary flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:gap-3">
            Get Started
            <ArrowRight size={20} />
          </Link>
          <Link to="/signup" className="btn-secondary px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:bg-white/10">
            Generate My Roadmap
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-white/5">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-400">10K+</p>
            <p className="text-sm text-gray-500 mt-2">Students Onboarded</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-400">92%</p>
            <p className="text-sm text-gray-500 mt-2">Placement Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-400">50+</p>
            <p className="text-sm text-gray-500 mt-2">College Partners</p>
          </div>
        </div>
      </div>
    </section>
  );
}
