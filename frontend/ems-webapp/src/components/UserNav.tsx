"use client";
import React, { useContext } from "react";
import {
    LayoutDashboard, Settings, Activity, Battery, Bell, Building2,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight, LogOut
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

            <div className="p-4 border-t border-gray-100">
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
