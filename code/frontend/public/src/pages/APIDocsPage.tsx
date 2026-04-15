import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  Code,
  Copy,
  Key,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { getApiOrigin } from '../services/api';

interface APIDocsPageProps {
  onNavigate: (page: string) => void;
}

export function APIDocsPage({ onNavigate }: APIDocsPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const apiOrigin = getApiOrigin();
  const analyzeUrl = `${apiOrigin}/analyze`;
  const analysesUrl = `${apiOrigin}/analyses`;
  const docsUrl = `${apiOrigin}/docs`;
  const healthUrl = `${apiOrigin}/health`;
  const verifyReportUrl = `${apiOrigin}/verify-report`;

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const curlExample = `curl -X POST ${analyzeUrl} \\
  -F "file=@/path/to/media.jpg"`;

  const pythonExample = `import requests

url = "${analyzeUrl}"
files = {
    "file": open("media.jpg", "rb")
}

response = requests.post(url, files=files)
response.raise_for_status()
result = response.json()

print(result["label"], result["confidence"])`;

  const javascriptExample = `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("${analyzeUrl}", {
  method: "POST",
  body: formData
});

if (!response.ok) throw new Error("Analyze failed");
const result = await response.json();
console.log(result);`;

  const verifyExample = `curl -X POST ${verifyReportUrl} \\
  -H "Content-Type: application/json" \\
  -d @signed-report.json`;

  const responseExample = `{
  "analysis_id": "pp_a1b2c3d4e5f6",
  "created_at": "2026-04-14T00:46:08.302891+00:00",
  "media_type": "image",
  "filename": "example.jpg",
  "content_type": "image/jpeg",
  "label": "Fake",
  "confidence": 0.982,
  "scores": {
    "fake": 0.982,
    "real": 0.018
  },
  "processing_ms": 2412,
  "model": {
    "name": "MobileNetV2 Forensics Classifier",
    "source": "weights",
    "input_size": [96, 96],
    "fake_threshold": 0.95
  },
  "details": {
    "strategy": "single-frame image classification",
    "frames_sampled": 1,
    "suspicious_frame_ratio": 1.0,
    "decision_basis": "fake_score_above_threshold"
  },
  "warnings": [],
  "report": {
    "version": 1,
    "algorithm": "HMAC-SHA256",
    "signature": "2a9c4f...f6f9",
    "verify_endpoint": "/verify-report",
    "payload": {
      "analysis_id": "pp_a1b2c3d4e5f6",
      "label": "Fake",
      "confidence": 0.927
    }
  }
}`;

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#8CEBFF] mb-5">
              <Code className="w-4 h-4" />
              Local API reference
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">
              API{' '}
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
                documentation
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
              The website and API run together as one application. That keeps deployment simpler
              and gives the product one backend for uploads, signed reports, and stored analysis
              history.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/75 p-8">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">Base URL</div>
                <div className="font-semibold break-all">{apiOrigin}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">Analyze endpoint</div>
                <div className="font-semibold break-all">{analyzeUrl}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">History endpoint</div>
                <div className="font-semibold break-all">{analysesUrl}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">Interactive docs</div>
                <div className="font-semibold break-all">{docsUrl}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">Health check</div>
                <div className="font-semibold break-all">{healthUrl}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-sm text-gray-400 mb-1">Report verification</div>
                <div className="font-semibold break-all">{verifyReportUrl}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6">
            <Zap className="w-8 h-8 text-[#00D9FF] mb-4" />
            <div className="text-xl font-bold mb-2">Simple request model</div>
            <p className="text-gray-400 leading-relaxed">
              Send one multipart upload to <code className="text-[#00D9FF]">/analyze</code> and
              get back a structured JSON response.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6">
            <Shield className="w-8 h-8 text-[#00D9FF] mb-4" />
            <div className="text-xl font-bold mb-2">Signed report flow</div>
            <p className="text-gray-400 leading-relaxed">
              Results now include a server-side signature so exported reports can be verified later
              for integrity using the local API.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6">
            <BookOpen className="w-8 h-8 text-[#00D9FF] mb-4" />
            <div className="text-xl font-bold mb-2">Structured output</div>
            <p className="text-gray-400 leading-relaxed">
              Responses include label, confidence, scores, processing time, model metadata,
              history-safe report bundles, and media-specific details.
            </p>
          </div>
        </div>

        <section className="mb-12 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/75 p-8">
          <div className="flex items-start gap-4 mb-6">
            <Key className="w-6 h-6 text-[#00D9FF] flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Getting started</h2>
              <p className="text-gray-300 leading-relaxed">
                This local version does not require API key setup. Post a file directly to the
                merged backend, then verify signed reports later if you need an integrity check.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-gray-400 mb-2">Request</div>
              <div className="font-semibold mb-2">POST /analyze</div>
              <p className="text-gray-400">Accepts one file field named <code className="text-[#00D9FF]">file</code>.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-gray-400 mb-2">History</div>
              <div className="font-semibold mb-2">GET /analyses</div>
              <p className="text-gray-400">Returns the most recent stored analyses from the SQLite-backed review history.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-gray-400 mb-2">Supported media</div>
              <p className="text-gray-400">JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, AVI, and MKV up to 50MB.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-gray-400 mb-2">Verification</div>
              <div className="font-semibold mb-2">POST /verify-report</div>
              <p className="text-gray-400">Accepts the saved signed report JSON and checks whether its signature is still valid.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Code examples</h2>

          {[
            ['curl', 'cURL', curlExample],
            ['python', 'Python', pythonExample],
            ['javascript', 'JavaScript', javascriptExample],
          ].map(([id, label, code]) => (
            <div key={id} className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Code className="w-5 h-5 text-[#00D9FF]" />
                  {label}
                </h3>
                <button
                  onClick={() => handleCopy(code, id)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy code"
                >
                  {copiedCode === id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <pre className="rounded-2xl bg-black/30 p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">{code}</code>
              </pre>
            </div>
          ))}
        </section>

        <section className="mb-12 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00D9FF]" />
              Verify a saved report
            </h2>
            <button
              onClick={() => handleCopy(verifyExample, 'verify')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy code"
            >
              {copiedCode === 'verify' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          <pre className="rounded-2xl bg-black/30 p-4 overflow-x-auto">
            <code className="text-sm text-gray-300">{verifyExample}</code>
          </pre>
        </section>

        <div className="grid lg:grid-cols-[1fr_0.85fr] gap-8 mb-12">
          <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-8">
            <h2 className="text-3xl font-bold mb-6">Example response</h2>
            <div className="relative">
              <button
                onClick={() => handleCopy(responseExample, 'response')}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                title="Copy response"
              >
                {copiedCode === 'response' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <pre className="rounded-2xl bg-black/30 p-4 overflow-x-auto text-sm">
                <code className="text-gray-300">{responseExample}</code>
              </pre>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-8">
            <h2 className="text-3xl font-bold mb-6">Useful response fields</h2>
            <div className="space-y-4">
              {[
                ['label', 'Final thresholded classification used by the UI result screen.'],
                ['confidence', 'Confidence for the selected label as a 0-1 value.'],
                ['scores', 'Raw class scores for fake and real before any threshold explanation in the UI.'],
                ['processing_ms', 'How long the backend took to produce the result.'],
                ['report', 'Signed report bundle that can be verified later to detect tampering.'],
                ['details', 'Media-specific metadata such as sampled frames or face detection rate.'],
                ['warnings', 'Notes worth surfacing when the scan has caveats.'],
              ].map(([field, description]) => (
                <div key={field} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="font-semibold text-[#00D9FF] mb-1">{field}</div>
                  <p className="text-gray-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mb-12 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-300 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Common errors</h2>
              <p className="text-gray-300 leading-relaxed">
                The most likely failures during local development are unsupported media, oversized
                uploads, or the backend model not being ready.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['400', 'Bad request or unreadable media'],
              ['413', 'File too large'],
              ['415', 'Unsupported media type'],
              ['503', 'Model unavailable during startup or load failure'],
            ].map(([code, label]) => (
              <div key={code} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="text-lg font-bold text-red-300 mb-1">{code}</div>
                <div className="text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center rounded-[32px] border border-[#00D9FF]/25 bg-gradient-to-r from-[#00D9FF]/10 via-white/5 to-[#9333EA]/10 p-8">
          <h3 className="text-3xl font-bold mb-4">Need the product view too?</h3>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Jump back into the upload flow or review the platform story. The docs now sit inside
            the same overall product experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('analyze')}
              className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-2xl font-semibold transition-all"
            >
              Open analyzer
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="border border-white/10 hover:border-[#00D9FF]/35 hover:bg-white/5 text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              Read about PixelProof
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
