"use client";
import {
    LayoutDashboard, Settings, Activity, Battery, Bell,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight, LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "analytics", icon: Activity },
        { label: "Devices", href: "devices", icon: Battery },
        { label: "Settings", href: "settings", icon: Settings },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
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
                    >
                        {item.label}
                    </UserNavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors">
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

function UserNavLink({ page, children, icon, isActive }: { page: string, children: React.ReactNode, icon: React.ReactNode, isActive: boolean }) {
    return (
        <Link 
            href={`/user/${page}`} 
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
