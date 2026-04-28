import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
            <div className="text-center max-w-md">
                {/* Cute GIF/Illustration Container */}
                <h1 className="text-7xl font-black text-gray-900 mb-4 tracking-tighter">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Page Not Found
                </h2>
                <p className="text-gray-500 mb-10 leading-relaxed">
                    The page you're looking for seems to have powered down or moved to a different location.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-all hover:gap-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
