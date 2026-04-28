"use client";
import React from "react";
import Link from "next/link";
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
    LayoutDashboard, Settings, Activity, Battery, Bell,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const phaseData = [
    { time: "00:00", p1: 230, p2: 232, p3: 229 },
    { time: "04:00", p1: 231, p2: 233, p3: 230 },
    { time: "08:00", p1: 228, p2: 230, p3: 227 },
    { time: "12:00", p1: 225, p2: 228, p3: 226 },
    { time: "16:00", p1: 227, p2: 231, p3: 229 },
    { time: "20:00", p1: 230, p2: 232, p3: 230 },
];

export default function AnalyticsPage() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Same as Dashboard */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6"><Link href="/" className="text-2xl font-bold text-gray-900">EMS</Link></div>
                <nav className="flex-1 px-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><LayoutDashboard size={20} />Dashboard</Link>
                    <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 text-orange-600 bg-orange-50 rounded-xl font-medium"><Activity size={20} />Analytics</Link>
                    <Link href="/devices" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><Battery size={20} />Devices</Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"><Settings size={20} />Settings</Link>
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Advanced Analytics</h1>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Phase Comparison Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900">Phase Voltage Balance (V)</h3>
                            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                                <span className="text-orange-500">● Phase 1</span>
                                <span className="text-blue-500">● Phase 2</span>
                                <span className="text-purple-500">● Phase 3</span>
                            </div>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={phaseData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis domain={[220, 240]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="p1" stroke="#f97316" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="p2" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="p3" stroke="#a855f7" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Efficiency Metrics */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Power Factor Analysis</h3>
                            <div className="flex items-end gap-4 mb-6">
                                <span className="text-4xl font-bold text-gray-900">0.98</span>
                                <span className="text-green-500 font-bold flex items-center mb-1 text-sm">
                                    <ArrowUpRight size={16} /> +2% vs Last Week
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Your system is operating at near-peak efficiency. Current reactive power loss is minimal.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Peak Demand Prediction</h3>
                            <div className="flex items-end gap-4 mb-6">
                                <span className="text-4xl font-bold text-gray-900">14:30</span>
                                <span className="text-orange-500 font-bold flex items-center mb-1 text-sm">
                                    Estimated Peak
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Based on historical R&D data, expect highest load in 4 hours. Recommend staggered appliance usage.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}