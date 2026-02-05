import { Shield } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'analyze', label: 'Try Now' },
    { id: 'history', label: 'History' },
    { id: 'about', label: 'About' },
    { id: 'api-docs', label: 'API Docs' }
  ];

  return (
    <nav className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Shield className="w-8 h-8 text-[#00D9FF]" />
          <span className="text-xl font-bold">
            <span className="text-white">Pixel</span>
            <span className="text-[#00D9FF]">Proof</span>
          </span>
        </button>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`transition-colors ${
                currentPage === item.id
                  ? 'text-[#00D9FF]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button 
            onClick={() => onNavigate('analyze')}
            className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-2 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50"
          >
            Try Now
          </button>
        </div>
      </div>
    </nav>
  );
}
