import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, TreeDeciduous } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <TreeDeciduous size={24} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">SkillTree AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Sign In</Link>
            <Link to="/signup" className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold inline-block">Get Started</Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-6 border-t border-white/5">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg" onClick={() => setIsOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 px-4">
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2" onClick={() => setIsOpen(false)}>Sign In</Link>
                <Link to="/signup" className="btn-primary w-full py-2 rounded-lg text-sm font-semibold text-center block" onClick={() => setIsOpen(false)}>Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
