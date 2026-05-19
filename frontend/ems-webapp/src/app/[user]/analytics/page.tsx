"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend,
    PieChart, Pie, Cell
} from "recharts";
import {
    Download, Building2, Zap, Activity, TrendingUp,
    AlertTriangle, Calendar, ChevronDown, Bell, ArrowRight,
    WifiOff, Cpu
} from "lucide-react";
import Header from "@/components/Header";
import { useBuilding, Building } from "@/lib/DeviceBuildingContext";
import { useProfile } from "@/lib/ProfileContext";

const TREND_DATA = [
    { time: '00:00', load: 120, energy: 400, voltage: 230 },
    { time: '04:00', load: 80, energy: 350, voltage: 234 },
    { time: '08:00', load: 350, energy: 500, voltage: 228 },
    { time: '12:00', load: 620, energy: 700, voltage: 226 },
    { time: '16:00', load: 480, energy: 650, voltage: 229 },
    { time: '20:00', load: 210, energy: 480, voltage: 232 },
    { time: '24:00', load: 150, energy: 420, voltage: 233 },
];

const ALERTS = [
    { id: 1, icon: AlertTriangle, title: 'High Peak Demand', desc: '28.5 kW recorded at 12:45 PM', time: '12:45 PM', color: 'text-orange-500' },
    { id: 2, icon: Zap, title: 'Voltage Fluctuation', desc: 'Voltage went beyond stable range', time: '11:30 AM', color: 'text-yellow-500' },
    { id: 3, icon: WifiOff, title: 'Device Offline', desc: 'EV Charger #2 is offline', time: '10:15 AM', color: 'text-red-500' },
];

const TOP_CONSUMERS = [
    { name: 'HVAC Controller', icon: Cpu, pct: 32, color: '#f97316' },
    { name: 'Main Panel', icon: Building2, pct: 26, color: '#f97316' },
    { name: 'EV Charger', icon: Zap, pct: 14, color: '#f97316' },
    { name: 'Lighting System', icon: Activity, pct: 11, color: '#f97316' },
    { name: 'Other Devices', icon: Cpu, pct: 7, color: '#f97316' },
];

const CATEGORY_USAGE = [
    { name: 'HVAC', value: 38, color: '#f97316' },
    { name: 'Lighting', value: 24, color: '#3b82f6' },
    { name: 'EV Chargers', value: 18, color: '#a855f7' },
    { name: 'Office Equipment', value: 12, color: '#10b981' },
    { name: 'Other', value: 8, color: '#f59e0b' },
];

const TIME_PERIODS = ['24H', '1D', '7D', '1M', '1Y'];
const GLOBAL_PERIODS = ['1H', '24H', '7D', '30D', '1Y'];

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Top-level KPI card */
const KPICard = ({ title, value, sub, icon: Icon, iconColor, subColor }: any) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-2 hover:shadow-md transition-shadow">
        <div className={`flex items-center gap-2 ${iconColor}`}>
            <Icon size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 leading-tight">{value}</p>
        <p className={`text-xs font-medium ${subColor ?? 'text-gray-400'}`}>{sub}</p>
    </div>
);

/** Mini stat inside a building card */
const MiniStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="flex flex-col gap-0.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <span className="text-sm font-extrabold text-gray-900">{value}</span>
    </div>
);

