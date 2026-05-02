import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 bg-orange-500 border-b border-orange-600">
        <div className="flex items-center gap-12">
          <div className="text-xl font-bold tracking-tight text-white">EMS</div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-full text-sm font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-wider uppercase mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              Smart Energy Revolution
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Monitor Your Power usage,<br />Sustain Your Future
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
              Advanced energy management system that visualizes consumption patterns and optimizes your home or building performance with precision and intelligence.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3 rounded-full font-medium inline-flex items-center gap-2 transition-all hover:gap-3">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-7 py-3 rounded-full font-medium transition-colors">
                View Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
              <Image
                src="/hero_image.png"
                alt="Building with solar panels"
                fill
                className="object-cover"
                priority
              />
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
