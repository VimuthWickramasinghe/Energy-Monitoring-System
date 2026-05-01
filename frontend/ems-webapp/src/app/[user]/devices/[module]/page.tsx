"use client";
import React, { useState } from "react";
import {
    ArrowLeft, Save, RefreshCw, Settings2,
    ShieldCheck, Zap, Thermometer, Activity
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";

export default function DeviceConfigPage() {
    const params = useParams();
    const deviceId = params.id as string;

    const [isCalibrating, setIsCalibrating] = useState(false);
    const [config, setConfig] = useState({
        name: "Main Panel (3-Phase Cluster)",
        threshold: 4500,
        samplingRate: 100,
        mode: "balanced"
    });

    const handleCalibrate = () => {
        setIsCalibrating(true);
        setTimeout(() => {
            setIsCalibrating(false);
            alert("Calibration complete. Sensors zeroed.");
        }, 3000);
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
                            <p className="text-2xl font-bold text-gray-900">231.4V</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 text-blue-500 mb-2">
                                <Thermometer size={18} />
                                <span className="text-xs font-bold uppercase">Internal Temp</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">42.5°C</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 text-green-500 mb-2">
                                <ShieldCheck size={18} />
                                <span className="text-xs font-bold uppercase">Uptime</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">14d 2h</p>
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="text-gray-400" size={20} />
                                <h2 className="font-bold text-gray-900">General Settings</h2>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all">
                                <Save size={16} /> Save Changes
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={config.name}
                                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Load Threshold (Watts)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={config.threshold}
                                        onChange={(e) => setConfig({ ...config, threshold: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Operation Mode</label>
                                    <select
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={config.mode}
                                        onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                                    >
                                        <option value="balanced">Balanced Performance</option>
                                        <option value="eco">Eco (Low Power)</option>
                                        <option value="high-freq">High Frequency Sampling</option>
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

                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-mono">Firmware Version: v2.4.1-stable • Last Sync: 2 mins ago</p>
                    </div>
                </div>
            </div>
        </main>
    );
}