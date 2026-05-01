"use client";
import React from "react";
import Link from "next/link";
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
    LayoutDashboard, Settings, Activity, Battery, Bell,
    Download, Calendar, Zap, ArrowUpRight, ArrowDownRight, LogOut
} from "lucide-react";
import Header from "@/components/Header";

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
        <main className="flex-1 overflow-y-auto bg-gray-50">
            <Header 
                title="Advanced Analytics" 
                subtitle="Deep dive into energy performance"
            >
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all">
                    <Download size={16} /> Export CSV
                </button>
            </Header>
            
            <div className="flex-1">
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="font-bold text-gray-900">Phase Voltage Balance</h3>
                                <p className="text-xs text-gray-500 mt-1">Real-time monitoring across L1, L2, and L3</p>
                            </div>
                            <div className="flex gap-6">
                                {[
                                    { label: "Phase 1", color: "bg-orange-500" },
                                    { label: "Phase 2", color: "bg-blue-500" },
                                    { label: "Phase 3", color: "bg-purple-500" }
                                ].map((phase) => (
                                    <div key={phase.label} className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${phase.color}`} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{phase.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={phaseData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis domain={[220, 240]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="p1" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="p2" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="p3" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
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
            </div>
        </main>
    );
}
