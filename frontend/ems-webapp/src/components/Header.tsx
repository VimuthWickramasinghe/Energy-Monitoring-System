"use client";

import { Bell, Search, Zap } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/lib/AuthContext";

function NotificationButton() {
    return (
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
        </button>
    );
}

function UserProfile({ user }: { user: any }) {
    const initials = user?.name?.charAt(0) || "U";
    const name = user?.name || "User";
    const role = user?.role || "Account";

    return (
        <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-orange-200">
                {initials}
            </div>
            <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{role}</p>
            </div>
        </div>
    );
}

export default function Header({
    title = "System Overview",
    subtitle = "Real-time energy diagnostics",
    children
}: {
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    const { user } = useContext(AuthContext) as { user: any };

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

                <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 w-64 group focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <Search size={16} className="text-gray-400 group-focus-within:text-orange-500" />
                    <input 
                        type="text" 
                        placeholder="Search sensors..." 
                        className="bg-transparent border-none text-sm ml-2 outline-none w-full text-gray-600 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {children}
                <NotificationButton />
                <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden="true"></div>
                <UserProfile user={user} />
            </div>
        </header>
    );
}