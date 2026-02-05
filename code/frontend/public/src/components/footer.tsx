import { Shield, Github, Twitter, Linkedin } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#111827]/50 backdrop-blur-md">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-[#00D9FF]" />
              <span className="text-xl font-bold">
                <span className="text-white">Pixel</span>
                <span className="text-[#00D9FF]">Proof</span>
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-md">
              Empowering truth in the digital age. This AI-driven platform helps individuals and organizations verify media authenticity and combat misinformation.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group">
                <Github className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group">
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group">
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><button onClick={() => onNavigate('home')} className="text-gray-400 hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => onNavigate('analyze')} className="text-gray-400 hover:text-white transition-colors">Try Now</button></li>
              <li><button onClick={() => onNavigate('api-docs')} className="text-gray-400 hover:text-white transition-colors">API</button></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Enterprise</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-white transition-colors">About Us</button></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 PixelProof AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
