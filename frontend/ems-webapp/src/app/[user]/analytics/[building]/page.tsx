"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line
} from "recharts";
import {
    Building2, Zap, Activity, TrendingUp,
    AlertTriangle, Calendar, Cpu, ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import { useBuilding } from "@/lib/DeviceBuildingContext";
import { useDeviceData } from "@/lib/DeviceDataContext";
import { useProfile } from "@/lib/ProfileContext";
import { BuildingCard } from "@/components/analytics/BuildingCard";
import { KPICard } from "@/components/analytics/KPICard";

export default function AnalyticsPage() {
    const { buildings, modules, fetchBuildings, fetchModules, loading: buildingLoading } = useBuilding();
    const { profile } = useProfile();
    const { devices: allDeviceData, mongoDemoData, refreshDevices } = useDeviceData();

    const [activeTab, setActiveTab] = useState<'overview' | string>('overview');

    useEffect(() => {
        if (profile?.user_id) {
            fetchBuildings();
            fetchModules();
        }
    }, [profile?.user_id]);

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

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/60">
            <Header title="Analytics & Insights" subtitle={subtitle} />

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Global KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border border-orange-400 text-orange-600 bg-orange-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Building Cards Grid */}
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

                    {/* Debug Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu size={18} className="text-purple-500" />
                            <h3 className="font-bold text-gray-900">System Status</h3>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-60">
                            <pre className="text-[10px] text-green-400 font-mono">
                                {JSON.stringify({ 
                                    activeTab, 
                                    buildingCount: buildings.length, 
                                    moduleCount: modules.length,
                                    dataPoints: allDeviceData.length 
                                }, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
