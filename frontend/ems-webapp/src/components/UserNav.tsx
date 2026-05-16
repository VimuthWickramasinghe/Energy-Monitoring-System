"use client";
import React, { useContext } from "react";
import {
    LayoutDashboard, Settings, Activity, Battery, Building2,
    LogOut, User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/lib/AuthContext";

export default function UserNav() {
    const pathname = usePathname();
    const { user, logout } = useContext(AuthContext) as { user: any, logout: () => void };

    const navItems = [
        { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "analytics", icon: Activity },
        { label: "Building", href: "building", icon: Building2 },
        { label: "Devices", href: "devices", icon: Battery },
        { label: "Settings", href: "settings", icon: Settings },
    ];

    // Get user initials for avatar
    const initials = user?.name?.charAt(0) || user?.email?.charAt(0) || "U";
    const displayName = user?.name || user?.email?.split('@')[0] || "User";

    return (
        <aside className="sticky top-0 w-64 bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
            <div className="p-6">
                <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
                    EMS
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
            <div className="p-4 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

function UserNavLink({ page, children, icon, isActive, userEmail }: { page: string, children: React.ReactNode, icon: React.ReactNode, isActive: boolean, userEmail: string }) {
    return (
        <Link 
            href={`/${userEmail}/${page}`} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                ? "text-orange-600 bg-orange-50" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}
