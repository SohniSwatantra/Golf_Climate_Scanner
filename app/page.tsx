'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Droplets, Thermometer, CloudRain, TrendingDown, AlertTriangle, Check, ArrowRight, Search, Loader2, Database, Zap } from 'lucide-react';

// Demo data for quick demo button
const DEMO_LOCATION = {
  name: "Golfbaan de Kroonprins",
  address: "Lekdijk West 22, Vianen, Utrecht",
  lat: 51.9661556,
  lng: 5.0822458,
};

function RiskCard({ title, icon: Icon, score, level, trend, color }: any) {
  const levelClass = level === 'high' ? 'risk-high' : level === 'medium' ? 'risk-medium' : 'risk-low';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-sans font-medium text-[15px]">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${levelClass}`}>
          {level}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-4xl font-serif">{score.toFixed(1)}</div>
        <div className="text-sm text-[#666666]">{trend}</div>
      </div>
      <div className="mt-3 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-[#f5a623]' : 'bg-[#00d47b]'}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

function SearchResult({ result, onSelect }: { result: any; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full px-4 py-3 text-left hover:bg-[#111111] flex items-center gap-3 transition-colors border-b border-[#1a1a1a] last:border-0"
    >
      <MapPin className="w-4 h-4 text-[#666666] flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate text-white">{result.name}</div>
        <div className="text-xs text-[#666666]">{result.type}</div>
      </div>
    </button>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const analyzeLocation = async (name: string, address: string, lat: number, lng: number) => {
    setIsAnalyzing(true);
    setError(null);
    setSearchResults([]);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, lat, lng }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setAnalysisData(data);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze location');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearchSelect = (result: any) => {
    if (result.centroid) {
      analyzeLocation(
        result.name,
        result.name,
        result.centroid.lat,
        result.centroid.lng
      );
    }
  };

  const handleDemoClick = () => {
    setSearchQuery(DEMO_LOCATION.name);
    analyzeLocation(
      DEMO_LOCATION.name,
      DEMO_LOCATION.address,
      DEMO_LOCATION.lat,
      DEMO_LOCATION.lng
    );
  };

  const resetSearch = () => {
    setShowResults(false);
    setAnalysisData(null);
    setSearchQuery('');
    setError(null);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-[#1a1a1a] sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-serif text-xl tracking-tight hover:opacity-80 transition-opacity">GolfClimate</a>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[#a1a1a1] hover:text-white transition-colors">Features</a>
            <a href="#data-sources" className="text-sm text-[#a1a1a1] hover:text-white transition-colors">Data Sources</a>
            <a href="/docs" className="text-sm text-[#a1a1a1] hover:text-white transition-colors">Docs</a>
            <button className="btn-primary text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      {!showResults && (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-serif text-[4.5rem] md:text-[5.5rem] leading-[1.05] tracking-tight mb-8">
                Climate risk<br />
                <span className="text-[#a1a1a1]">for </span><span className="text-[#336600]">golf courses</span>
              </h1>

              <p className="text-xl text-[#a1a1a1] mb-12 max-w-xl mx-auto leading-relaxed">
                Analyze flood, drought, heat stress, and subsidence risks for any golf course in the Netherlands. <span className="text-[#ffa31a]">Data-driven insights</span> for sustainable course management.
              </p>

              {/* Search Box */}
              <div className="flex gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search golf course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-resend w-full pl-4 pr-10"
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] animate-spin" />
                  ) : (
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  )}

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden z-10 text-left">
                      {searchResults.map((result) => (
                        <SearchResult
                          key={result.id}
                          result={result}
                          onSelect={() => handleSearchSelect(result)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn-primary">
                  Analyze
                </button>
              </div>

              {/* Demo Link */}
              <div className="mt-6">
                <button
                  onClick={handleDemoClick}
                  disabled={isAnalyzing}
                  className="text-sm text-[#666666] hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="font-bold italic" style={{ color: '#b4b4cb' }}>Try demo: Golfbaan de Kroonprins</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Sources - Logo Cloud Style */}
      {!showResults && (
        <div id="data-sources" className="border-t border-[#1a1a1a] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="card-gradient p-12">
              <p className="text-center text-sm text-[#a1a1a1] mb-8">
                Powered by trusted Dutch climate data sources
              </p>
              <div className="flex flex-wrap justify-center items-center gap-12">
                {['PDOK', 'Klimaateffectatlas', 'AHN', 'KNMI'].map((source) => (
                  <span key={source} className="text-white font-mono text-sm tracking-wider hover:text-[#ffa31a] transition-colors cursor-default">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      {!showResults && (
        <div id="features" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl mb-4">Integrate this morning</h2>
            <p className="text-[#a1a1a1] max-w-lg mx-auto">
              A simple interface so you can start analyzing climate risks in minutes. Works with any Dutch golf course location.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Droplets, title: "Flood Risk", desc: "River delta & rainfall impact analysis", color: "bg-blue-500/10 text-blue-400" },
              { icon: Thermometer, title: "Heat Stress", desc: "Temperature projections and trends", color: "bg-red-500/10 text-red-400" },
              { icon: CloudRain, title: "Drought Risk", desc: "Water scarcity and irrigation needs", color: "bg-[#f5a623]/10 text-[#f5a623]" },
              { icon: TrendingDown, title: "Subsidence", desc: "Ground level changes over time", color: "bg-purple-500/10 text-purple-400" },
            ].map((feature, i) => (
              <div key={i} className="card group">
                <div className={`p-3 rounded-lg ${feature.color} w-fit mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-medium text-[15px] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#666666] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {showResults && analysisData && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Back Button */}
          <button
            onClick={resetSearch}
            className="mb-8 text-[#666666] hover:text-white flex items-center gap-2 transition-colors text-sm"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
            Search another location
          </button>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-[#666666] uppercase tracking-wider">Climate Analysis</span>
              {analysisData.cached && (
                <span className="text-xs bg-[#1a1a1a] text-[#666666] px-2 py-1 rounded">Cached</span>
              )}
            </div>
            <h1 className="font-serif text-5xl mb-3">
              {analysisData.course?.name || searchQuery}
            </h1>
            <p className="text-[#666666]">{analysisData.course?.address}</p>
          </div>

          {/* Overall Score */}
          <div className="card-gradient p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans font-medium text-lg mb-1">Overall Climate Risk</h2>
                <p className="text-[#666666] text-sm">Combined risk assessment</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-serif">
                  {analysisData.overall?.score?.toFixed(1) || '—'}
                </div>
                <div className={`text-sm font-medium uppercase ${
                  analysisData.overall?.level === 'high' ? 'text-red-400' :
                  analysisData.overall?.level === 'medium' ? 'text-[#f5a623]' : 'text-[#00d47b]'
                }`}>
                  {analysisData.overall?.level || 'unknown'} risk
                </div>
              </div>
            </div>
          </div>

          {/* Risk Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <RiskCard
              title="Flood Risk"
              icon={Droplets}
              score={analysisData.risks?.flood?.score || 0}
              level={analysisData.risks?.flood?.level || 'low'}
              trend={analysisData.risks?.flood?.trend || '—'}
              color="bg-blue-500/10 text-blue-400"
            />
            <RiskCard
              title="Heat Stress"
              icon={Thermometer}
              score={analysisData.risks?.heat?.score || 0}
              level={analysisData.risks?.heat?.level || 'low'}
              trend={analysisData.risks?.heat?.trend || '—'}
              color="bg-red-500/10 text-red-400"
            />
            <RiskCard
              title="Drought Risk"
              icon={CloudRain}
              score={analysisData.risks?.drought?.score || 0}
              level={analysisData.risks?.drought?.level || 'low'}
              trend={analysisData.risks?.drought?.trend || '—'}
              color="bg-[#f5a623]/10 text-[#f5a623]"
            />
            <RiskCard
              title="Subsidence"
              icon={TrendingDown}
              score={analysisData.risks?.subsidence?.score || 0}
              level={analysisData.risks?.subsidence?.level || 'low'}
              trend={analysisData.risks?.subsidence?.trend || '—'}
              color="bg-purple-500/10 text-purple-400"
            />
          </div>

          {/* Insights & Recommendations */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-sans font-medium text-lg mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#f5a623]" />
                Key Insights
              </h2>
              <ul className="space-y-4">
                {(analysisData.insights || []).map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[#a1a1a1]">
                    <span className="text-[#666666] mt-0.5">•</span>
                    <span className="text-sm leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="font-sans font-medium text-lg mb-6 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00d47b]" />
                Recommendations
              </h2>
              <ul className="space-y-4">
                {(analysisData.recommendations || []).map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[#a1a1a1]">
                    <span className="text-[#00d47b] mt-0.5">✓</span>
                    <span className="text-sm leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 card-gradient p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-sans font-medium text-lg mb-2">Want detailed analysis for your course?</h3>
                <p className="text-[#666666] text-sm">Get a comprehensive climate risk report with actionable recommendations.</p>
              </div>
              <button className="btn-primary whitespace-nowrap">
                Request Full Report
              </button>
            </div>
          </div>
        </div>
      )}

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
