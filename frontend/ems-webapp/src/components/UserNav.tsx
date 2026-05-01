import {
    LayoutDashboard, Settings, Activity, Battery, Bell,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import Link from "next/link";

 export default function Nav() {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6"><Link href="/" className="text-2xl font-bold text-gray-900">EMS</Link></div>
            <nav className="flex-1 px-4 space-y-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><LayoutDashboard size={20} />Dashboard</Link>
                <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 text-orange-600 bg-orange-50 rounded-xl font-medium"><Activity size={20} />Analytics</Link>
                <Link href="/devices" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><Battery size={20} />Devices</Link>
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><Settings size={20} />Settings</Link>
            </nav>
        </aside>
    );
}
