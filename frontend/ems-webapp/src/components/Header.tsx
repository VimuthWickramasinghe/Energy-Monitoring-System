"use client";

import { Bell } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/lib/AuthContext";

function NotificationButton() {
    return (
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
        </button>
    );
}

function UserProfile({ user }: { user: any }) {
    const initials = user?.name?.charAt(0) || "U";
    const name = user?.name || "User";
    const role = user?.role || "Account";

    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                {initials}
            </div>
            <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{role}</p>
            </div>
        </div>
    );
}

export default function Header({
    title = "Energy Overview",
    subtitle = "Welcome back, monitoring active",
    children
}: {
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    const { user } = useContext(AuthContext) as { user: any };

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="header-titles">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
                {children}
                <NotificationButton />

                <div className="h-8 w-px bg-gray-200 mx-2" aria-hidden="true"></div>

                <UserProfile user={user} />
            </div>
        </header>
    );
}