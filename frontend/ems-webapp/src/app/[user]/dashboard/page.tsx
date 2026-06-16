"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend,
    PieChart, Pie, Cell, Label, TooltipProps
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
import { AuthContext } from "@/lib/AuthContext";
import { BuildingCard } from "@/components/analytics/BuildingCard";
import { KPICard } from "@/components/analytics/KPICard";
import { Card } from "@/components/dashboard/Card";
import NewNav from "@/components/dashboard/NewNav";

// Mock Data for the charts
const consumptionDataMap: Record<string, any[]> = {
  "24h": [
    { time: "00:00", usage: 45 },
    { time: "04:00", usage: 30 },
    { time: "08:00", usage: 85 },
    { time: "12:00", usage: 120 },
    { time: "16:00", usage: 95 },
    { time: "20:00", usage: 110 },
    { time: "23:59", usage: 60 },
  ],
  "7d": [
    { time: "Mon", usage: 450 },
    { time: "Tue", usage: 520 },
    { time: "Wed", usage: 480 },
    { time: "Thu", usage: 610 },
    { time: "Fri", usage: 590 },
    { time: "Sat", usage: 320 },
    { time: "Sun", usage: 280 },
  ],
  "30d": [
    { time: "Week 1", usage: 2800 },
    { time: "Week 2", usage: 3100 },
    { time: "Week 3", usage: 2950 },
    { time: "Week 4", usage: 3400 },
  ],
};

const deviceData = [
  { name: "HVAC System", value: 45 },
  { name: "Lighting", value: 15 },
  { name: "Server Room", value: 25 },
  { name: "EV Charging", value: 10 },
  { name: "Others", value: 5 },
];

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'];

const totalPowerKw = 2.4;
const getKwh = (percent: number) => (percent * totalPowerKw / 100).toFixed(2);

const UsageByCategory = () => {
  return (
    <div className="bg-purple-50/50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-5 pb-2 gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Real-Time Energy Usage</h3>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 w-fit">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 sm:p-5 pt-2">
        <div className="lg:col-span-3 flex justify-center">
          <div className="w-full max-w-sm h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  cornerRadius={8}
                  stroke="#ffffff"
                  strokeWidth={2}
                  labelLine={false}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-15" className="fill-orange-500 text-2xl sm:text-3xl font-bold">⚡</tspan>
                  <tspan x="50%" dy="30" className="fill-gray-900 text-xl sm:text-2xl font-bold">2.4 W</tspan>
                  <tspan x="50%" dy="25" className="fill-gray-400 text-[10px] font-bold tracking-[2px]">
                    CURRENT USAGE
                  </tspan>
                </text>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Usage']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-2">
          {deviceData.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all duration-200" style={{ borderLeft: `4px solid ${COLORS[index]}` }}>
              <div className="flex items-center gap-3 w-3/5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="font-semibold text-gray-800 text-sm truncate">{item.name}</span>
                <div className="hidden sm:block w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: COLORS[index] }} />
                </div>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="text-lg sm:text-xl font-bold" style={{ color: COLORS[index] }}>{item.value}%</span>
                <span className="text-gray-400 text-xs ml-1 hidden sm:inline-block">({getKwh(item.value)} Wh)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const { buildings, modules, fetchBuildings, fetchModules, loading: buildingLoading } = useBuilding();
    const { user } = React.useContext(AuthContext) as { user: any };
    const { profile } = useProfile();
    const { devices: allDeviceData, mongoDemoData, refreshDevices } = useDeviceData();

    const [activeTab, setActiveTab] = useState<'overview' | string>('overview');
    const [timeRange, setTimeRange] = useState("24h");

    /**
     * Step 1: Fetch Building and Module metadata from Supabase
     */
    useEffect(() => {
        if (profile?.user_id) {
            fetchBuildings();
            fetchModules();
        }
    }, [profile?.user_id, fetchBuildings, fetchModules]);

    /**
     * Step 2: Once modules are loaded, trigger the DeviceDataContext 
     * to fetch the actual time-series data from MongoDB for those specific module IDs.
     */
  useEffect(() => {
        if (!buildingLoading) {
            refreshDevices();
        }
    }, [buildingLoading, refreshDevices]);

  const currentData = consumptionDataMap[timeRange] || consumptionDataMap["24h"];

  return (
    <main className="flex-1 flex flex-row overflow-hidden pb-16 md:pb-0">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" subtitle={`Monitoring ${modules.length} modules across ${buildings.length} buildings`} />

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Left Side: Recent Activity */}
              <div className="w-full lg:w-[350px] shrink-0">
                <NewNav />
              </div>

              {/* Right Side: Charts */}
              <div className="flex-1 space-y-6 md:space-y-8">
                {/* Stats Grid */}
                <div className="flex flex-wrap lg:justify-end">
                  <Card />
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-full max-w-full overflow-x-auto">
                    <div className="flex min-w-max">
                        {[{ id: 'overview', label: 'Overview' }, ...buildings.map(b => ({ id: b.building_id, label: b.building_name }))].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border border-orange-400 text-orange-600 bg-orange-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Consumption Chart */}
                <div className="bg-orange-50/30 p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="font-bold text-gray-900">Energy Consumption Trends</h3>
                    <select
                      className="bg-gray-50 border border-gray-200 text-sm text-black rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                    >
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" key={timeRange}>
                      <AreaChart data={currentData}>
                        <defs>
                          <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="time" axisLine={{ stroke: '#e5e7eb' }} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }}>
                          <Label value="Time Period" offset={-5} position="insideBottom" style={{ fontSize: '10px', fill: '#6b7280', fontWeight: 600 }} />
                        </XAxis>
                        <YAxis axisLine={{ stroke: '#e5e7eb' }} tickLine={false} tick={{ fontSize: 10, fill: '#000000', fontWeight: 500 }}>
                          <Label value="Usage (Wh)" angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#6b7280', fontWeight: 600 }} />
                        </YAxis>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          labelStyle={{ color: '#000000', fontWeight: 'bold' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="usage"
                          stroke="#f97316"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorUsage)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Device Distribution */}
                <UsageByCategory />

                {/* ── Building Cards ── */}
                <div className={`grid gap-4 sm:gap-5 ${(activeTab === 'overview' ? buildings : buildings.filter(b => b.building_id === activeTab)).length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2'}`}>
                    {(activeTab === 'overview' ? buildings : buildings.filter(b => b.building_id === activeTab)).map(building => (
                        <BuildingCard
                            key={building.building_id}
                            building={building}
                            modules={modules.filter(m => m.building_id === building.building_id)}
                            allDeviceData={allDeviceData}
                        />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
