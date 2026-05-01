"use client";
import React, { useState, useMemo } from "react";
import {
    Plus, Wifi, Cpu, SignalHigh, Bell, Search, Filter, MoreVertical, Activity, Edit2, Trash2, RefreshCw
} from "lucide-react";
import Nav from "@/components/UserNav";
import Header from "@/components/Header";
import Link from "next/link";

const INITIAL_DEVICES = [
    { id: "ESP-32-001", name: "Main Panel (3-Phase Cluster)", status: "online", type: "3-Phase", load: "4.2 kW", signal: "PLC", health: 98 },
    { id: "ESP-32-002", name: "EV Charger Link", status: "online", type: "1-Phase", load: "7.2 kW", signal: "Wi-Fi", health: 95 },
    { id: "ESP-32-003", name: "HVAC Controller", status: "offline", type: "1-Phase", load: "0.0 kW", signal: "PLC", health: 0 },
];

export default function DevicesPage() {
    const [deviceList, setDeviceList] = useState(INITIAL_DEVICES);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredDevices = useMemo(() => {
        return deviceList.filter(device => 
            device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [deviceList, searchQuery]);

    const activeCount = deviceList.filter(d => d.status === 'online').length;

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this module?")) {
            setDeviceList(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleAddModule = () => {
        const id = `ESP-32-00${deviceList.length + 1}`;
        const newDevice = {
            id,
            name: "New Modular Unit",
            status: "online",
            type: "1-Phase",
            load: "0.0 kW",
            signal: "Wi-Fi",
            health: 100
        };
        setDeviceList(prev => [...prev, newDevice]);
    };

    const handleCalibrate = (id: string) => {
        alert(`Initiating calibration sequence for module ${id}...`);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Nav />

            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title="Modular Units" subtitle="Manage and monitor your hardware modules">
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Filter size={20} />
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <button 
                            onClick={handleAddModule}
                            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Add Module</span>
                        </button>
                    </div>
                </Header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Summary Bar */}
                        <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg text-white">
                                    <Activity size={20} />
                                </div>
                                <p className="text-sm font-medium text-orange-800">{activeCount} active modules detected across the local network</p>
                            </div>
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">System Healthy</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredDevices.map((device) => (
                                <div key={device.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl ${device.status === 'online' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                                                <Cpu size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{device.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono uppercase">{device.id} • {device.type}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${device.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {device.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Active Load</p>
                                            <p className="text-sm font-bold text-gray-900 text-center">{device.load}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Protocol</p>
                                            <p className="text-sm font-bold text-gray-900 text-center flex items-center justify-center gap-1">
                                                {device.signal === 'Wi-Fi' ? <Wifi size={14} /> : <SignalHigh size={14} />}
                                                {device.signal}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Health</p>
                                            <p className="text-sm font-bold text-gray-900 text-center">{device.health}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <button className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                                            View Details
                                        </button>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleCalibrate(device.id)}
                                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                title="Calibrate Module"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                            <Link 
                                                href={`devices/${device.id}`}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Module"
                                            >
                                                <Edit2 size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(device.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove Module"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}