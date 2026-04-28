import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-12">
          <div className="text-xl font-bold tracking-tight">EMS</div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="text-gray-900 pb-1 border-b-2 border-orange-500">Overview</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Monitoring</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Analytics</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Energy</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact Support</a>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-wider uppercase mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Smart Energy Revolution
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Control Your Power,<br />Sustain Your Future
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
              Advanced energy management system that visualizes consumption patterns and optimizes your home's performance with precision and intelligence.
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3 rounded-full font-medium inline-flex items-center gap-2 transition-all hover:gap-3">
                Explore Systems
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-7 py-3 rounded-full font-medium transition-colors">
                View Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
              <Image 
                src="/hero_image.png" 
                alt="House with solar panels" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {/* Stat Card 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M11 6h2v8h-2z"/><path d="M11 15h2v2h-2z"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">98.4% Efficiency</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Industry-leading conversion rates for peak residential performance.</p>
          </div>
          {/* Stat Card 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">35% Cost Saving</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Average monthly reduction in utility costs across EMS users.</p>
          </div>
          {/* Stat Card 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Data</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Millisecond latency in energy monitoring and reporting metrics.</p>
          </div>
        </section>

        {/* Precision Monitoring Section */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Precision Monitoring</h2>
              <p className="text-gray-500 max-w-xl text-sm leading-relaxed">
                Granular control over every watt. Our dashboard provides a level of insight never before seen in consumer energy platforms.
              </p>
            </div>
            <a href="#" className="text-orange-500 font-medium text-sm inline-flex items-center gap-1 hover:gap-2 transition-all">
              View Full Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Live Analytics Card */}
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="text-xs text-gray-400 font-bold tracking-wider mb-2">REAL-TIME GRID LOAD</div>
                  <h3 className="text-2xl font-bold">Live Power Analytics</h3>
                </div>
                <div className="bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Live Update
                </div>
              </div>
              
              {/* Simulated Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-2 px-2 mt-auto">
                {[40, 60, 50, 70, 85, 100, 80, 60, 45, 30].map((height, i) => (
                  <div 
                    key={i} 
                    className={`w-full rounded-t-lg transition-all duration-1000 ${i === 5 ? 'bg-orange-500' : i > 2 && i < 8 ? 'bg-orange-400' : 'bg-orange-200/60'}`}
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Autonomous Balancing Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between">
              {/* Decorative background shape */}
              <div className="absolute -bottom-10 -right-10 opacity-20 transform rotate-12">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0L125 75H200L140 120L160 200L100 150L40 200L60 120L0 75H75L100 0Z" />
                </svg>
              </div>
              
              <div className="relative z-10">
                <div className="w-10 h-10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Autonomous Balancing</h3>
                <p className="text-orange-100 text-sm leading-relaxed mb-10 max-w-xs">
                  AI-driven power distribution ensures your high-priority devices are always active during peak periods.
                </p>
              </div>
              
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full text-sm font-medium self-start transition-colors relative z-10">
                Enable AI
              </button>
            </div>
          </div>
        </section>

        {/* Service Tiers Section */}
        <section className="mb-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Service Tiers</h2>
          <p className="text-gray-500 text-sm mb-12">Precision hardware matched with intelligent software.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto text-left">
            {/* Tier 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-400 font-bold tracking-wider mb-4">RESIDENTIAL</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">$499</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">Full hardware kit + mobile app access.</p>
              
              <ul className="space-y-4 mb-10 text-sm text-gray-600">
                {["EMS Hub Pro", "Mobile Monitoring", "Standard Support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="text-orange-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-2.3-8.7l-2.7-2.7 1.4-1.4 1.3 1.3 4.3-4.3 1.4 1.4-5.7 5.7z"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 py-3 rounded-full font-medium text-sm transition-colors">
                Get Started
              </button>
            </div>

            {/* Tier 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-orange-500 relative transform md:scale-105 z-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="text-xs text-orange-500 font-bold tracking-wider mb-4 mt-2">ENTERPRISE</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">$1,299</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">Multi-grid setup for larger facilities.</p>
              
              <ul className="space-y-4 mb-10 text-sm text-gray-600">
                {["3x EMS Hubs", "AI Load Balancing", "Priority 24/7 Support", "API Access"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="text-orange-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 6.477 2 12s4.477 10 10 10zm-2.3-8.7l-2.7-2.7 1.4-1.4 1.3 1.3 4.3-4.3 1.4 1.4-5.7 5.7z"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-medium text-sm transition-colors shadow-md shadow-orange-500/20">
                Get Started
              </button>
            </div>

            {/* Tier 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-400 font-bold tracking-wider mb-4">INDUSTRIAL</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">Bespoke solutions for energy providers.</p>
              
              <ul className="space-y-4 mb-10 text-sm text-gray-600">
                {["Custom Grid Integration", "On-site Maintenance", "Dedicated Manager"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="text-orange-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 6.477 2 12s4.477 10 10 10zm-2.3-8.7l-2.7-2.7 1.4-1.4 1.3 1.3 4.3-4.3 1.4 1.4-5.7 5.7z"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 py-3 rounded-full font-medium text-sm transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-bold text-gray-900 mb-1">EMS</div>
          <div className="text-xs text-gray-400">© 2026 EMS Inc. Precision In Power.</div>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 font-medium">
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Security</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
          <a href="#" className="hover:text-gray-900 transition-colors">API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
