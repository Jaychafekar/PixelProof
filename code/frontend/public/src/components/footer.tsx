import { ArrowUpRight, BookOpen, Code, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0C1220]/70 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-16">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00D9FF]/20 bg-[#00D9FF]/10">
                <Shield className="h-6 w-6 text-[#00D9FF]" />
              </div>
              <div>
                <div className="text-xl font-bold">
                  <span className="text-white">Pixel</span>
                  <span className="text-[#00D9FF]">Proof</span>
                </div>
                <div className="text-sm text-gray-400">Deepfake detection platform</div>
              </div>
            </div>

            <p className="mb-8 max-w-2xl leading-relaxed text-gray-300">
              A deployable product for checking suspicious media, reviewing model output, and
              keeping a persistent authenticity review trail.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => onNavigate('analyze')}
                className="rounded-2xl bg-[#00D9FF] px-6 py-3 font-semibold text-black transition-all hover:bg-[#00C4E6]"
              >
                Analyze Media
              </button>
              <button
                onClick={() => onNavigate('api-docs')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white transition-all hover:border-[#00D9FF]/35 hover:bg-white/5"
              >
                API Reference
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#00D9FF]" />
                <h4 className="font-bold">Explore</h4>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('home')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Home
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  About the platform
                </button>
                <button
                  onClick={() => onNavigate('history')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Analysis history
                </button>
                <button
                  onClick={() => onNavigate('verify-report')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Verify reports
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <Code className="h-5 w-5 text-[#00D9FF]" />
                <h4 className="font-bold">Build</h4>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('api-docs')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  API docs
                </button>
                <button
                  onClick={() => onNavigate('analyze')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Upload workflow
                </button>
                <button
                  onClick={() => onNavigate('verify-report')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Verification workflow
                </button>
                <button
                  onClick={() => onNavigate('results')}
                  className="block text-gray-400 transition-colors hover:text-white"
                >
                  Result surface
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm md:flex-row">
          <p className="text-gray-400">Copyright 2026 PixelProof. Built for trustworthy media review.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => onNavigate('about')}
              className="text-gray-400 transition-colors hover:text-white"
            >
              Responsible use
            </button>
            <button
              onClick={() => onNavigate('api-docs')}
              className="text-gray-400 transition-colors hover:text-white"
            >
              API
            </button>
            <button
              onClick={() => onNavigate('verify-report')}
              className="text-gray-400 transition-colors hover:text-white"
            >
              Verify reports
            </button>
            <button
              onClick={() => onNavigate('analyze')}
              className="text-gray-400 transition-colors hover:text-white"
            >
              Try now
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
