"use client";

import { Bell, Search, Zap, X, Check, LogOut, ChevronDown, User, Settings } from "lucide-react";
import { useContext, useState } from "react";
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

function UserProfile({ user, logout }: { user: any, logout: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const initials = user?.name?.charAt(0) || "U";
    const name = user?.name || "User";
    const role = user?.role || "Account";

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 hover:bg-gray-50 p-1 rounded-xl transition-colors group"
            >
                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-orange-200">
                    {initials}
                </div>
                <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{name}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{role}</p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                        </div>
                        <div className="h-px bg-gray-100 my-1"></div>
                        
                        <button 
                            onClick={() => { setIsOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </>
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
    const { user, logout } = useContext(AuthContext) as { user: any, logout: () => void };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-8">
                <div className="header-titles">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-[10px] font-bold text-green-600 rounded-full uppercase tracking-wider">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
                </div>

                {/* <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 w-64 group focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <Search size={16} className="text-gray-400 group-focus-within:text-orange-500" />
                    <input 
                        type="text" 
                        placeholder="Search sensors..." 
                        className="bg-transparent border-none text-sm ml-2 outline-none w-full text-gray-600 placeholder:text-gray-400"
                    />
                </div> */}
            </div>

            <div className="flex items-center gap-4">
                {children}
                <NotificationButton />
                <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden="true"></div>
                <UserProfile user={user} logout={logout} />
            </div>
        </header>
    );
}