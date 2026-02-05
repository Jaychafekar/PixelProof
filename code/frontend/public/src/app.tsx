import { useState } from 'react';
import { Navigation } from './components/navigation';
import { Footer } from './components/footer';
import { HomePage } from './pages/HomePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ResultsPage } from './pages/ResultsPage';
import { AboutPage } from './pages/AboutPage';
import { HistoryPage } from './pages/HistoryPage';
import { APIDocsPage } from './pages/APIDocsPage';

type Page = 'home' | 'analyze' | 'results' | 'about' | 'history' | 'api-docs';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [resultData, setResultData] = useState<any>(null);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page as Page);
    if (data) {
      setResultData(data);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden">
      {/* Animated Background Network */}
      <div className="fixed inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#0A0E1A]">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9333EA" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Network lines - decorative */}
            <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="30%" y1="40%" x2="50%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="50%" y1="30%" x2="70%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="70%" y1="50%" x2="90%" y2="35%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="20%" y1="60%" x2="40%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="40%" y1="70%" x2="60%" y2="65%" stroke="url(#lineGradient)" strokeWidth="1" />
            <line x1="60%" y1="65%" x2="80%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1" />
            
            {/* Network nodes */}
            <circle cx="10%" cy="20%" r="4" fill="#00D9FF" opacity="0.6" />
            <circle cx="30%" cy="40%" r="4" fill="#00D9FF" opacity="0.6" />
            <circle cx="50%" cy="30%" r="4" fill="#00D9FF" opacity="0.6" />
            <circle cx="70%" cy="50%" r="4" fill="#00D9FF" opacity="0.6" />
            <circle cx="90%" cy="35%" r="4" fill="#00D9FF" opacity="0.6" />
            <circle cx="20%" cy="60%" r="4" fill="#9333EA" opacity="0.6" />
            <circle cx="40%" cy="70%" r="4" fill="#9333EA" opacity="0.6" />
            <circle cx="60%" cy="65%" r="4" fill="#9333EA" opacity="0.6" />
            <circle cx="80%" cy="75%" r="4" fill="#9333EA" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'analyze' && <AnalyzePage onNavigate={handleNavigate} />}
        {currentPage === 'results' && <ResultsPage data={resultData} onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentPage === 'history' && <HistoryPage onNavigate={handleNavigate} />}
        {currentPage === 'api-docs' && <APIDocsPage onNavigate={handleNavigate} />}
        
        <Footer onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default App;
