"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard, Settings, User, LogOut, Activity,
    Battery, Bell, Moon, Sun, Shield, History, Trash2, Camera, Lock, ChevronDown
} from "lucide-react";
import Nav from "@/components/UserNav";

export default function SettingsPage() {
    const [theme, setTheme] = useState("dark");

    // Mock User Data
    const [profile, setProfile] = useState({
        name: "Vimuth Wickramasinghe",
        email: "vimuth@example.com",
        role: "System Admin",
        phone: "+94 77 123 4567"
    });

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar Navigation - Identical to Dashboard */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
                        EMS
                    </Link>
                </div>
                <Nav/>
                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-sm text-gray-500">Manage your profile and system preferences</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">VW</div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                                <p className="text-xs text-gray-500">{profile.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-5xl mx-auto space-y-8">

                    {/* Section 1: Profile Details */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <User size={18} className="text-orange-500" /> Public Profile
                            </h3>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row gap-12">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden border-4 border-white shadow-md">
                                        VW
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all shadow-lg">
                                        <Camera size={18} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">JPG or PNG. Max 2MB.</p>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" defaultValue={profile.name} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" defaultValue={profile.email} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="text" defaultValue={profile.phone} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <input type="text" value={profile.role} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Security & Logs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Shield size={18} className="text-orange-500" /> Security
                            </h3>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-gray-400" />
                                        <span className="text-sm font-medium">Change Password</span>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>
                                <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <History size={18} className="text-gray-400" />
                                        <span className="text-sm font-medium">Login History</span>
                                    </div>
                                    <span className="text-xs text-orange-500 font-bold">View Log</span>
                                </button>
                                <button className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
                                    Access Control Settings
                                </button>
                            </div>
                        </section>

                        {/* Section 3: Theme Preferences */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Sun size={18} className="text-orange-500" /> Appearance
                            </h3>
                            <div className="p-1 bg-gray-100 rounded-2xl flex gap-1">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${theme === 'light' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Sun size={18} /> Light
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Moon size={18} /> Dark
                                </button>
                            </div>
                            <p className="mt-4 text-xs text-gray-400 text-center">
                                System is currently set to <span className="font-bold text-orange-500 capitalize">{theme} mode</span>.
                            </p>
                        </section>
                    </div>

                    {/* Section 4: Danger Zone */}
                    <section className="bg-red-50 rounded-2xl border border-red-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="font-bold text-red-900 flex items-center gap-2">
                                <Trash2 size={18} /> Delete Account
                            </h3>
                            <p className="text-sm text-red-600 mt-1">Once you delete your account, all energy history and device configs will be lost.</p>
                        </div>
                        <button className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">
                            Permanently Delete
                        </button>
                    </section>

                </div>
            </main>
        </div>
    );
}