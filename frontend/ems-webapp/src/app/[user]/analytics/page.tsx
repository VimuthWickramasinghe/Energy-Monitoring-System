"use client";
import React, { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line
} from "recharts";
import {
    Download, Building2, Cpu, Zap, ArrowRight, Clock,
    Activity, TrendingUp, AlertTriangle, Calendar
} from "lucide-react";
import Header from "@/components/Header";

// --- Types ---
interface DeviceUsage {
    name: string;
    energy: number;
    power: number;
}

// --- Mock Data ---

const BUILDINGS = [
    { id: 'b1', name: 'Corporate HQ' },
    { id: 'b2', name: 'West Warehouse' },
    { id: 'b3', name: 'Downtown Hub' },
];

const USAGE_DATA = [
    { id: 'b1', name: 'Corporate HQ', energy: 450, power: 12.5, devices: [{ name: 'Main Panel', energy: 310, power: 8.2 }, { name: 'EV Charger', energy: 140, power: 4.3 }] },
    { id: 'b2', name: 'West Warehouse', energy: 280, power: 6.8, devices: [{ name: 'HVAC Controller', energy: 280, power: 6.8 }] },
    { id: 'b3', name: 'Downtown Hub', energy: 120, power: 2.1, devices: [] },
];

const TIME_SERIES_DATA = [
    { time: '00:00', energy: 120, power: 3.2, voltage: 231, current: 13.8 },
    { time: '04:00', energy: 80, power: 2.1, voltage: 234, current: 8.9 },
    { time: '08:00', energy: 350, power: 15.4, voltage: 228, current: 67.5 },
    { time: '12:00', energy: 520, power: 22.1, voltage: 226, current: 97.8 },
    { time: '16:00', energy: 480, power: 18.9, voltage: 229, current: 82.5 },
    { time: '20:00', energy: 210, power: 9.5, voltage: 232, current: 40.9 },
    { time: '23:59', energy: 150, power: 4.8, voltage: 233, current: 20.6 },
];

const TIME_PERIODS = [
    { label: '1H', value: '1h' },
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '1Y', value: '1y' },
];

// --- Components ---

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass, border }: any) => (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${border ? 'border-l-4 border-l-orange-500' : ''}`}>
        <div className={`flex items-center gap-3 ${colorClass} mb-2`}>
            <Icon size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className="mt-1">{subtitle}</div>
    </div>
);

export default function AnalyticsPage() {
    // --- State ---
    const [viewMode, setViewMode] = useState<'building' | 'device' | 'electrical'>('building');
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [metric, setMetric] = useState<'energy' | 'power'>('energy');
    const [timePeriod, setTimePeriod] = useState('24h');

    // --- Memos & Helpers ---
    const subtitle = useMemo(() => {
        const buildingName = USAGE_DATA.find(b => b.id === selectedBuildingId)?.name;
        if (viewMode === 'electrical') return `Electrical stability for ${buildingName || 'All Infrastructure'}`;
        if (viewMode === 'device') return `Device breakdown for ${buildingName}`;
        return "Total consumption by infrastructure";
    }, [viewMode, selectedBuildingId]);

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            <Header title="Power Analytics" subtitle={subtitle}>
                <div className="flex flex-wrap items-center gap-3">
                    {viewMode !== 'building' && (
                        <button 
                            onClick={() => setViewMode('building')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                        >
                            <Building2 size={16} /> Back to Buildings
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                        <Building2 size={16} className="text-gray-400" />
                        <select 
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                            value={selectedBuildingId || 'all'}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedBuildingId(val === 'all' ? null : val);
                            }}
                        >
                            <option value="all">All Buildings</option>
                            {BUILDINGS.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => setViewMode(viewMode === 'electrical' ? 'building' : 'electrical')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'electrical' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                        <Activity size={16} /> {viewMode === 'electrical' ? 'View Consumption' : 'Electrical Stability'}
                    </button>

                    <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        {TIME_PERIODS.map((period) => (
                            <button
                                key={period.value}
                                onClick={() => setTimePeriod(period.value)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${timePeriod === period.value ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all">
                        <Download size={16} /> Export
                    </button>
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Key Performance Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPICard 
                            title="Total Load" 
                            value="21.4 kW" 
                            colorClass="text-orange-500"
                            subtitle={<p className="text-xs text-green-600 font-medium flex items-center gap-1"><TrendingUp size={12} /> 12% vs last hour</p>}
                            icon={Zap}
                        />
                        <KPICard 
                            title="Daily Energy" 
                            value="850 kWh" 
                            colorClass="text-blue-500"
                            subtitle={<p className="text-xs text-gray-500">Projected: 1.2MWh</p>}
                            icon={Calendar}
                        />
                        <KPICard 
                            title="Avg. Voltage" 
                            value="230.2 V" 
                            colorClass="text-purple-500"
                            subtitle={<p className="text-xs text-gray-500">Stable Range</p>}
                            icon={Activity}
                        />
                        <KPICard 
                            title="Peak Demand" 
                            value="28.5 kW" 
                            colorClass="text-orange-600"
                            subtitle={<p className="text-xs text-gray-400">Occurred at 12:45 PM</p>}
                            icon={AlertTriangle}
                            border
                        />
                    </div>

                    {/* Main Charts Section */}
                    {viewMode === 'building' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {USAGE_DATA
                                .filter(b => !selectedBuildingId || b.id === selectedBuildingId)
                                .map((building) => (
                                <div key={building.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{building.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Total: {metric === 'energy' ? `${building.energy} kWh` : `${building.power} kW`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button onClick={() => setMetric('power')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${metric === 'power' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>POWER</button>
                                                <button onClick={() => setMetric('energy')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${metric === 'energy' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>ENERGY</button>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedBuildingId(building.id); setViewMode('device'); }}
                                                className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1"
                                            >
                                                View Modules <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-45 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {metric === 'power' ? (
                                                <AreaChart data={TIME_SERIES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Area type="monotone" dataKey="power" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPower)" />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={building.devices.map(d => ({ name: d.name, value: metric === 'energy' ? d.energy : d.power }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="text-blue-500" />
                                    System Harmonics & Stability
                                </h3>
                            </div>
                            <div className="h-100 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {viewMode === 'electrical' ? (
                                        <LineChart data={TIME_SERIES_DATA}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#3b82f6" strokeWidth={3} dot={false} name="Voltage (V)" />
                                            <Line yAxisId="right" type="monotone" dataKey="current" stroke="#ef4444" strokeWidth={3} dot={false} name="Current (A)" />
                                        </LineChart>
                                    ) : (
                                        <AreaChart data={TIME_SERIES_DATA}>
                                            <defs>
                                                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey={metric} stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorMetric)" />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
