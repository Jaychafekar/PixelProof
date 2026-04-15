import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Download,
  FileImage,
  FileVideo,
  RotateCcw,
  Shield,
  XCircle,
} from 'lucide-react';
import { downloadBlob, downloadTextFile } from '../services/history';
import type { AnalysisResult } from '../types/analysis';

interface ResultsPageProps {
  data: AnalysisResult | null;
  onNavigate: (page: string, data?: AnalysisResult) => void;
}

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDetailLabel(label: string) {
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function loadImageFromUrl(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load the analyzed image for watermark export.'));
    image.src = sourceUrl;
  });
}

async function buildWatermarkedImageBlob(data: AnalysisResult) {
  if (!data.sourceObjectUrl) {
    throw new Error('Watermark export is only available immediately after analyzing an image.');
  }

  const image = await loadImageFromUrl(data.sourceObjectUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas export is not available in this browser.');
  }

  const width = canvas.width;
  const height = canvas.height;
  const shortestSide = Math.min(width, height);
  const baseFontSize = Math.max(18, Math.round(shortestSide * 0.045));
  const footerHeight = Math.max(92, Math.round(height * 0.14));
  const padding = Math.max(18, Math.round(shortestSide * 0.03));
  const signaturePreview = data.report?.signature
    ? `${data.report.signature.slice(0, 12)}...${data.report.signature.slice(-6)}`
    : 'Signed report available';

  context.drawImage(image, 0, 0, width, height);

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 6);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `700 ${baseFontSize}px Arial, sans-serif`;
  context.fillStyle = 'rgba(0, 217, 255, 0.14)';

  const stepY = Math.max(90, Math.round(shortestSide * 0.18));
  const stepX = Math.max(260, Math.round(shortestSide * 0.48));
  for (let y = -height; y <= height; y += stepY) {
    for (let x = -width; x <= width; x += stepX) {
      context.fillText('PIXELPROOF VERIFIED REAL', x, y);
    }
  }
  context.restore();

  context.fillStyle = 'rgba(7, 11, 20, 0.74)';
  context.fillRect(0, height - footerHeight, width, footerHeight);

  const badgeWidth = Math.min(width - padding * 2, Math.max(220, Math.round(width * 0.36)));
  const badgeHeight = Math.max(44, Math.round(footerHeight * 0.42));
  const badgeY = height - footerHeight - padding;
  context.fillStyle = 'rgba(16, 185, 129, 0.92)';
  context.fillRect(padding, badgeY, badgeWidth, badgeHeight);

  context.fillStyle = '#041015';
  context.font = `700 ${Math.max(20, Math.round(baseFontSize * 0.72))}px Arial, sans-serif`;
  context.textBaseline = 'middle';
  context.fillText('PIXELPROOF VERIFIED REAL', padding + 18, badgeY + badgeHeight / 2);

  context.fillStyle = '#F8FAFC';
  context.textAlign = 'left';
  context.font = `700 ${Math.max(22, Math.round(baseFontSize * 0.82))}px Arial, sans-serif`;
  context.fillText('PixelProof authenticity export', padding, height - footerHeight + padding + 6);

  context.font = `500 ${Math.max(16, Math.round(baseFontSize * 0.5))}px Arial, sans-serif`;
  context.fillStyle = 'rgba(226, 232, 240, 0.94)';
  context.fillText(
    `Analysis ID: ${data.analysisId ?? 'Unavailable'}`,
    padding,
    height - footerHeight + padding + 38
  );
  context.fillText(
    `Issued: ${new Date(data.timestamp).toLocaleString()}  |  Confidence: ${data.confidence.toFixed(1)}%`,
    padding,
    height - footerHeight + padding + 64
  );

  context.textAlign = 'right';
  context.fillStyle = 'rgba(0, 217, 255, 0.96)';
  context.fillText(signaturePreview, width - padding, height - footerHeight + padding + 38);
  context.fillStyle = 'rgba(226, 232, 240, 0.85)';
  context.fillText('Backed by PixelProof signed report verification', width - padding, height - footerHeight + padding + 64);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to export the watermarked image.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export function ResultsPage({ data, onNavigate }: ResultsPageProps) {
  const [isExportingWatermark, setIsExportingWatermark] = useState(false);
  const [watermarkError, setWatermarkError] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="container mx-auto px-6 py-16 min-h-screen flex items-center justify-center">
        <div className="max-w-xl text-center rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 p-10">
          <h2 className="text-3xl font-bold mb-4">No result loaded yet</h2>
          <p className="text-gray-400 mb-8">
            Run an analysis first and this page will turn into your full review surface.
          </p>
          <button
            onClick={() => onNavigate('analyze')}
            className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-2xl font-semibold transition-all"
          >
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  const isFake = data.label === 'Fake';
  const fakeScore = data.scores ? data.scores.fake * 100 : isFake ? data.confidence : 100 - data.confidence;
  const realScore = data.scores ? data.scores.real * 100 : isFake ? 100 - data.confidence : data.confidence;
  const detailEntries = Object.entries(data.details ?? {}).slice(0, 8);
  const signedReport = data.report;
  const canExportWatermark =
    data.mediaType === 'image' && data.label === 'Real' && Boolean(data.sourceObjectUrl);
  const rawTopLabel = typeof data.details?.raw_top_label === 'string' ? data.details.raw_top_label : null;
  const decisionThreshold =
    typeof data.details?.decision_threshold === 'number'
      ? data.details.decision_threshold
      : data.model?.fakeThreshold;
  const usedThresholdOverride =
    data.label === 'Real' &&
    rawTopLabel === 'Fake' &&
    typeof data.scores?.fake === 'number' &&
    typeof decisionThreshold === 'number';

  const report = signedReport
    ? {
        report_type: 'pixelproof_signed_analysis_report',
        generated_at: new Date().toISOString(),
        report: signedReport,
        local_context: {
          file_name: data.fileName,
          file_type: data.fileType,
          file_size_bytes: data.fileSize,
          ui_timestamp: data.timestamp,
        },
      }
    : {
        generated_at: new Date().toISOString(),
        result: data,
      };

  const handleDownloadReport = () => {
    downloadTextFile(
      `${data.fileName.replace(/\.[^.]+$/, '') || 'pixelproof'}-report.json`,
      JSON.stringify(report, null, 2),
      'application/json'
    );
  };

  const handleDownloadWatermarkedImage = async () => {
    setIsExportingWatermark(true);
    setWatermarkError(null);

    try {
      const blob = await buildWatermarkedImageBlob(data);
      const baseName = data.fileName.replace(/\.[^.]+$/, '') || 'pixelproof';
      downloadBlob(`${baseName}-verified-watermark.png`, blob);
    } catch (error) {
      setWatermarkError(
        error instanceof Error ? error.message : 'Failed to export the watermarked image.'
      );
    } finally {
      setIsExportingWatermark(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            Reviewed on {new Date(data.timestamp).toLocaleString()}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            {data.mediaType === 'video' ? 'Video analysis' : 'Image analysis'}
          </div>
          {typeof data.processingMs === 'number' && (
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
              {data.processingMs} ms processing time
            </div>
          )}
        </div>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8 mb-8">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/90 via-[#111827]/80 to-[#1F2937]/80 p-8 md:p-10">
            <div className="flex items-center justify-center mb-6">
              {isFake ? (
                <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <XCircle className="w-14 h-14 text-red-400" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                </div>
              )}
            </div>

            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-3">Primary result</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {isFake ? (
                  <span className="text-red-400">Likely manipulated</span>
                ) : (
                  <span className="text-emerald-400">Likely authentic</span>
                )}
              </h1>
              <p className="text-xl text-gray-300">
                Confidence{' '}
                <span className="font-bold text-[#00D9FF]">{data.confidence.toFixed(1)}%</span>
              </p>
            </div>

            <div className="mb-8">
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${
                    isFake
                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(data.confidence, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-sm text-gray-400 mb-2">Raw fake score</div>
                <div className="text-3xl font-bold text-red-400">{fakeScore.toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-sm text-gray-400 mb-2">Raw real score</div>
                <div className="text-3xl font-bold text-emerald-400">{realScore.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">How to read this result</h2>
                  <p className="text-gray-300 leading-relaxed">
                    The label reflects the current thresholded model decision, not just the raw
                    highest class score. Use it as a review signal alongside source context,
                    provenance checks, and human judgment.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-gray-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  Higher confidence suggests stronger alignment with the predicted class.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  Technical details below show what the model examined and how the scan was
                  produced.
                </div>
                {usedThresholdOverride && (
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-4 text-gray-200">
                    The raw fake score was higher than the raw real score, but this file still
                    stayed in the <span className="font-semibold text-emerald-300">Real</span>{' '}
                    bucket because the fake score did not cross the configured threshold of{' '}
                    <span className="font-semibold text-white">{(decisionThreshold * 100).toFixed(1)}%</span>.
                    This conservative rule helps reduce false positives on genuine media.
                  </div>
                )}
              </div>
            </div>

            {data.warnings.length > 0 && (
              <div className="rounded-[32px] border border-amber-500/25 bg-amber-500/10 p-7">
                <h3 className="text-xl font-bold text-amber-300 mb-4">Warnings</h3>
                <div className="space-y-3">
                  {data.warnings.map((warning) => (
                    <div key={warning} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-gray-200">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-8 mb-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-7">
            <h2 className="text-2xl font-bold mb-6">Scan summary</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
                  {data.mediaType === 'video' ? (
                    <FileVideo className="w-6 h-6 text-[#00D9FF]" />
                  ) : (
                    <FileImage className="w-6 h-6 text-[#00D9FF]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-gray-400">File</div>
                  <div className="font-semibold truncate">{data.fileName}</div>
                </div>
              </div>

              {[
                ['File type', data.fileType],
                ['File size', formatFileSize(data.fileSize)],
                ['Media type', data.mediaType],
                ['Model', data.model?.name ?? 'Current backend model'],
                ['Model source', data.model?.source ?? 'Unavailable'],
                [
                  'Fake threshold',
                  typeof data.model?.fakeThreshold === 'number'
                    ? data.model.fakeThreshold.toFixed(2)
                    : 'Unavailable',
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-right font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-7">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-[#00D9FF]" />
              <h2 className="text-2xl font-bold">Detection signals</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                ['Facial artifacts', data.analysis.facialArtifacts],
                ['Audio sync', data.analysis.audioSync],
                ['Noise patterns', data.analysis.noisePatterns],
                ['Compression', data.analysis.compression],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-sm text-gray-400 mb-2">{label}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>

            {detailEntries.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Technical details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {detailEntries.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-sm text-gray-400 mb-1">{formatDetailLabel(label)}</div>
                      <div className="font-medium text-white break-words">{formatDetailValue(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {signedReport && (
          <div className="mb-8 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-7">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Signed report ready</h2>
                <p className="text-gray-200 leading-relaxed mb-5">
                  This result includes a server-side signature so the downloaded report can be
                  checked later for integrity. It proves the report contents were issued by this
                  backend and have not been modified afterward.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="text-sm text-gray-400 mb-1">Algorithm</div>
                    <div className="font-semibold text-white">{signedReport.algorithm}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="text-sm text-gray-400 mb-1">Verify endpoint</div>
                    <div className="font-semibold text-white break-all">
                      {signedReport.verify_endpoint ?? '/verify-report'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="text-sm text-gray-400 mb-1">Signature preview</div>
                    <div className="font-semibold text-white break-all">
                      {signedReport.signature.slice(0, 16)}...{signedReport.signature.slice(-8)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {data.mediaType === 'image' && data.label === 'Real' && (
          <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-7">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-cyan-200" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Verified watermark export</h2>
                <p className="text-gray-200 leading-relaxed mb-4">
                  PixelProof can export this authentic image with a visible verification overlay.
                  This makes the watermarking requirement visible in the product while the signed
                  JSON report remains the stronger integrity record.
                </p>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-gray-300">
                  The export adds a visible <span className="font-semibold text-white">PixelProof Verified Real</span>{' '}
                  mark, the analysis ID, the timestamp, and a signed-report signature preview.
                </div>
                {!canExportWatermark && (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-gray-200">
                    Watermarked export is only available right after the image is analyzed. PixelProof
                    does not keep raw uploads on the server, so older history items can still reopen
                    the result payload but not regenerate the original image.
                  </div>
                )}
                {watermarkError && (
                  <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                    {watermarkError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <button
            onClick={() => onNavigate('analyze')}
            className="flex-1 bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/35 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Analyze another file
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex-1 border border-white/10 hover:border-[#00D9FF]/35 hover:bg-white/5 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {signedReport ? 'Download signed JSON report' : 'Download JSON report'}
          </button>
          {data.mediaType === 'image' && data.label === 'Real' && (
            <button
              onClick={handleDownloadWatermarkedImage}
              disabled={!canExportWatermark || isExportingWatermark}
              className="flex-1 border border-cyan-400/20 hover:border-cyan-300/40 hover:bg-cyan-500/10 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Shield className="w-5 h-5" />
              {isExportingWatermark ? 'Exporting watermark...' : 'Download watermarked image'}
            </button>
          )}
          <button
            onClick={() => onNavigate('history')}
            className="flex-1 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            View history
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-5">
          <p className="text-sm text-gray-200 leading-relaxed">
            <span className="font-semibold text-yellow-300">Important:</span> PixelProof is a
            decision-support tool. For high-stakes use, pair this result with source review,
            provenance checks, and broader investigative context.
          </p>
        </div>
      </div>
    </div>
  );
}
