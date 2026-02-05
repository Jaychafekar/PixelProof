import { useState, useEffect } from 'react';
import { FileImage, FileVideo, Search, Filter, Trash2, Eye, Download } from 'lucide-react';

interface HistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  timestamp: string;
  result: 'Real' | 'Fake';
  confidence: number;
}

interface HistoryPageProps {
  onNavigate: (page: string) => void;
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'Real' | 'Fake'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('pixelproof_history') || '[]') as HistoryItem[];
    setHistory(savedHistory);
  }, []);

  const filteredHistory = history.filter((item: HistoryItem) => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterResult === 'all' || item.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id: string) => {
    const updatedHistory = history.filter((item: HistoryItem) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('pixelproof_history', JSON.stringify(updatedHistory));
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Analysis{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              History
            </span>
          </h1>
          <p className="text-xl text-gray-300 text-center">
            View and manage your past deepfake detection analyses
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#111827]/80 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#00D9FF]/50 transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterResult('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                filterResult === 'all'
                  ? 'bg-[#00D9FF] text-black'
                  : 'bg-[#111827]/80 border border-white/10 text-white hover:border-[#00D9FF]/50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterResult('Real')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                filterResult === 'Real'
                  ? 'bg-green-500 text-black'
                  : 'bg-[#111827]/80 border border-white/10 text-white hover:border-green-500/50'
              }`}
            >
              Real
            </button>
            <button
              onClick={() => setFilterResult('Fake')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                filterResult === 'Fake'
                  ? 'bg-red-500 text-black'
                  : 'bg-[#111827]/80 border border-white/10 text-white hover:border-red-500/50'
              }`}
            >
              Fake
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <div className="text-2xl font-bold text-[#00D9FF] mb-1">{history.length}</div>
            <div className="text-sm text-gray-400">Total Analyses</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {history.filter((h: HistoryItem) => h.result === 'Real').length}
            </div>
            <div className="text-sm text-gray-400">Real Media</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {history.filter((h: HistoryItem) => h.result === 'Fake').length}
            </div>
            <div className="text-sm text-gray-400">Fake Media</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <div className="text-2xl font-bold text-[#00D9FF] mb-1">
              {(history.reduce((acc: number, h: HistoryItem) => acc + h.confidence, 0) / history.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Avg Confidence</div>
          </div>
        </div>

        {/* History Table */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <button 
              onClick={() => onNavigate('analyze')}
              className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Analyze New Media
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10 overflow-hidden">
            {/* Table Header - Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-white/10 font-semibold text-sm text-gray-400">
              <div className="col-span-4">File Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2">Result</div>
              <div className="col-span-1">Confidence</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/10">
              {filteredHistory.map((item: HistoryItem) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center flex-shrink-0">
                        {item.fileType.startsWith('image') ? (
                          <FileImage className="w-5 h-5 text-[#00D9FF]" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-[#00D9FF]" />
                        )}
                      </div>
                      <span className="truncate font-medium">{item.fileName}</span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-400">
                      {item.fileType.split('/')[0]}
                    </div>
                    <div className="col-span-2 text-sm text-gray-400">
                      {getRelativeTime(item.timestamp)}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        item.result === 'Real'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.result}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#00D9FF] font-semibold">{item.confidence}%</span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-2">
                      <button 
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center flex-shrink-0">
                        {item.fileType.startsWith('image') ? (
                          <FileImage className="w-5 h-5 text-[#00D9FF]" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-[#00D9FF]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate mb-1">{item.fileName}</div>
                        <div className="text-sm text-gray-400">{getRelativeTime(item.timestamp)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          item.result === 'Real'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.result}
                        </span>
                        <span className="text-[#00D9FF] font-semibold">{item.confidence}%</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="mt-8 flex justify-center">
          <button className="border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export History (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
