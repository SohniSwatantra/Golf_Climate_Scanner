import { ArrowRight, Book, Code, Database, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-[#1a1a1a] sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight hover:opacity-80 transition-opacity">GolfClimate</Link>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="text-sm text-[#a1a1a1] hover:text-white transition-colors">Features</Link>
            <Link href="/#data-sources" className="text-sm text-[#a1a1a1] hover:text-white transition-colors">Data Sources</Link>
            <Link href="/docs" className="text-sm text-white transition-colors">Docs</Link>
            <button className="btn-primary text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-full border border-[#333333] mb-8">
            <Zap className="w-4 h-4 text-[#f5a623]" />
            <span className="text-sm text-[#a1a1a1]">Coming Soon</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] tracking-tight mb-6">
            Documentation
          </h1>

          <p className="text-xl text-[#a1a1a1] mb-12 leading-relaxed">
            We're working hard to bring you comprehensive documentation.
            Check back soon for guides, API references, and tutorials.
          </p>
        </div>
      </div>

      {/* Coming Soon Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="card group">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-4">
              <Book className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-medium text-[15px] mb-2">Getting Started</h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-4">
              Quick start guide to analyze your first golf course in minutes.
            </p>
            <span className="text-xs text-[#f5a623] font-medium">Coming soon</span>
          </div>

          <div className="card group">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-4">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-medium text-[15px] mb-2">API Reference</h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-4">
              Complete API documentation for programmatic access to climate data.
            </p>
            <span className="text-xs text-[#f5a623] font-medium">Coming soon</span>
          </div>

          <div className="card group">
            <div className="p-3 rounded-lg bg-[#00d47b]/10 text-[#00d47b] w-fit mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-medium text-[15px] mb-2">Data Sources</h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-4">
              Learn about PDOK, Klimaateffectatlas, AHN, and KNMI data integration.
            </p>
            <span className="text-xs text-[#f5a623] font-medium">Coming soon</span>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#666666] hover:text-white transition-colors"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-[#666666] flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <span className="font-serif text-white">GolfClimate</span>
              <span>© 2026 GeoSquare</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span>SQLite</span>
              <span className="text-[#333333]">•</span>
              <span>PDOK</span>
              <span className="text-[#333333]">•</span>
              <span>Klimaateffectatlas</span>
              <span className="text-[#333333]">•</span>
              <span>AHN</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
