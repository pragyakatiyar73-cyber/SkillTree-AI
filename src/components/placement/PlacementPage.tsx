import { useState } from 'react';
import { Shield, Linkedin } from 'lucide-react';
import PlacementReadinessPage from './PlacementReadinessPage';
import LinkedInCareerPage from '../linkedin/LinkedInCareerPage';

export default function PlacementPage() {
  const [activeSection, setActiveSection] = useState<'readiness' | 'linkedin'>('readiness');

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('readiness')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'readiness'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
          }`}
        >
          <Shield size={16} />
          Placement Readiness
        </button>
        <button
          onClick={() => setActiveSection('linkedin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'linkedin'
              ? 'bg-[#0A66C2]/20 text-[#0A66C2] border border-[#0A66C2]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
          }`}
        >
          <Linkedin size={16} />
          LinkedIn Career Center
        </button>
      </div>

      {/* Content */}
      {activeSection === 'readiness' ? <PlacementReadinessPage /> : <LinkedInCareerPage />}
    </div>
  );
}
