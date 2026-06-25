import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EMS - Smart Energy Management System",
  description: "The official homepage for the EMS, an advanced energy management system that visualizes consumption patterns and optimizes your home or building performance with precision and intelligence.",
  openGraph: {
    title: "EMS - Smart Energy Management System",
    description: "Monitor, analyze, and optimize your energy consumption.",
    images: [
      {
        url: "/hero_image.png",
        width: 1200,
        height: 630,
        alt: "EMS energy monitoring dashboard and solar building",
      },
    ],
  },
  twitter: {
    title: "EMS - Smart Energy Management System",
    description: "Monitor, analyze, and optimize your energy consumption.",
    images: ["/hero_image.png"],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 bg-orange-500 border-b border-orange-600">
        <div className="flex items-center gap-12">
          <div className="text-xl font-bold tracking-tight text-white">EMS</div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/login" className="bg-white hover:bg-gray-100 text-black px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-wider uppercase mb-4 md:mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              Smart Energy Revolution
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Monitor Your Power usage,<br />Sustain Your Future
            </h1>
            <p className="text-base md:text-lg text-gray-500 mb-8 md:mb-10 max-w-lg leading-relaxed">
              Advanced energy management system that visualizes consumption patterns and optimizes your home or building performance with precision and intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3 rounded-full font-medium flex justify-center items-center gap-2 transition-all hover:gap-3">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a 
                href="https://vimuthwickramasinghe.github.io/Energy-Monitoring-System/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-7 py-3 rounded-full font-medium transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                Documentation
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-md mx-auto lg:max-w-none">
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
      <footer className="border-t border-gray-200 bg-gray-50 px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <div className="font-bold text-gray-900 mb-1">EMS</div>
          <div className="text-xs text-gray-400">© 2026 EMS Inc. Precision In Power.</div>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 text-xs text-gray-500 font-medium">
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
