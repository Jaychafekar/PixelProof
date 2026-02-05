import { Code, Copy, Check, Key, Zap, Shield, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface APIDocsPageProps {
  onNavigate: (page: string) => void;
}

export function APIDocsPage({ onNavigate }: APIDocsPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `curl -X POST https://api.pixelproof.ai/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/media.jpg"`;

  const pythonExample = `import requests

url = "https://api.pixelproof.ai/v1/analyze"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    "file": open("media.jpg", "rb")
}

response = requests.post(url, headers=headers, files=files)
result = response.json()

print(f"Result: {result['label']}")
print(f"Confidence: {result['confidence']}%")`;

  const javascriptExample = `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://api.pixelproof.ai/v1/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();
console.log(\`Result: \${result.label}\`);
console.log(\`Confidence: \${result.confidence}%\`);`;

  const responseExample = `{
  "success": true,
  "timestamp": "2024-02-04T10:30:45Z",
  "analysis_time_ms": 2847,
  "file_info": {
    "filename": "example.jpg",
    "type": "image/jpeg",
    "size_bytes": 2458624
  },
  "result": {
    "label": "Fake",
    "confidence": 92.7,
    "details": {
      "facial_artifacts": "Detected",
      "audio_sync": "N/A",
      "noise_patterns": "Anomalous",
      "compression": "Normal"
    }
  },
  "model_version": "v2.0.3"
}`;

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            API{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Integrate PixelProof deepfake detection into your applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <Zap className="w-8 h-8 text-[#00D9FF] mb-3" />
            <div className="text-2xl font-bold text-[#00D9FF] mb-1">&lt;3s</div>
            <div className="text-sm text-gray-400">Average Response Time</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <Shield className="w-8 h-8 text-[#00D9FF] mb-3" />
            <div className="text-2xl font-bold text-[#00D9FF] mb-1">99.9%</div>
            <div className="text-sm text-gray-400">API Uptime</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <BookOpen className="w-8 h-8 text-[#00D9FF] mb-3" />
            <div className="text-2xl font-bold text-[#00D9FF] mb-1">100/mo</div>
            <div className="text-sm text-gray-400">Free Tier Requests</div>
          </div>
        </div>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10 mb-6">
            <div className="flex items-start gap-4">
              <Key className="w-6 h-6 text-[#00D9FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Authentication</h3>
                <p className="text-gray-300 mb-4">
                  All API requests require authentication using an API key. Include your API key in the <code className="px-2 py-1 bg-black/30 rounded text-[#00D9FF]">Authorization</code> header:
                </p>
                <code className="block p-3 bg-black/30 rounded text-sm text-[#00D9FF]">
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-sm text-gray-400 mt-3">
                  Get your API key from the dashboard (coming soon) or contact sales for enterprise access.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <h4 className="font-semibold mb-2 text-blue-300">Base URL</h4>
            <code className="text-sm text-gray-300">https://api.pixelproof.ai/v1</code>
          </div>
        </section>

        {/* Endpoint */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Endpoints</h2>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded font-mono text-sm font-semibold">POST</span>
              <code className="text-lg text-[#00D9FF] mt-0.5">/analyze</code>
            </div>
            <p className="text-gray-300 mb-4">
              Analyze an image or video file for deepfake detection.
            </p>

            {/* Parameters */}
            <div className="mb-4">
              <h4 className="font-semibold mb-3">Request Parameters</h4>
              <div className="space-y-3">
                <div className="p-3 bg-black/30 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-[#00D9FF]">file</code>
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">required</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    The media file to analyze (JPG, PNG, WEBP, MP4, MOV). Max size: 50MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Response */}
            <div>
              <h4 className="font-semibold mb-3">Response</h4>
              <div className="relative">
                <button
                  onClick={() => handleCopy(responseExample, 'response')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy code"
                >
                  {copiedCode === 'response' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <pre className="p-4 bg-black/30 rounded overflow-x-auto text-sm">
                  <code className="text-gray-300">{responseExample}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Code Examples</h2>
          
          {/* cURL */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5 text-[#00D9FF]" />
              cURL
            </h3>
            <div className="relative">
              <button
                onClick={() => handleCopy(curlExample, 'curl')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                title="Copy code"
              >
                {copiedCode === 'curl' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <pre className="p-4 bg-black/30 rounded overflow-x-auto">
                <code className="text-sm text-gray-300">{curlExample}</code>
              </pre>
            </div>
          </div>

          {/* Python */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5 text-[#00D9FF]" />
              Python
            </h3>
            <div className="relative">
              <button
                onClick={() => handleCopy(pythonExample, 'python')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                title="Copy code"
              >
                {copiedCode === 'python' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <pre className="p-4 bg-black/30 rounded overflow-x-auto">
                <code className="text-sm text-gray-300">{pythonExample}</code>
              </pre>
            </div>
          </div>

          {/* JavaScript */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5 text-[#00D9FF]" />
              JavaScript
            </h3>
            <div className="relative">
              <button
                onClick={() => handleCopy(javascriptExample, 'javascript')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                title="Copy code"
              >
                {copiedCode === 'javascript' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <pre className="p-4 bg-black/30 rounded overflow-x-auto">
                <code className="text-sm text-gray-300">{javascriptExample}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Rate Limits</h2>
          
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Tier</th>
                  <th className="px-6 py-4 text-left font-semibold">Requests/Month</th>
                  <th className="px-6 py-4 text-left font-semibold">Rate Limit</th>
                  <th className="px-6 py-4 text-left font-semibold">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">Free</td>
                  <td className="px-6 py-4">100</td>
                  <td className="px-6 py-4">10/min</td>
                  <td className="px-6 py-4 text-[#00D9FF] font-semibold">$0</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">Starter</td>
                  <td className="px-6 py-4">5,000</td>
                  <td className="px-6 py-4">60/min</td>
                  <td className="px-6 py-4 text-[#00D9FF] font-semibold">$49/mo</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">Professional</td>
                  <td className="px-6 py-4">50,000</td>
                  <td className="px-6 py-4">300/min</td>
                  <td className="px-6 py-4 text-[#00D9FF] font-semibold">$299/mo</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">Enterprise</td>
                  <td className="px-6 py-4">Unlimited</td>
                  <td className="px-6 py-4">Custom</td>
                  <td className="px-6 py-4 text-[#00D9FF] font-semibold">Contact Sales</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Error Codes</h2>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-red-400 font-mono">400</code>
                <span className="font-semibold">Bad Request</span>
              </div>
              <p className="text-sm text-gray-400">Invalid file format or missing required parameters.</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-red-400 font-mono">401</code>
                <span className="font-semibold">Unauthorized</span>
              </div>
              <p className="text-sm text-gray-400">Invalid or missing API key.</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-red-400 font-mono">413</code>
                <span className="font-semibold">Payload Too Large</span>
              </div>
              <p className="text-sm text-gray-400">File size exceeds 50MB limit.</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-red-400 font-mono">429</code>
                <span className="font-semibold">Too Many Requests</span>
              </div>
              <p className="text-sm text-gray-400">Rate limit exceeded. Upgrade your plan for higher limits.</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-red-400 font-mono">500</code>
                <span className="font-semibold">Internal Server Error</span>
              </div>
              <p className="text-sm text-gray-400">An error occurred on our servers. Please try again later.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-[#00D9FF]/10 to-[#9333EA]/10 border border-[#00D9FF]/30">
          <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
          <p className="text-gray-300 mb-6">
            Contact our developer support team or join our community Discord for assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50">
              Contact Support
            </button>
            <button className="border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              Join Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
