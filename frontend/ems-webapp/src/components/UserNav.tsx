"use client";
import {
    LayoutDashboard, Settings, Activity, Battery, Bell,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight
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
