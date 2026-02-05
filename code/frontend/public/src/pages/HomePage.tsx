import { Zap, Shield, Lock, Focus, Code, Layers, Download, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: Zap,
      title: "Real-time Detection",
      description: "Advanced algorithms process media in seconds with low-latency inference"
    },
    {
      icon: Shield,
      title: "99.9% Accuracy",
      description: "Trained on massive datasets to distinguish even the most subtle artifacts"
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "Your data is processed securely and deleted immediately after analysis"
    },
    {
      icon: Focus,
      title: "Multi-Modal Analysis",
      description: "Detects manipulation in both facial features and audio synchronization"
    },
    {
      icon: Code,
      title: "API Integration",
      description: "Seamlessly integrate our detection engine into your own applications"
    },
    {
      icon: Layers,
      title: "Batch Processing",
      description: "Analyze vast libraries of content efficiently with our scalable pipeline"
    }
  ];

  const stats = [
    { label: "ACCURACY", value: "99.8%" },
    { label: "PROCESSED", value: "10M+" },
    { label: "SPEED", value: "<3s" },
    { label: "UPTIME", value: "100%" }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Detect. Verify.{' '}
          <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
            Protect.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          AI-Powered Deepfake Detection for a Trustworthy Digital World. Secure your media with enterprise-grade analysis in seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button 
            onClick={() => onNavigate('analyze')}
            className="bg-[#00D9FF] hover:bg-[#00C4E6] text-black px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2 group"
          >
            Start Analysis
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-white px-8 py-4 rounded-lg font-semibold transition-all flex items-center gap-2 group"
          >
            How it works
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-[#111827]/50 to-[#1F2937]/50 backdrop-blur-md border border-white/10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#00D9FF] mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Advanced Technology for{' '}
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#9333EA] bg-clip-text text-transparent">
              Digital Trust
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our state-of-the-art detection engine combines multiple deep learning models to provide the most accurate deepfake detection available.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 backdrop-blur-md border border-white/10 hover:border-[#00D9FF]/50 transition-all hover:shadow-lg hover:shadow-[#00D9FF]/20 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00D9FF]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[#00D9FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}