"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { AuthContext } from "@/lib/AuthContext";
import { BuildingCard } from "@/components/analytics/BuildingCard";
import { KPICard } from "@/components/analytics/KPICard";


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const { buildings, modules, fetchBuildings, fetchModules, loading: buildingLoading } = useBuilding();
    const { user } = React.useContext(AuthContext) as { user: any };
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
            load += (d.real_power || d.power || 0);
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
                    value: d.real_power || d.power || 0
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [allDeviceData, modules]);

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/60 pb-16 md:pb-0">
            {/* ── Page Header ── */}
            <Header title="Analytics & Insights" subtitle={subtitle}>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-500 transition-colors shadow-sm"
                        onClick={() => router.push(`/${user?.email}/analytics/export`)}
                    >
                        <Download size={16} color="white" />
                        <span className="text-white">Export Report</span>
                    </button>
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-360 mx-auto space-y-6">

                    {/* ── Tab Navigation ── */}
                    <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-full max-w-full overflow-x-auto">
                        <div className="flex min-w-max">
                            {tabs.map(tab => (
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

                    {/* ── Building Cards ── */}
                    <div className={`grid gap-4 sm:gap-5 ${visibleBuildings.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu size={18} className="text-purple-500" />
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base">MongoDB Raw Data (Testing)</h3>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-3 sm:p-4 overflow-auto max-h-60">
                            <pre className="text-[10px] text-green-400 font-mono break-all sm:break-normal">
                                {JSON.stringify(mongoDemoData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
