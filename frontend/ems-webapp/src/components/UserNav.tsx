"use client";
import React, { useContext } from "react";
import {
    LayoutDashboard, Settings, Activity, Battery, Building2,
    LogOut, User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";

export default function UserNav() {
    const pathname = usePathname();
    const { user, logout } = useContext(AuthContext) as { user: any, logout: () => void };
    const { profile } = useProfile();

    const handleLogout = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const playTone = (freq: number, start: number, duration: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.00001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };

        const now = audioCtx.currentTime;
        // Play a two-tone "power down" sound
        playTone(800, now, 0.2);
        playTone(600, now + 0.1, 0.3);

        setTimeout(() => logout(), 300);
    };

    const navItems = [
        { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "analytics", icon: Activity },
        { label: "Building", href: "building", icon: Building2 },
        { label: "Devices", href: "devices", icon: Battery },
        { label: "Settings", href: "settings", icon: Settings },
    ];

    // Get user initials for avatar
    const initials = profile?.user_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";
    const displayName = profile?.user_name || user?.email?.split('@')[0] || "User";

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex sticky top-0 w-64 bg-blue-950 border-r border-gray-800 flex-col h-screen shrink-0">
                <div className="p-6">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-white">
                        EMS
                        <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">Energy Monitoring System</p>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <UserNavLink 
                            key={item.href} 
                            page={item.href} 
                            icon={<item.icon size={20} />}
                            isActive={pathname.includes(`/${item.href}`)}
                            userEmail={user?.email}
                        >
                            {item.label}
                        </UserNavLink>
                    ))}
                </nav>

                {/* Bottom section with user info and logout button */}
                <div className="p-4 border-t border-gray-800 mt-auto">
                    <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-xl bg-white/5 shadow-sm">
                        <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                            <p className="text-[10px] text-gray-400 truncate font-mono">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-white hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-200 font-medium group"
                    >
                        <span>Sign Out</span>
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-950 border-t border-gray-800 flex items-center justify-around z-50 px-2 py-2 pb-safe">
                {navItems.slice(0, 4).map((item) => {
                    const isActive = pathname.includes(`/${item.href}`);
                    return (
                        <Link 
                            key={item.href}
                            href={`/${user?.email}/${item.href}`}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg ${isActive ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                        >
                            <item.icon size={20} className={isActive ? "text-orange-500" : ""} />
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
                <Link
                    href={`/${user?.email}/settings`}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg ${pathname.includes('/settings') ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                >
                    <Settings size={20} className={pathname.includes('/settings') ? "text-orange-500" : ""} />
                    <span className="text-[10px] mt-1 font-medium">Settings</span>
                </Link>
            </nav>
        </>
    );
}

function UserNavLink({ page, children, icon, isActive, userEmail }: { page: string, children: React.ReactNode, icon: React.ReactNode, isActive: boolean, userEmail: string }) {
    return (
        <Link 
            href={`/${userEmail}/${page}`} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                ? "text-white font-bold bg-white/10" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
        >
            <span className={isActive ? "text-orange-500" : ""}>{icon}</span>
            <span>{children}</span>
        </Link>
    );
}