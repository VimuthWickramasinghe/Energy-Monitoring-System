"use client";
import React, { useState, useEffect } from "react";
import {
    ArrowLeft, Save, RefreshCw, Settings2,
    ShieldCheck, Zap, Thermometer, Activity, PlayCircle, Power, PowerOff, Trash2, Plus, GripHorizontal, X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

const BUILDINGS = [
    { id: 'b1', name: 'Corporate HQ' },
    { id: 'b2', name: 'West Warehouse' },
    { id: 'b3', name: 'Downtown Hub' },
];


export default function DeviceConfigPage() {
    const params = useParams();
    const deviceId = params.module as string;

    const [isCalibrating, setIsCalibrating] = useState(false);
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
    const [buildings, setBuildings] = useState(BUILDINGS);

    const [isTesting, setIsTesting] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [config, setConfig] = useState({
        name: "Main Panel (3-Phase Cluster)",
        threshold: 4500,
        samplingRate: 100,
        mode: "balanced",
        buildingId: "b1"
    });

    // Real-time simulation state
    const [realtimeData, setRealtimeData] = useState({
        voltage: 231.4,
        temp: 42.5,
        uptime: { days: 14, hours: 2 }
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setRealtimeData(prev => ({
                ...prev,
                voltage: parseFloat((230 + Math.random() * 5).toFixed(1)),
                temp: parseFloat((42 + Math.random() * 2).toFixed(1))
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleCalibrate = () => {
        setIsCalibrating(true);
        setTimeout(() => {
            setIsCalibrating(false);
            alert("Calibration complete. Sensors zeroed.");
        }, 3000);
    };

    const handleTestDevice = () => {
        setIsTesting(true);
        setTimeout(() => {
            setIsTesting(false);
            alert("Self-test sequence completed. All systems nominal.");
        }, 2000);
    };

    const handleSaveChanges = () => {
        // In a real app, you would perform an API call here to update the device
        alert(`Configuration for ${deviceId} saved successfully.`);
        router.push("../devices");
    };

    const handleDeleteDevice = () => {
        if (confirm(`Are you sure you want to completely remove ${config.name} (${deviceId}) from the system? This action cannot be undone.`)) {
            // In a real app, perform API call here
            router.push("../devices");
        }
    };

    const toggleStatus = () => {
        setIsActive(!isActive);
    };

    const handleAddBuilding = (e: React.FormEvent) => {
        e.preventDefault();
        const building = {
            id: `b${buildings.length + 1}`,
            name: newBuilding.name,
        };
        setBuildings([...buildings, building]);
        setConfig({ ...config, buildingId: building.id });
        setIsModalOpen(false);
        setNewBuilding({ name: '', address: '' });
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            <Header
                title="Module Configuration"
                subtitle={`Hardware ID: ${deviceId}`}
            >
                <Link
                    href="../devices"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </Link>
            </Header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 text-orange-500 mb-2">
                                <Zap size={18} />
                                <span className="text-xs font-bold uppercase">Voltage L1</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{realtimeData.voltage}V</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 text-blue-500 mb-2">
                                <Thermometer size={18} />
                                <span className="text-xs font-bold uppercase">Internal Temp</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{realtimeData.temp}°C</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 text-green-500 mb-2">
                                <ShieldCheck size={18} />
                                <span className="text-xs font-bold uppercase">Uptime</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{realtimeData.uptime.days}d {realtimeData.uptime.hours}h</p>
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="text-gray-400" size={20} />
                                <h2 className="font-bold text-gray-900">General Settings</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={toggleStatus}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {isActive ? <PowerOff size={16} /> : <Power size={16} />}
                                    {isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button 
                                    onClick={handleTestDevice}
                                    disabled={isTesting}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    <PlayCircle size={16} className={isTesting ? "animate-pulse" : ""} /> 
                                    {isTesting ? "Testing..." : "Test Device"}
                                </button>
                                <button 
                                    onClick={handleSaveChanges}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        value={config.name}
                                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Load Threshold (Watts)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        value={config.threshold}
                                        onChange={(e) => setConfig({ ...config, threshold: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900">Operation Mode</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                                        value={config.mode}
                                        onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                                    >
                                        <option value="balanced">Balanced Performance</option>
                                        <option value="eco">Eco (Low Power)</option>
                                        <option value="high-freq">High Frequency Sampling</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-900">Assigned Building</label>
                                        <button 
                                            onClick={() => setIsModalOpen(true)}
                                            className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline"
                                        >
                                            <Plus size={10} /> New Building
                                        </button>
                                    </div>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                                        value={config.buildingId}
                                        onChange={(e) => setConfig({ ...config, buildingId: e.target.value })}
                                    >
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calibration Section */}
                    <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-orange-900">Sensor Calibration</h3>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Recalibrate the CT clamps and voltage sensors.
                                        Ensure no load is active for best results.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCalibrate}
                                disabled={isCalibrating}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all min-w-[160px] ${isCalibrating
                                        ? "bg-orange-200 text-orange-400 cursor-not-allowed"
                                        : "bg-white text-orange-600 hover:bg-orange-100 shadow-sm"
                                    }`}
                            >
                                <RefreshCw size={18} className={isCalibrating ? "animate-spin" : ""} />
                                {isCalibrating ? "Calibrating..." : "Start Calibration"}
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-red-900">Danger Zone</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Permanently remove this module and all its historical data from your account.
                                </p>
                            </div>
                            <button
                                onClick={handleDeleteDevice}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all shadow-sm border border-red-100"
                            >
                                <Trash2 size={18} /> Remove from System
                            </button>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-mono">Firmware Version: v2.4.1-stable • Last Sync: 2 mins ago</p>
                    </div>
                </div>
            </div>

            {/* Quick Add Building Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-gray-600">
                                <GripHorizontal size={18} />
                                <span className="font-bold text-sm">Register New Building</span>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddBuilding} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Building Name</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. North Wing"
                                    value={newBuilding.name}
                                    onChange={e => setNewBuilding({...newBuilding, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                    placeholder="123 Street Name"
                                    value={newBuilding.address}
                                    onChange={e => setNewBuilding({...newBuilding, address: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all mt-2">
                                Confirm Registration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}