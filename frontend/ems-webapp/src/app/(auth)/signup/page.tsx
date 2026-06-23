"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";

export default function SignUpPage() {
    const { signup, loginWithGoogle, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup(email, password);
        } catch (error) {
            console.error("Email sign-up failed:", error);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Google sign-up failed:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
                        EMS
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Create an EMS account
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Account registration for the Energy Management System at ems.keyblocks.org
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <form onSubmit={handleEmailSignup} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                            >
                                Create account
                            </button>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2..09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google using Firebase
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500">
                        Only create an account on <span className="font-medium text-gray-700">https://ems.keyblocks.org</span>.
                        EMS uses Firebase Authentication. Passwords are sent securely and are never stored on our servers.
                    </div>
                </div>
            </div>
        </div>
    );
}
