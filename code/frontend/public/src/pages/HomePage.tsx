import { ChevronRight, Code, FileCheck, Focus, Layers, Lock, Shield, Upload, Zap } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const productSignals = [
    {
      icon: Shield,
      title: 'Built for media trust',
      description:
        'A cleaner product surface for reviewing suspicious images and short-form videos without losing context.',
    },
    {
      icon: Lock,
      title: 'Privacy-aware flow',
      description:
        'Designed around short-lived processing, persistent audit history, and a transparent path from upload to result.',
    },
    {
      icon: Code,
      title: 'Single-app architecture',
      description:
        'Frontend and backend work together as one application, which makes the product easier to deploy and extend.',
    },
    {
      icon: FileCheck,
      title: 'Watermark plus verification',
      description:
        'Authentic image results can export a visible watermark while downloaded reports can still be verified later for integrity.',
    },
  ];

  const workflow = [
    {
      icon: Upload,
      title: 'Upload',
      description: 'Drop in an image or video and start a scan without switching tools.',
    },
    {
      icon: Focus,
      title: 'Inspect',
      description: 'Review label, confidence, warnings, and media-specific details in one view.',
    },
    {
      icon: Layers,
      title: 'Track',
      description: 'Keep a lightweight backend history so previous checks are easy to revisit or export.',
    },
  ];

  const highlights = [
    { label: 'Supported Media', value: 'Images + sampled video' },
    { label: 'Run Mode', value: 'Single merged app' },
    { label: 'Upload Limit', value: '50MB per file' },
    { label: 'Extra Feature', value: 'Watermark + report verification' },
  ];

  return (
    <div>
      <section className="container mx-auto px-6 pt-10 pb-20">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/90 via-[#111827]/80 to-[#1F2937]/80 p-8 md:p-10 shadow-2xl shadow-cyan-950/20">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#8CEBFF] mb-6">
              <Zap className="w-4 h-4" />
              Deepfake detection, simplified
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] mb-6">
              Detect.
              <br />
              Verify.
              <br />
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
                Protect.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-8">
              PixelProof gives you a sharper way to review suspicious media with a focused upload
              flow, readable results, and a cleaner bridge between product UX and model output.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={() => onNavigate('analyze')}
                className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-8 py-4 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/35"
              >
                Start Analysis
              </button>
              <button
                onClick={() => onNavigate('verify-report')}
                className="border border-white/10 hover:border-[#00D9FF]/35 hover:bg-white/5 text-white px-8 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Verify a saved report
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {workflow.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-[#00D9FF]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-[#00D9FF]/20 bg-gradient-to-br from-[#00D9FF]/10 via-[#0F172A]/80 to-[#9333EA]/10 p-8 relative overflow-hidden">
              <div className="absolute -top-10 right-0 h-36 w-36 rounded-full bg-[#00D9FF]/20 blur-3xl" />
              <div className="absolute -bottom-12 left-0 h-36 w-36 rounded-full bg-[#9333EA]/20 blur-3xl" />

              <div className="relative z-10">
                <div className="text-sm uppercase tracking-[0.28em] text-[#8CEBFF]/80 mb-3">
                  Product State
                </div>
                <h2 className="text-3xl font-bold mb-4">Ready for better iteration</h2>
                <p className="text-gray-300 leading-relaxed mb-8">
                  The frontend now feels more like a cohesive product, which gives us a better base
                  for the next round of model and training pipeline improvements.
                </p>

                <div className="grid gap-4">
                  {highlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"
                    >
                      <div className="text-sm text-gray-400 mb-1">{item.label}</div>
                      <div className="text-lg font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 p-8">
              <div className="text-sm uppercase tracking-[0.28em] text-gray-400 mb-3">
                Why it feels better
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                This version focuses less on inflated marketing claims and more on a product
                experience that feels trustworthy, readable, and easy to extend.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#00D9FF] flex-shrink-0" />
                  <span>Sharper information hierarchy across product pages</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#00D9FF] flex-shrink-0" />
                  <span>Cleaner handoff between upload, result, and history flows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#00D9FF] flex-shrink-0" />
                  <span>A stronger base for future model and pipeline work</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            A better front door for{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              authenticity review
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The site now emphasizes what the product actually does well today while leaving room for
            deeper model improvements tomorrow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {productSignals.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 p-8 hover:border-[#00D9FF]/35 hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-[#00D9FF]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
