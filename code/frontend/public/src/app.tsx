import { useEffect, useState } from 'react';
import { Navigation } from './components/navigation';
import { Footer } from './components/footer';
import { HomePage } from './pages/HomePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ResultsPage } from './pages/ResultsPage';
import { AboutPage } from './pages/AboutPage';
import { HistoryPage } from './pages/HistoryPage';
import { APIDocsPage } from './pages/APIDocsPage';
import { VerifyReportPage } from './pages/VerifyReportPage';
import type { AnalysisResult } from './types/analysis';

type Page = 'home' | 'analyze' | 'results' | 'about' | 'history' | 'api-docs' | 'verify-report';
const LAST_RESULT_STORAGE_KEY = 'pixelproof_last_result';

function normalizePage(page: string | null | undefined): Page {
  switch (page) {
    case 'analyze':
    case 'results':
    case 'about':
    case 'history':
    case 'api-docs':
    case 'verify-report':
      return page;
    default:
      return 'home';
  }
}

function getPageFromHash(): Page {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const hash = window.location.hash.replace(/^#/, '').trim();
  return normalizePage(hash);
}

function readLastResult(): AnalysisResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LAST_RESULT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

function writeLastResult(result: AnalysisResult | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!result) {
    window.sessionStorage.removeItem(LAST_RESULT_STORAGE_KEY);
    return;
  }

  const { sourceObjectUrl: _sourceObjectUrl, ...serializableResult } = result;
  window.sessionStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(serializableResult));
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromHash);
  const [resultData, setResultData] = useState<AnalysisResult | null>(readLastResult);

  useEffect(() => {
    return () => {
      if (resultData?.sourceObjectUrl) {
        URL.revokeObjectURL(resultData.sourceObjectUrl);
      }
    };
  }, [resultData]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextHash = `#${currentPage}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [currentPage]);

  const handleNavigate = (page: string, data?: AnalysisResult | null) => {
    setCurrentPage(normalizePage(page));
    if (data) {
      if (
        resultData?.sourceObjectUrl &&
        resultData.sourceObjectUrl !== data.sourceObjectUrl
      ) {
        URL.revokeObjectURL(resultData.sourceObjectUrl);
      }
      setResultData(data);
      writeLastResult(data);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,217,255,0.16),_transparent_32%),radial-gradient(circle_at_80%_10%,_rgba(147,51,234,0.14),_transparent_28%),linear-gradient(135deg,_#070B14_0%,_#0A0E1A_42%,_#111827_100%)]" />
        <div className="absolute inset-0 opacity-30">
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
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.06]" />
      </div>

      <div className="relative z-10">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'analyze' && <AnalyzePage onNavigate={handleNavigate} />}
        {currentPage === 'results' && <ResultsPage data={resultData} onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentPage === 'history' && <HistoryPage onNavigate={handleNavigate} />}
        {currentPage === 'api-docs' && <APIDocsPage onNavigate={handleNavigate} />}
        {currentPage === 'verify-report' && <VerifyReportPage onNavigate={handleNavigate} />}
        
        <Footer onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default App;
