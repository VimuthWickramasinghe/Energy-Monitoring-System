"use client";
import React, { useState, useContext, useEffect } from "react";
import {
    User, Shield, History, Trash2, Camera, Lock, ChevronDown, AlertCircle, Save, Globe, Mail
} from "lucide-react";
import Header from "@/components/Header";
import { AuthContext } from "@/lib/AuthContext";

export default function SettingsPage() {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const { user, logout, isGoogleUser } = useContext(AuthContext) as { user: any, logout: () => void, isGoogleUser: boolean };

    const [profile, setProfile] = useState({
        id: "USR-9921-X",
        name: "",
        email: "",
        role: "User",
        phone: "+94 77 123 4567",
        provider: "Email/Password"
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
                role: user.role || "User",
            }));
        }
    }, [user]);

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50">
            <Header
                title="Account Settings"
                subtitle="Manage your profile and system preferences"
            />

            <div className="p-8 max-w-5xl mx-auto space-y-8">

                {/* Section 1: Profile Details */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <User size={18} className="text-orange-500" /> Public Profile
                        </h3>
                        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors shadow-sm shadow-orange-200 text-sm">
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row gap-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden border-4 border-white shadow-md">
                                    {profile.name?.charAt(0) || "U"}
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
                                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled={isGoogleUser}
                                    className={`w-full px-4 py-2 border rounded-xl outline-none text-gray-900 ${isGoogleUser ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                <input type="text" value={profile.id} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input type="text" value={profile.role} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Provider</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-600 text-sm font-medium">
                                    {isGoogleUser ? <Globe size={16} className="text-blue-500" /> : <Mail size={16} className="text-orange-500" />}
                                    {isGoogleUser ? "Google" : "Email/Password"}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Security & Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield size={18} className="text-orange-500" />Reset Password</h3>
                        {isGoogleUser ? (
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
                                <Lock size={18} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">Password managed by Google</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Repeat New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                                </div>
                                <button className="w-full py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold transition-all shadow-sm shadow-orange-100 text-sm">
                                    Update Password
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Section 3: Theme Preferences */}
                    {/* <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                        </section> */}
                </div>

                {/* Section 4: Danger Zone */}
                <section className="bg-red-50 rounded-2xl border border-red-100 p-6 overflow-hidden">
                    {!showDeleteConfirm ? (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="font-bold text-red-900 flex items-center gap-2">
                                    <Trash2 size={18} /> Delete Account
                                </h3>
                                <p className="text-sm text-red-600 mt-1">Once you delete your account, all energy history and device configs will be lost.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all"
                            >
                                Permanently Delete
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-4">
                                <AlertCircle className="text-red-600 shrink-0" size={24} />
                                <p className="text-sm font-bold text-red-900">Are you absolutely sure? This action cannot be undone.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
                                <button onClick={logout} className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Yes, Delete My Account</button>
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}
