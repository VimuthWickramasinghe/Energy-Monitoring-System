"use client";
import React, { useState, useEffect } from "react";
import {
    User, Shield, History, Trash2, Camera, Lock, ChevronDown, AlertCircle, Save, Globe, Mail
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import { useNotification } from "@/lib/NotificationContext";
import { client as supabase } from "@/utils/supabase/client";

export default function SettingsPage() {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const { user, logout, isGoogleUser, deleteAccount } = useAuth();
    const { profile, updateProfile, uploadAvatar } = useProfile();
    const { addNotification } = useNotification();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
    });

    useEffect(() => {
        if (profile) {
            const initialData = {
                name: profile.user_name || "",
                phone: profile.phone || "",
            };
            setFormData(initialData);
            if (profile.avatar_url) {
                setProfileImage(profile.avatar_url);
            }
        }
    }, [profile]);

    useEffect(() => {
        if (profile) {
            const isChanged =
                formData.name !== (profile.user_name || "") ||
                formData.phone !== (profile.phone || "");
            setHasChanges(isChanged);
        }
    }, [formData, profile]);

    const handleSaveChanges = async () => {
        if (!profile?.user_id) return;
        setIsSaving(true);
        try {
            await updateProfile({
                user_name: formData.name,
                phone: formData.phone
            });

            addNotification("Profile updated successfully!", "success");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            addNotification(error.message || "Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setProfileImage(URL.createObjectURL(file));
        }
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile || !profile?.user_id) return;
        setIsUploading(true);
        try {
            await uploadAvatar(selectedFile);
            setSelectedFile(null);
            addNotification("Profile picture updated!", "success");
        } catch (error: any) {
            addNotification(error.message || "Failed to upload image", "error");
        } finally {
            setIsUploading(false);
        }
    };

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
                        <button
                            onClick={handleSaveChanges}
                            disabled={isSaving || !hasChanges}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm text-sm ${isSaving || !hasChanges ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'}`}
                        >
                            {isSaving ? <Save size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row gap-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden border-4 border-white shadow-md">
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <Save size={20} className="animate-spin text-orange-500" />
                                            <span className="text-[10px] uppercase font-black">Uploading</span>
                                        </div>
                                    ) : profileImage ? (
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        formData.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>
                                {!isUploading && (
                                    <label className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all shadow-lg cursor-pointer">
                                        <Camera size={18} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                )}
                            </div>
                            {selectedFile && (
                                <button
                                    onClick={handleUploadAvatar}
                                    disabled={isUploading}
                                    className="mt-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-200 transition-all flex items-center gap-2"
                                >
                                    {isUploading ? <Save size={14} className="animate-spin" /> : <Camera size={14} />}
                                    Save Photo
                                </button>
                            )}
                            <p className="text-xs text-gray-400">JPG or PNG. Max 2MB.</p>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                    {formData.name !== (profile?.user_name || "") && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Changed" />}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 transition-colors ${formData.name !== (profile?.user_name || "") ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                <input type="text" value={profile?.user_id || "Loading..."} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Firebase UID</label>
                                <input type="text" value={profile?.firebase_uid || "Loading..."} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                    {formData.phone !== (profile?.phone || "") && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Changed" />}
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 transition-colors ${formData.phone !== (profile?.phone || "") ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input type="text" value="User" disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
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
                                <button onClick={deleteAccount} className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Yes, Delete My Account</button>
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}
