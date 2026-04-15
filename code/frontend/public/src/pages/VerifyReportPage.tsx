import { useMemo, useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  Upload,
  XCircle,
} from 'lucide-react';
import { getApiOrigin, verifySignedReport } from '../services/api';
import type { ApiReportVerificationResponse } from '../types/analysis';

interface VerifyReportPageProps {
  onNavigate: (page: string) => void;
}

function formatVerificationHeadline(verification: ApiReportVerificationResponse | null) {
  if (!verification) {
    return 'No verification run yet';
  }
  return verification.valid ? 'Report verified successfully' : 'Report verification failed';
}

export function VerifyReportPage({ onNavigate }: VerifyReportPageProps) {
  const [reportText, setReportText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [verification, setVerification] = useState<ApiReportVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifyEndpoint = useMemo(() => `${getApiOrigin()}/verify-report`, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setReportText(text);
      setSelectedFileName(file.name);
      setVerification(null);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to read the selected report file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleVerify = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setVerification(null);

    let parsedReport: unknown;
    try {
      parsedReport = JSON.parse(reportText);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('The uploaded or pasted file is not valid JSON.');
      return;
    }

    try {
      const result = await verifySignedReport(parsedReport);
      setVerification(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to verify report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setReportText('');
    setSelectedFileName(null);
    setVerification(null);
    setErrorMessage(null);
  };

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 mb-5">
            <Shield className="w-4 h-4" />
            Authenticity and provenance layer
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Verify signed{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-emerald-400 bg-clip-text text-transparent">
              PixelProof reports
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
            Upload a saved JSON report from PixelProof and confirm whether its signature is still
            valid. This gives the product a visible integrity-check workflow instead of relying on
            raw model output alone.
          </p>
        </div>

        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-8 mb-8">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/90 via-[#111827]/80 to-[#1F2937]/80 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-[#00D9FF]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Upload or paste report JSON</h2>
                <p className="text-gray-300 leading-relaxed">
                  This accepts either the full exported report file or the raw signed report bundle.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-[#00D9FF]/30 bg-[#00D9FF]/5 px-5 py-5 text-center hover:border-[#00D9FF]/45 hover:bg-[#00D9FF]/10 transition-all">
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="font-semibold text-white mb-1">Choose JSON report</div>
                <div className="text-sm text-gray-400">
                  {selectedFileName ?? 'Select a saved PixelProof report file'}
                </div>
              </label>

              <button
                onClick={handleClear}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white hover:border-white/20 hover:bg-white/10 transition-all"
              >
                Clear
              </button>
            </div>

            <textarea
              value={reportText}
              onChange={(event) => setReportText(event.target.value)}
              placeholder='Paste report JSON here, for example: { "report": { ... } }'
              className="w-full min-h-[280px] rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00D9FF]/35"
            />

            <div className="mt-5 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleVerify}
                disabled={isSubmitting || !reportText.trim()}
                className="flex-1 rounded-2xl bg-[#00D9FF] px-6 py-3 font-semibold text-black transition-all hover:bg-[#00C4E6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying report...' : 'Verify report signature'}
              </button>
              <button
                onClick={() => onNavigate('api-docs')}
                className="flex-1 rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white transition-all hover:border-[#00D9FF]/35 hover:bg-white/5"
              >
                See API reference
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Why this matters</h2>
                  <p className="text-gray-300 leading-relaxed">
                    A detection result is stronger when the report itself can be checked later for
                    tampering. This makes PixelProof more useful for audits, journalism, security
                    reviews, and academic demonstrations.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-gray-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  Step 1: Analyze media and download the signed JSON report.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  Step 2: Re-upload that report here later to prove it has not been modified.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 break-all">
                  Verify endpoint: <span className="font-semibold text-white">{verifyEndpoint}</span>
                </div>
              </div>
            </div>

            <div
              className={`rounded-[32px] border p-8 ${
                verification
                  ? verification.valid
                    ? 'border-emerald-400/20 bg-emerald-500/10'
                    : 'border-red-400/20 bg-red-500/10'
                  : 'border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    verification
                      ? verification.valid
                        ? 'bg-emerald-500/10 border border-emerald-400/20'
                        : 'bg-red-500/10 border border-red-400/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {verification ? (
                    verification.valid ? (
                      <CheckCircle className="w-6 h-6 text-emerald-300" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-300" />
                    )
                  ) : (
                    <Shield className="w-6 h-6 text-[#00D9FF]" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{formatVerificationHeadline(verification)}</h2>
                  <p className="text-gray-200 leading-relaxed mb-5">
                    {verification
                      ? verification.valid
                        ? 'The signature matches the report payload, so the saved report still appears intact.'
                        : verification.reason || 'The uploaded report could not be verified.'
                      : 'Your verification result will appear here after you upload or paste a signed report.'}
                  </p>

                  {verification && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <div className="text-sm text-gray-400 mb-1">Verification status</div>
                        <div className={`font-semibold ${verification.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                          {verification.valid ? 'Valid signature' : 'Invalid signature'}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <div className="text-sm text-gray-400 mb-1">Algorithm</div>
                        <div className="font-semibold text-white">
                          {verification.algorithm ?? 'Unavailable'}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <div className="text-sm text-gray-400 mb-1">Analysis ID</div>
                        <div className="font-semibold text-white break-all">
                          {verification.analysis_id ?? 'Unavailable'}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <div className="text-sm text-gray-400 mb-1">Label in report</div>
                        <div className="font-semibold text-white">
                          {verification.label ?? 'Unavailable'}
                        </div>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-4 text-gray-100 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-7">
          <h2 className="text-2xl font-bold mb-4">How to present this in your submission</h2>
          <p className="text-gray-300 leading-relaxed mb-5">
            This page turns PixelProof from a detector into a fuller authenticity workflow. In your
            dissertation and viva, describe it as a provenance-support feature that helps confirm
            whether a previously exported result still matches the original server-issued report.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-sm text-gray-400 mb-1">Academic value</div>
              <div className="font-semibold text-white">Shows authenticity workflow thinking</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-sm text-gray-400 mb-1">Product value</div>
              <div className="font-semibold text-white">Lets users re-check saved evidence later</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-sm text-gray-400 mb-1">Sector value</div>
              <div className="font-semibold text-white">Useful for journalism, security, and audit trails</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
