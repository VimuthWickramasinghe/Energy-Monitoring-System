"use client";

import { Bell, X, Check, Calendar, Clock } from "lucide-react";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/lib/AuthContext";

function NotificationButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNotification, setHasNotification] = useState(true);
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (hasNotification) {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBell = () => {
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now); // A5 note
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
                
                osc.connect(gain).connect(audioCtx.destination);
                osc.start();
                osc.stop(now + 0.5);
            };
            playBell();
        }
    }, [hasNotification]);

    const formattedDate = dateTime.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    const formattedTime = dateTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    return (
        <div className="flex items-center gap-4 order-last">
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold">{formattedDate}</span>
                </div>
                <div className="w-px h-3 bg-gray-300"></div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold tabular-nums">{formattedTime}</span>
                </div>
            </div>

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
                                    className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2"
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
        <header className="bg-blue-50/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-8">
                <div className="header-titles flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
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