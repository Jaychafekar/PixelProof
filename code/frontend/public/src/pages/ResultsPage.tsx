import { CheckCircle, XCircle, AlertTriangle, Download, ChevronRight, RotateCcw } from 'lucide-react';

interface ResultData {
  fileName: string;
  fileType: string;
  fileSize: number;
  label: 'Real' | 'Fake';
  confidence: number;
  timestamp: string;
  analysis: {
    facialArtifacts: string;
    audioSync: string;
    noisePatterns: string;
    compression: string;
  };
}

interface ResultsPageProps {
  data: ResultData | null;
  onNavigate: (page: string) => void;
}

export function ResultsPage({ data, onNavigate }: ResultsPageProps) {
  if (!data) {
    return (
      <div className="container mx-auto px-6 py-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No results to display</h2>
          <p className="text-gray-400 mb-8">Please analyze a file first</p>
          <button 
            onClick={() => onNavigate('analyze')}
            className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-lg font-semibold transition-all"
          >
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  const isFake = data.label === 'Fake';
  const isHighConfidence = data.confidence >= 90;
  const isMediumConfidence = data.confidence >= 70 && data.confidence < 90;

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Analysis{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              Results
            </span>
          </h1>
          <p className="text-gray-400">{new Date(data.timestamp).toLocaleString()}</p>
        </div>

        {/* Main Result Card */}
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-center mb-6">
            {isFake ? (
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold mb-2">
              {isFake ? (
                <span className="text-red-500">Likely Fake</span>
              ) : (
                <span className="text-green-500">Likely Real</span>
              )}
            </h2>
            <p className="text-xl text-gray-300">
              Confidence: <span className="font-bold text-[#00D9FF]">{data.confidence}%</span>
            </p>
          </div>

          {/* Confidence Indicator */}
          <div className="mb-6">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  isFake ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-[#00D9FF] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Analysis Explanation</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {isFake ? (
                    <>
                      Our AI model has detected several indicators suggesting this media may be manipulated or synthetically generated. 
                      {isHighConfidence && ' The confidence level is high, indicating strong evidence of manipulation.'}
                      {isMediumConfidence && ' While indicators are present, some ambiguity remains. Consider additional verification.'}
                      {' '}Key factors include {data.analysis.facialArtifacts !== 'None' && 'facial artifacts, '}
                      {data.analysis.noisePatterns === 'Anomalous' && 'unusual noise patterns, '}
                      and other technical inconsistencies typical of deepfake generation.
                    </>
                  ) : (
                    <>
                      Our analysis indicates this media appears authentic with no significant signs of manipulation. 
                      {isHighConfidence && ' The high confidence level suggests the content is likely genuine.'}
                      {' '}The media exhibits natural patterns, consistent compression artifacts, and no detectable facial manipulation markers.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Information */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
          <h3 className="text-xl font-bold mb-4">File Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Filename</p>
              <p className="font-semibold truncate">{data.fileName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">File Type</p>
              <p className="font-semibold">{data.fileType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">File Size</p>
              <p className="font-semibold">{(data.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Analysis Time</p>
              <p className="font-semibold">&lt;3 seconds</p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
          <h3 className="text-xl font-bold mb-4">Detailed Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-300">Facial Artifacts</span>
              <span className={`font-semibold ${data.analysis.facialArtifacts === 'Detected' ? 'text-red-400' : 'text-green-400'}`}>
                {data.analysis.facialArtifacts}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-300">Audio Synchronization</span>
              <span className={`font-semibold ${data.analysis.audioSync === 'Inconsistent' ? 'text-red-400' : data.analysis.audioSync === 'Consistent' ? 'text-green-400' : 'text-gray-400'}`}>
                {data.analysis.audioSync}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-300">Noise Patterns</span>
              <span className={`font-semibold ${data.analysis.noisePatterns === 'Anomalous' ? 'text-red-400' : 'text-green-400'}`}>
                {data.analysis.noisePatterns}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Compression Analysis</span>
              <span className="font-semibold text-green-400">{data.analysis.compression}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => onNavigate('analyze')}
            className="flex-1 bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Analyze Another File
          </button>
          <button 
            onClick={() => {/* Download report */}}
            className="flex-1 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className="flex-1 border-2 border-gray-600 hover:border-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            View History
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-yellow-400">Disclaimer:</span> This analysis is provided as-is and should be used as one factor in determining media authenticity. PixelProof AI does not guarantee 100% accuracy and recommends using multiple verification methods for critical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
