import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  Eye,
  FileImage,
  FileVideo,
  Filter,
  Search,
  Trash2,
} from 'lucide-react';
import { deleteStoredAnalysis, fetchAnalysisHistory } from '../services/api';
import { buildHistoryCsv, downloadTextFile } from '../services/history';
import type { AnalysisResult, HistoryItem } from '../types/analysis';

interface HistoryPageProps {
  onNavigate: (page: string, data?: AnalysisResult) => void;
}

function getRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getHistoryMediaKind(item: HistoryItem) {
  if (item.payload?.mediaType) {
    return item.payload.mediaType;
  }
  if (item.fileType.startsWith('image/')) {
    return 'image';
  }
  if (item.fileType.startsWith('video/')) {
    return 'video';
  }

  const lowerName = item.fileName.toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].some((extension) => lowerName.endsWith(extension))) {
    return 'image';
  }
  return 'video';
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'Real' | 'Fake'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const items = await fetchAnalysisHistory();
        if (isMounted) {
          setHistory(items);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterResult === 'all' || item.result === filterResult;
      return matchesSearch && matchesFilter;
    });
  }, [filterResult, history, searchQuery]);

  const averageConfidence = history.length
    ? history.reduce((acc, item) => acc + item.confidence, 0) / history.length
    : 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteStoredAnalysis(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete history item.');
    }
  };

  const handleExport = () => {
    const csv = buildHistoryCsv(filteredHistory);
    downloadTextFile('pixelproof-history.csv', csv, 'text/csv;charset=utf-8');
  };

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#8CEBFF] mb-5">
            <Filter className="w-4 h-4" />
            Persistent review history
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Analysis{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              history
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Revisit recent scans, export a CSV snapshot, and reopen richer result payloads from the
            backend database.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 px-5 py-5">
            <div className="text-3xl font-bold text-[#00D9FF] mb-2">{history.length}</div>
            <div className="text-sm text-gray-400">Total saved analyses</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 px-5 py-5">
            <div className="text-3xl font-bold text-emerald-400 mb-2">
              {history.filter((item) => item.result === 'Real').length}
            </div>
            <div className="text-sm text-gray-400">Likely authentic</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 px-5 py-5">
            <div className="text-3xl font-bold text-red-400 mb-2">
              {history.filter((item) => item.result === 'Fake').length}
            </div>
            <div className="text-sm text-gray-400">Likely manipulated</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 px-5 py-5">
            <div className="text-3xl font-bold text-[#00D9FF] mb-2">{averageConfidence.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Average confidence</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6 md:p-7 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]/40 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'Real', 'Fake'] as const).map((option) => {
                const isActive = filterResult === option;

                return (
                  <button
                    key={option}
                    onClick={() => setFilterResult(option)}
                    className={`px-5 py-3 rounded-2xl font-semibold transition-all ${
                      isActive
                        ? option === 'Fake'
                          ? 'bg-red-500 text-black'
                          : option === 'Real'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-[#00D9FF] text-black'
                        : 'border border-white/10 bg-white/5 text-white hover:border-[#00D9FF]/30'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-red-100">{errorMessage}</p>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 py-16 px-8 text-center">
            <div className="text-2xl font-bold mb-3">Loading analysis history...</div>
            <p className="text-gray-400">
              Fetching persistent results from the backend database.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 py-16 px-8 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">No matching history yet</h2>
            <p className="text-gray-400 mb-8">
              Try a different filter or run a new analysis to start building a persistent review
              trail.
            </p>
            <button
              onClick={() => onNavigate('analyze')}
              className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-2xl font-semibold transition-all"
            >
              Analyze new media
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => {
              const mediaKind = getHistoryMediaKind(item);

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6 hover:border-[#00D9FF]/25 transition-colors"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                        {mediaKind === 'image' ? (
                          <FileImage className="w-6 h-6 text-[#00D9FF]" />
                        ) : (
                          <FileVideo className="w-6 h-6 text-[#00D9FF]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold truncate">{item.fileName}</h3>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              item.result === 'Real'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {item.result}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <span>{item.fileType || 'Unknown type'}</span>
                          <span>{getRelativeTime(item.timestamp)}</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 xl:gap-6">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 min-w-[140px]">
                        <div className="text-sm text-gray-400 mb-1">Confidence</div>
                        <div className="text-xl font-bold text-[#00D9FF]">{item.confidence.toFixed(1)}%</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => item.payload && onNavigate('results', item.payload)}
                          disabled={!item.payload}
                          className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:border-[#00D9FF]/30 hover:bg-white/10 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                          title={item.payload ? 'View saved result' : 'This older history item has no saved result payload'}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-white transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleExport}
            disabled={filteredHistory.length === 0}
            className="border border-white/10 hover:border-[#00D9FF]/35 hover:bg-white/5 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export filtered history as CSV
          </button>
        </div>
      </div>
    </div>
  );
}
