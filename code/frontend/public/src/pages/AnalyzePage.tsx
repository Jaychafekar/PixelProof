import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileVideo,
  Loader2,
  Shield,
  Upload,
  Zap,
} from 'lucide-react';
import { analyzeMedia, buildAnalysisResult, getApiOrigin } from '../services/api';
import type { AnalysisResult } from '../types/analysis';

interface AnalyzePageProps {
  onNavigate: (page: string, data?: AnalysisResult) => void;
}

const VALID_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska',
];

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm', '.avi', '.mkv'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileMediaKind(file: File | null) {
  if (!file) {
    return null;
  }

  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }

  const lowerName = file.name.toLowerCase();
  if (VALID_EXTENSIONS.slice(0, 4).some((extension) => lowerName.endsWith(extension))) {
    return 'image';
  }
  if (VALID_EXTENSIONS.slice(4).some((extension) => lowerName.endsWith(extension))) {
    return 'video';
  }

  return null;
}

export function AnalyzePage({ onNavigate }: AnalyzePageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (file: File) => {
    const hasValidExtension = VALID_EXTENSIONS.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!VALID_TYPES.includes(file.type) && !hasValidExtension) {
      setErrorMessage('Use JPG, PNG, WEBP, MP4, MOV, WEBM, AVI, or MKV files.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage('File size must stay under 50MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const apiResult = await analyzeMedia(selectedFile);
      const result = buildAnalysisResult(selectedFile, apiResult);
      if (result.mediaType === 'image') {
        result.sourceObjectUrl = URL.createObjectURL(selectedFile);
      }
      onNavigate('results', result);
    } catch (error) {
      console.error('Analysis error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Analysis failed. Make sure the server is running at ${getApiOrigin()}.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mediaKind = getFileMediaKind(selectedFile);
  const isImage = mediaKind === 'image';
  const isVideo = mediaKind === 'video';

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mb-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#8CEBFF] mb-5">
              <Shield className="w-4 h-4" />
              Detection workflow
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
              Analyze media for{' '}
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
                deepfake signals
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
              Upload an image or short-form video, review the result surface, and keep the outcome
              in persistent analysis history so the workflow stays easy to revisit after
              deployment.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/75 backdrop-blur-md p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00D9FF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Before you upload</h2>
                <p className="text-sm text-gray-400">A few quick checks keep results cleaner.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                'Use JPG, PNG, WEBP, MP4, MOV, WEBM, AVI, or MKV files.',
                'Keep uploads under 50MB for the current app flow.',
                'Higher-quality source media usually produces more useful forensic cues.',
                'Treat the model result as guidance, not standalone proof.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <CheckCircle2 className="w-5 h-5 text-[#00D9FF] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
          <div>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-[32px] border-2 border-dashed p-10 md:p-14 transition-all ${
                isDragging
                  ? 'border-[#00D9FF] bg-[#00D9FF]/10 shadow-lg shadow-cyan-500/10'
                  : 'border-white/15 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 hover:border-[#00D9FF]/35'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi,.mkv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center mb-6">
                  <Upload className="w-9 h-9 text-[#00D9FF]" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Drag and drop your media</h3>
                <p className="text-gray-400 max-w-xl mb-8 leading-relaxed">
                  Use the upload zone for quick checks, or browse manually if you are pulling files
                  from a larger review workflow.
                </p>
                <button
                  onClick={handleBrowseClick}
                  className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-8 py-3 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/35"
                >
                  Browse files
                </button>
                <p className="text-sm text-gray-500 mt-5">
                  JPG, PNG, WEBP, MP4, MOV, WEBM, AVI, MKV up to 50MB
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <p className="text-red-100">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 backdrop-blur-md p-7">
              <div className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-4">
                Current Selection
              </div>

              {selectedFile ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                      {isImage && <FileImage className="w-6 h-6 text-[#00D9FF]" />}
                      {isVideo && <FileVideo className="w-6 h-6 text-[#00D9FF]" />}
                      {!isImage && !isVideo && <Upload className="w-6 h-6 text-[#00D9FF]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold truncate mb-2">{selectedFile.name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {selectedFile.type || `${mediaKind ?? 'unknown'} file`}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Run analysis'
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-6 text-gray-400 leading-relaxed">
                  No file selected yet. Pick a file to unlock the scan action and move straight into
                  the results view.
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                <div className="text-2xl font-bold text-[#00D9FF] mb-2">1 app</div>
                <p className="text-gray-400 text-sm">Frontend and backend now feel like one product.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                <div className="text-2xl font-bold text-[#00D9FF] mb-2">50MB</div>
                <p className="text-gray-400 text-sm">Per-upload limit for the current local workflow.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                <div className="text-2xl font-bold text-[#00D9FF] mb-2">SQLite history</div>
                <p className="text-gray-400 text-sm">Revisit recent checks from the backend after deployment.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
