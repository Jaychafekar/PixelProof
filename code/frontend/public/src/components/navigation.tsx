import { Menu, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'verify-report', label: 'Verify Report' },
    { id: 'history', label: 'History' },
    { id: 'about', label: 'About' },
    { id: 'api-docs', label: 'API Docs' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPage]);

  return (
    <nav className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-6">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#0E1424]/75 backdrop-blur-xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00D9FF]/20 bg-[#00D9FF]/10">
              <Shield className="w-6 h-6 text-[#00D9FF]" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold leading-none">
                <span className="text-white">Pixel</span>
                <span className="text-[#00D9FF]">Proof</span>
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-gray-400 mt-1">
                Media Authenticity
              </div>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#00D9FF] text-black shadow-lg shadow-cyan-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => onNavigate('about')}
              className="px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Learn More
            </button>
            <button
              onClick={() => onNavigate('analyze')}
              className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-5 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/35"
            >
              Try Now
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 px-4 py-4 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`rounded-2xl px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'bg-[#00D9FF] text-black font-semibold'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('analyze')}
              className="mt-4 w-full bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-5 py-3 rounded-2xl font-semibold transition-all"
            >
              Start Analysis
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