/** Per-building card */
const BuildingCard = ({ building, devices }: { building: Building, devices: any[] }) => {
    const [period, setPeriod] = useState('24H');

    const barData = devices.map(d => ({ name: d.module_name, value: 0 }));

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 hover:border-orange-200 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                    <Building2 size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">{building.building_name}</h3>
                    <p className="text-xs text-gray-400">{building.address}</p>
                </div>
            </div>

            {devices.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Cpu size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-500">No modules registered</p>
                    <p className="text-[10px] text-gray-400">Add a module to see analytics</p>
                </div>
            ) : (
                <>
                    {/* Mini KPIs */}
                    <div className="grid grid-cols-4 gap-2 border-b border-gray-50 pb-4">
                        <MiniStat label="Total Load" value="-- kW" color="text-orange-500" />
                        <MiniStat label="Daily Energy" value="-- kWh" color="text-blue-500" />
                        <MiniStat label="Avg. Voltage" value="-- V" color="text-purple-500" />
                        <MiniStat label="Peak Demand" value="-- kW" color="text-orange-600" />
                    </div>

                    {/* Device bar chart */}
                    <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)', fontSize: 12 }}
                                    cursor={{ fill: '#fff7ed' }}
                                />
                                <Bar dataKey="value" fill="#f97316" radius={[5, 5, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Consumption Trend */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-700">Consumption Trend</span>
                            <div className="flex gap-1">
                                {TIME_PERIODS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${period === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            {[
                                { key: 'load', label: 'Total Load (kW)', color: '#ef4444' },
                                { key: 'energy', label: 'Daily Energy (kWh)', color: '#3b82f6' },
                                { key: 'voltage', label: 'Avg. Voltage (v)', color: '#8b5cf6' },
                            ].map(l => (
                                <div key={l.key} className="flex items-center gap-1">
                                    <span className="inline-block w-5 h-0.5 rounded" style={{ background: l.color }} />
                                    <span className="text-[9px] text-gray-400">{l.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={TREND_DATA} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <YAxis yAxisId="lv" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <YAxis yAxisId="rv" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)', fontSize: 11 }}
                                    />
                                    <Line yAxisId="lv" type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={2} dot={false} name="Total Load (kW)" />
                                    <Line yAxisId="lv" type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} dot={false} name="Daily Energy (kWh)" />
                                    <Line yAxisId="rv" type="monotone" dataKey="voltage" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Avg. Voltage (V)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* Footer */}
            <button className="flex items-center gap-1.5 text-orange-500 text-xs font-bold hover:gap-2.5 transition-all">
                View Details <ArrowRight size={14} />
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const { buildings, modules, fetchBuildings, fetchModules } = useBuilding();
    const { profile } = useProfile();

    const [activeTab, setActiveTab] = useState<'overview' | string>('overview');
    const [globalPeriod, setGlobalPeriod] = useState('24H');
    const [showElectrical, setShowElectrical] = useState(false);

    // Fetch data on mount and when profile changes to ensure data is loaded after refresh
    useEffect(() => {
        if (profile?.user_id) {
            fetchBuildings();
            fetchModules();
        }
    }, [profile?.user_id]);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview' },
        ...buildings.map(b => ({ id: b.building_id, label: b.building_name })),
    ], [buildings]);

    const visibleBuildings = useMemo(() =>
        activeTab === 'overview'
            ? buildings
            : buildings.filter(b => b.building_id === activeTab)
        , [buildings, activeTab]);

    const subtitle = "Total consumption by infrastructure";

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/60">
            {/* ── Page Header ── */}
            <Header title="Analytics & Insights" subtitle={subtitle}>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Building selector */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm cursor-pointer">
                        <Building2 size={15} className="text-gray-400" />
                        <select
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                            onChange={e => setActiveTab(e.target.value)}
                            value={activeTab}
                        >
                            <option value="overview">All Buildings</option>
                            {buildings.map(b => (
                                <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>

                    {/* Electrical stability toggle */}
                    <button
                        onClick={() => setShowElectrical(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${showElectrical
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-blue-600 border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <Activity size={15} />
                        Electrical Stability
                    </button>

                    {/* Global time period */}
                    <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        {GLOBAL_PERIODS.map(p => (
                            <button
                                key={p}
                                onClick={() => setGlobalPeriod(p)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${globalPeriod === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Export */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm">
                        <Download size={15} /> Export
                    </button>
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-360 mx-auto space-y-6">

                    {/* ── Global KPI Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Total Load" value="21.4 kW"
                            sub={<span className="flex items-center gap-1 text-green-600"><TrendingUp size={11} /> 12% vs last hour</span>}
                            icon={Zap} iconColor="text-orange-500"
                        />
                        <KPICard
                            title="Daily Energy" value="850 kWh"
                            sub="Projected: 1.2MWh"
                            icon={Calendar} iconColor="text-blue-500"
                        />
                        <KPICard
                            title="Avg. Voltage" value="230.2 V"
                            sub="Stable Range"
                            icon={Activity} iconColor="text-purple-500"
                        />
                        <KPICard
                            title="Peak Demand" value="28.5 kW"
                            sub="Occurred at 12:45 PM"
                            icon={AlertTriangle} iconColor="text-orange-600"
                            subColor="text-gray-400"
                        />
                    </div>

                    {/* ── Tab Navigation ── */}
                    <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'border border-orange-400 text-orange-600 bg-orange-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Building Cards ── */}
                    <div className={`grid gap-5 ${visibleBuildings.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 lg:grid-cols-3'}`}>
                        {visibleBuildings.map(building => (
                            <BuildingCard
                                key={building.building_id}
                                building={building}
                                devices={modules.filter(m => m.building_id === building.building_id)}
                            />
                        ))}
                    </div>

                    {/* ── Bottom Row: Alerts + Top Consumers ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Alerts & Notifications */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <AlertTriangle size={18} className="text-orange-500" />
                                <h3 className="font-bold text-gray-900">Alerts & Notifications</h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                {ALERTS.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-3">
                                        <div className={`mt-0.5 ${alert.color}`}>
                                            <alert.icon size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-800">{alert.title}</p>
                                            <p className="text-xs text-gray-400">{alert.desc}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{alert.time}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-5 flex items-center gap-1.5 text-orange-500 text-xs font-bold hover:gap-2.5 transition-all">
                                View All Alerts <ArrowRight size={13} />
                            </button>
                        </div>

                        {/* Top Energy Consumers */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-orange-500" />
                                    <h3 className="font-bold text-gray-900">Top Energy Consumers</h3>
                                    <span className="text-xs text-gray-400 font-medium">(All Buildings)</span>
                                </div>
                                <button className="flex items-center gap-1 text-xs text-gray-500 font-semibold border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">
                                    Today <ChevronDown size={12} />
                                </button>
                            </div>
                            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                                <div className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={CATEGORY_USAGE}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={32}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                stroke="none"
                                            >
                                                {CATEGORY_USAGE.map(entry => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`${value ?? 0}%`, 'Your Label Here']}
                                                contentStyle={{ borderRadius: '12px', /* ... */ }}
                                            />

                                            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-3.5">
                                    {TOP_CONSUMERS.map(c => (
                                        <div key={c.name} className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg" style={{ background: `${c.color}1a`, color: c.color }}>
                                                <c.icon size={14} />
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium w-36 shrink-0">{c.name}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${c.pct}%`, background: c.color }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 w-8 text-right">{c.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button className="mt-5 flex items-center gap-1.5 text-orange-500 text-xs font-bold hover:gap-2.5 transition-all">
                                View All Devices <ArrowRight size={13} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
