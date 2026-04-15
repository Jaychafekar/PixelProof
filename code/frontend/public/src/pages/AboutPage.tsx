import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code,
  Eye,
  Focus,
  Layers,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const spotlightStats = [
    { label: 'Current Scope', value: 'Images + Video' },
    { label: 'Response Goal', value: 'Seconds, not minutes' },
    { label: 'Privacy Model', value: 'Processed by the local app backend' },
  ];

  const useCases = [
    {
      icon: Shield,
      title: 'Newsroom Verification',
      description:
        'Give editors and researchers a fast first-pass check before publishing or escalating questionable media.',
    },
    {
      icon: Eye,
      title: 'Trust & Safety',
      description:
        'Help moderation and integrity teams review suspicious uploads without changing their workflow.',
    },
    {
      icon: Code,
      title: 'Developer Integration',
      description:
        'Expose the same detection flow through the API so other tools can automate verification.',
    },
  ];

  const principles = [
    {
      icon: Focus,
      title: 'Built For Clarity',
      description:
        'PixelProof is designed to explain what it saw, not just return a label. The goal is to support better decisions, not black-box them.',
    },
    {
      icon: Lock,
      title: 'Privacy By Default',
      description:
        'Uploads are handled for analysis only. The product is shaped around minimal retention with a server-backed audit history that stores results, not raw media.',
    },
    {
      icon: Layers,
      title: 'Practical Over Perfect',
      description:
        'This is a production-minded platform focused on useful signals, strong UX, and a clean handoff between product surface and backend intelligence.',
    },
  ];

  const workflow = [
    {
      step: '01',
      title: 'Upload media',
      description:
        'Images and short-form videos are accepted through the same interface, with lightweight validation before analysis begins.',
    },
    {
      step: '02',
      title: 'Extract evidence',
      description:
        'The backend inspects frames, face regions, and visual patterns that often reveal synthetic or manipulated content.',
    },
    {
      step: '03',
      title: 'Score with context',
      description:
        'Prediction scores are combined with threshold logic, timing data, and media-specific details for a more usable result.',
    },
    {
      step: '04',
      title: 'Review confidently',
      description:
        'The final result is presented in a way that is easy to scan, reopen from history, and use as one input in a broader review process.',
    },
  ];

  const limitations = [
    {
      title: 'Evolving threats',
      body:
        'Deepfake methods keep changing, so new generation techniques can outpace any static detector for a period of time.',
    },
    {
      title: 'Quality matters',
      body:
        'Heavy compression, tiny faces, low light, and poor source quality can reduce the reliability of visual forensic signals.',
    },
    {
      title: 'Context still matters',
      body:
        'PixelProof evaluates technical authenticity cues. It cannot decide whether a real clip is misleading because it is cropped, edited, or taken out of context.',
    },
    {
      title: 'Support, not proof',
      body:
        'Results should inform judgment, not replace it, especially in legal, reputational, or safety-critical situations.',
    },
  ];

  const faqs = [
    {
      question: 'How does PixelProof detect deepfakes?',
      answer:
        'PixelProof uses a computer-vision pipeline that looks for visual inconsistencies commonly associated with manipulated media, then pairs those signals with model scores and media-specific metadata to produce a final result.',
    },
    {
      question: 'What types of media can PixelProof analyze?',
      answer:
        'The current app supports JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, AVI, and MKV files up to 50MB. Images are processed as a single frame, while videos are sampled and aggregated.',
    },
    {
      question: 'Is the result always correct?',
      answer:
        'No detector is perfect. PixelProof is best used as a strong screening layer that helps you prioritize review, not as a single source of truth.',
    },
    {
      question: 'What happens to uploaded files?',
      answer:
        'The product is designed around short-lived analysis rather than permanent raw-file storage. PixelProof keeps a persistent analysis history in SQLite, while uploaded media is processed for the request and not retained as files.',
    },
    {
      question: 'Can PixelProof be used in a larger product?',
      answer:
        'Yes. The frontend and backend now share one application surface, and the same detection flow is available through the API for integration work.',
    },
    {
      question: 'Why show limitations so prominently?',
      answer:
        'Because trust tools should be honest about what they can and cannot do. Good detection UX includes confidence, caveats, and responsible framing.',
    },
  ];

  return (
    <div className="container mx-auto px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <section className="mb-20">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#111827]/90 via-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md p-8 md:p-10 shadow-2xl shadow-cyan-950/20">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/25 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#8CEBFF] mb-6">
                <Shield className="w-4 h-4" />
                About the platform
              </div>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
                Trust digital media with{' '}
                <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
                  clearer signals
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-8">
                PixelProof is a media authenticity platform built to make deepfake review feel
                faster, calmer, and more transparent. It combines a polished product surface with a
                practical detection backend so teams can inspect suspicious media without losing
                momentum.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate('analyze')}
                  className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/40"
                >
                  Analyze Media
                </button>
                <button
                  onClick={() => onNavigate('api-docs')}
                  className="border border-white/15 hover:border-[#00D9FF]/40 hover:bg-white/5 text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Explore API
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#00D9FF]/20 bg-gradient-to-br from-[#00D9FF]/10 via-[#0F172A]/80 to-[#9333EA]/10 backdrop-blur-md p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-10 right-0 w-40 h-40 rounded-full bg-[#00D9FF]/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-[#9333EA]/20 blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-[#8CEBFF]/80 mb-2">
                      Product Snapshot
                    </p>
                    <h2 className="text-2xl font-bold">What PixelProof is built to do</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#00D9FF]" />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {spotlightStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"
                    >
                      <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                      <div className="text-lg font-semibold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
                    Why this matters
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Synthetic media is no longer niche. Tools like PixelProof help teams slow down,
                    inspect with intention, and make better calls before content spreads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 backdrop-blur-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-gray-400">The Story</p>
                  <h2 className="text-3xl font-bold">Why PixelProof exists</h2>
                </div>
              </div>

              <div className="space-y-5 text-gray-300 leading-relaxed">
                <p>
                  PixelProof was shaped around a simple product idea: media verification should not
                  feel like a research project every time you need it. The experience should be
                  readable, fast, and grounded in technical evidence.
                </p>
                <p>
                  Instead of treating detection as a hidden backend-only feature, this app brings
                  the model, the explanation layer, and the product UI into one cohesive workflow.
                  That makes it easier to inspect a file, understand the outcome, and move to the
                  next decision with context still intact.
                </p>
                <p>
                  The result is a platform direction that is ready to deploy now and flexible
                  enough to grow into stronger newsroom, platform, and API workflows later.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {useCases.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 backdrop-blur-md p-6 hover:border-[#00D9FF]/25 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-[#00D9FF]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How the experience works
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              The flow is designed to feel straightforward on the surface while still exposing the
              analysis details that make the result meaningful.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#00D9FF]/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="text-sm font-semibold tracking-[0.3em] text-[#00D9FF] mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Product principles
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              The design stays sharp and futuristic, but the philosophy underneath it is practical:
              make trust workflows easier to understand and easier to use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/75 backdrop-blur-md p-7 hover:-translate-y-1 hover:border-[#00D9FF]/30 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center mb-5">
                  <principle.icon className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{principle.title}</h3>
                <p className="text-gray-400 leading-relaxed">{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/85 to-[#1F2937]/80 backdrop-blur-md p-8 md:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-3">Ethical use and responsible framing</h2>
                  <p className="text-gray-300 leading-relaxed">
                    PixelProof is meant to support trust decisions, not fuel surveillance,
                    harassment, or false certainty. Responsible detection means being explicit about
                    confidence, privacy, and limits from the start.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Be transparent about what the model can and cannot infer.',
                  'Protect user media by keeping analysis handling minimal and purpose-bound.',
                  'Avoid using results as automatic proof in high-stakes decisions.',
                  'Keep improving the system as manipulation tactics evolve.',
                ].map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-gray-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#00D9FF] flex-shrink-0" />
                      <p className="leading-relaxed">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-[#1F2937]/80 backdrop-blur-md p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Important notice</h3>
                  <p className="text-gray-300 leading-relaxed">
                    This product should not be used to identify individuals, enable unauthorized
                    surveillance, or justify harmful action without additional human review.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-gray-300">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Use it to support editorial, research, moderation, and internal review workflows.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Do not treat a single model result as legal proof or a final verdict.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Pair the result with provenance checks, source review, and contextual analysis.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Known limitations</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Better trust tooling starts with honest product language. These are the constraints
              users should understand before acting on a result.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {limitations.map((item, index) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md p-7"
              >
                <div className="text-sm font-semibold tracking-[0.3em] text-[#00D9FF] mb-4">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently asked questions
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              The goal here is not just to answer product questions, but to set expectations
              clearly for anyone evaluating the platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-6 md:p-7 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 min-w-9 h-9 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/10 text-[#00D9FF] text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold pr-2">{faq.question}</h3>
                  </div>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-[#00D9FF] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 md:px-7 pb-7 md:pl-[4.9rem]">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-[28px] border border-[#00D9FF]/25 bg-gradient-to-r from-[#00D9FF]/10 via-white/5 to-[#9333EA]/10 p-8 md:p-10 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to see the product in action?</h3>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Upload a file, review the result, and explore the same single-app experience that now
            powers both the product surface and the backend analysis flow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('analyze')}
              className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/40"
            >
              Try PixelProof Now
            </button>
            <button
              onClick={() => onNavigate('api-docs')}
              className="border border-white/15 hover:border-[#00D9FF]/35 hover:bg-white/5 text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              View API Docs
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
