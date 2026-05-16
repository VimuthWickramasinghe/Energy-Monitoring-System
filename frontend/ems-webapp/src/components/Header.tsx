"use client";

import { Bell, X, Check } from "lucide-react";
import React, { useContext, useState } from "react";
import { AuthContext } from "@/lib/AuthContext";

function NotificationButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNotification, setHasNotification] = useState(true);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:scale-95 active:bg-gray-100 rounded-lg transition-all relative"
            >
                <Bell size={20} />
                {hasNotification && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-4">
                        {hasNotification ? (
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 mt-1.5 bg-orange-500 rounded-full shrink-0"></div>
                                    <p className="text-sm text-gray-600">High energy usage detected in Zone A. Consider optimizing load.</p>
                                </div>
                                <button 
                                    onClick={() => setHasNotification(false)}
                                    className="w-full py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Mark all as read
                                </button>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-sm text-gray-400">No new notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Header({
    title,
    subtitle,
    children
}: {
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    const { user } = useContext(AuthContext) as { user: any };
    
    // Get user initials for avatar
    const initials = user?.name?.charAt(0) || user?.email?.charAt(0) || "U";

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-8">
                <div className="header-titles">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
                        <span className="flex items-center gap-1 px-2 py-0.5 border border-gray-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                            <span className="text-red-600">Live</span>
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {children}
                <NotificationButton />
                <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden="true"></div>
            </div>
        </header>
    );
}