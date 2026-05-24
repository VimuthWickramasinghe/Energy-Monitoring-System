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
import { useBuilding, Building, Module } from "@/lib/DeviceBuildingContext";
import { useDeviceData } from "@/lib/DeviceDataContext";
import { useProfile } from "@/lib/ProfileContext";
import { BuildingCard } from "@/components/analytics/BuildingCard";
import { KPICard } from "@/components/analytics/KPICard";



// ─── Sub-Components ───────────────────────────────────────────────────────────
const GLOBAL_PERIODS = ['24H', '1D', '7D', '1M', '1Y'];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const { buildings, modules, fetchBuildings, fetchModules, loading: buildingLoading } = useBuilding();
    const { profile } = useProfile();
    const { devices: allDeviceData, mongoDemoData, refreshDevices } = useDeviceData();

    const [activeTab, setActiveTab] = useState<'overview' | string>('overview');
    const [globalPeriod, setGlobalPeriod] = useState('24H');
    const [showElectrical, setShowElectrical] = useState(false);

    /**
     * Step 1: Fetch Building and Module metadata from Supabase
     */
    useEffect(() => {
        if (profile?.user_id) {
            fetchBuildings();
            fetchModules();
        }
    }, [profile?.user_id]);

    /**
     * Step 2: Once modules are loaded, trigger the DeviceDataContext 
     * to fetch the actual time-series data from MongoDB for those specific module IDs.
     */
    useEffect(() => {
        if (!buildingLoading) {
            refreshDevices();
        }
    }, [buildingLoading, refreshDevices]);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview' },
        ...buildings.map(b => ({ id: b.building_id, label: b.building_name })),
    ], [buildings]);

    const visibleBuildings = useMemo(() =>
        activeTab === 'overview'
            ? buildings
            : buildings.filter(b => b.building_id === activeTab)
        , [buildings, activeTab]);

    const { totalGlobalLoad, globalAvgVoltage } = useMemo(() => {
        let load = 0;
        let volt = 0;
        let count = 0;

        allDeviceData.forEach(d => {
            load += (d.power || 0);
            if (d.voltage) {
                volt += d.voltage;
                count++;
            }
        });

        return {
            totalGlobalLoad: load.toFixed(2),
            globalAvgVoltage: count > 0 ? (volt / count).toFixed(1) : "0.0"
        };
    }, [allDeviceData]);

    const subtitle = `Monitoring ${modules.length} modules across ${buildings.length} buildings`;

    const topConsumersData = useMemo(() => {
        return allDeviceData
            .map(d => {
                const moduleInfo = modules.find(m => m.module_id === d.device_id);
                return {
                    ...d,
                    name: moduleInfo?.module_name || d.device_id,
                    value: d.power || 0
                };
            })
            .sort((a, b) => (b.power || 0) - (a.power || 0))
            .slice(0, 5);
    }, [allDeviceData, modules]);

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
                            title="Total Load" value={`${totalGlobalLoad} kW`}
                            sub={<span className="flex items-center gap-1 text-green-600"><TrendingUp size={11} /> 12% vs last hour</span>}
                            icon={Zap} iconColor="text-orange-500"
                        />
                        <KPICard
                            title="Daily Energy" value="850 kWh"
                            sub="Projected: 1.2MWh"
                            icon={Calendar} iconColor="text-blue-500"
                        />
                        <KPICard
                            title="Avg. Voltage" value={`${globalAvgVoltage} V`}
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
                                modules={modules.filter(m => m.building_id === building.building_id)}
                                allDeviceData={allDeviceData}
                            />
                        ))}
                    </div>

                    {/* ── MongoDB Raw Data Debug (Testing) ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu size={18} className="text-purple-500" />
                            <h3 className="font-bold text-gray-900">MongoDB Raw Data (Testing)</h3>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-60">
                            <pre className="text-[10px] text-green-400 font-mono">
                                {JSON.stringify(mongoDemoData, null, 2)}
                            </pre>
                        </div>
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
                                {allDeviceData.filter(d => d.voltage && (d.voltage < 210 || d.voltage > 250)).slice(0, 3).map((alert, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-0.5 text-yellow-500"><AlertTriangle size={16} /></div>
                                        <div className="flex-1"><p className="text-sm font-bold text-gray-800">Voltage Alert</p><p className="text-xs text-gray-400">{modules.find(m => m.module_id === alert.device_id)?.module_name || alert.device_id}: {alert.voltage}V</p></div>
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
                                                data={topConsumersData}
                                                dataKey="value"
                                                nameKey="device_id"
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={32}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                stroke="none"
                                            >
                                                {topConsumersData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'][index % 5]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`${value?.toFixed(2)} kW`, 'Power']}
                                                contentStyle={{ borderRadius: '12px', /* ... */ }}
                                            />

                                            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-3.5">
                                    {topConsumersData.map(d => (
                                        <div key={d.device_id} className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500">
                                                <Zap size={14} />
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium w-36 shrink-0 truncate">{d.name}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${Math.min((d.power || 0) * 10, 100)}%`, background: '#f97316' }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 w-8 text-right">{d.power?.toFixed(1)}</span>
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
