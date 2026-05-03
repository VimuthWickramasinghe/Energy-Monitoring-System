"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
    Plus, Wifi, Cpu, SignalHigh, Bell, Search, Filter, MoreVertical, Activity, Edit2, Trash2, RefreshCw, Bluetooth, X, Loader2, AlertCircle
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INITIAL_DEVICES = [
    { id: "ESP-32-001", name: "Main Panel (3-Phase Cluster)", status: "online", type: "3-Phase", load: "4.2 kW", signal: "PLC", health: 98, buildingId: 'b1' },
    { id: "ESP-32-002", name: "EV Charger Link", status: "online", type: "1-Phase", load: "7.2 kW", signal: "Wi-Fi", health: 95, buildingId: 'b1' },
    { id: "ESP-32-003", name: "HVAC Controller", status: "offline", type: "1-Phase", load: "0.0 kW", signal: "PLC", health: 0, buildingId: 'b2' },
    { id: "ESP-32-004", name: "Backup Generator Monitor", status: "disabled", type: "3-Phase", load: "0.0 kW", signal: "Wi-Fi", health: 100, buildingId: 'b2' },
];

const BUILDINGS = [
    { id: 'b1', name: 'Corporate HQ' },
    { id: 'b2', name: 'West Warehouse' },
    { id: 'b3', name: 'Downtown Hub' },
];

interface Device {
    id: string;
    name: string;
    status: string;
    type: string;
    load: string;
    signal: string;
    health: number;
    buildingId: string;
}

const DeviceCard = ({ device, onDelete }: { 
    device: Device; 
    onDelete: (id: string) => void; 
}) => (
    <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all ${
        device.status === 'online' ? 'border-green-100' : 
        device.status === 'offline' ? 'border-red-100 bg-red-50/30' : 
        'border-gray-100 bg-gray-50/50'
    }`}>
        <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${device.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Cpu size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{device.name}</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase">{device.id} • {device.type}</p>
                </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${
                device.status === 'online' ? 'bg-green-500 text-white' : 
                device.status === 'offline' ? 'bg-red-500 text-white' : 
                'bg-gray-400 text-white'
            }`}>
                {device.status.toUpperCase()}
            </span>
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
            <button 
                disabled={device.status === 'offline'}
                className={`text-sm font-semibold transition-colors ${device.status === 'offline' ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'}`}
            >
                View Details
            </button>
            <div className="flex gap-2">
                <Link
                    href={`devices/${device.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit Module"
                >
                    <Edit2 size={18} />
                </Link>
            </div>
        </div>
    </div>
);

const ProvisioningModal = ({ isOpen, onClose, scanStatus, onStartScan, onProvision, onRetry, buildings, onSelectDevice }: {
    isOpen: boolean;
    onClose: () => void;
    scanStatus: string;
    onStartScan: () => void;
    onProvision: () => void;
    onRetry: () => void;
    buildings: { id: string; name: string }[];
    onSelectDevice: (device: { id: string; rssi: string }) => void;
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Provision New Module</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                    {scanStatus === 'idle' && (
                        <>
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
                                <Bluetooth size={40} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Connect via Bluetooth</h3>
                            <p className="text-gray-500 text-sm mb-8">Ensure your modular unit is in pairing mode (blinking blue LED).</p>
                            <button onClick={onStartScan} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all">
                                Scan for Devices
                            </button>
                        </>
                    )}
                    {scanStatus === 'scanning' && (
                        <>
                            <Loader2 size={48} className="text-orange-500 animate-spin mb-6" />
                            <h3 className="text-lg font-bold mb-2">Scanning...</h3>
                            <p className="text-gray-500 text-sm">Searching for nearby ESP-32 modules</p>
                        </>
                    )}
                    {scanStatus === 'found' && (
                        <div className="w-full space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase text-left">Select Device</h3>
                            <div className="space-y-2">
                                {([
                                    { id: 'ESP32-EMS-PRO-X1', rssi: '-42dBm' },
                                    { id: 'ESP32-EMS-PRO-X2', rssi: '-65dBm' }
                                ]).map((dev) => (
                                    <div 
                                        key={dev.id}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Cpu className="text-gray-400 group-hover:text-orange-500" />
                                            <span className="font-bold text-gray-900 text-sm">{dev.id}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSelectDevice(dev)}
                                            className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Proceed
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {scanStatus === 'configuring' && (
                        <div className="w-full space-y-4">
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase">Assign to Building</label>
                                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500 appearance-none">
                                    <option value="">Select a building...</option>
                                    {buildings.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-orange-600 font-medium">
                                    Don't see your building? <Link href="building" className="underline font-bold">Register it first</Link>
                                </p>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase">Wi-Fi Network (SSID)</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500" placeholder="Home_Network_2.4G" />
                                <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                                <input type="password" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500" placeholder="••••••••" />
                            </div>
                            <button onClick={onProvision} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all mt-4">
                                Configure & Connect
                            </button>
                        </div>
                    )}
                    {scanStatus === 'provisioning' && (
                        <>
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border-4 border-orange-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Provisioning...</h3>
                            <p className="text-gray-500 text-sm">Sending credentials and registering device to cloud...</p>
                        </>
                    )}
                    {scanStatus === 'success' && (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <RefreshCw size={32} className="animate-spin" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Provisioning Successful!</h3>
                            <p className="text-gray-500 text-sm mt-2">Starting device configuration sequence...</p>
                        </div>
                    )}
                    {scanStatus === 'error' && (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Provisioning Failed</h3>
                            <p className="text-gray-500 text-sm mt-2 mb-6">Connection timed out. Please check the device and try again.</p>
                            <button onClick={() => onSelectDevice({id: '', rssi: ''})} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Try Again</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function DevicesPage() {
    const [deviceList, setDeviceList] = useState(INITIAL_DEVICES);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>("all");
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'configuring' | 'provisioning' | 'success' | 'error'>('idle');
    const [wifiCreds, setWifiCreds] = useState({ ssid: '', password: '' });
    const router = useRouter();

    const groupedDevices = useMemo(() => {
        const filtered = deviceList.filter(device => 
            (selectedBuildingFilter === "all" || device.buildingId === selectedBuildingFilter) &&
            (device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return BUILDINGS.map(building => ({
            ...building,
            devices: filtered.filter(d => d.buildingId === building.id)
        })).filter(b => selectedBuildingFilter === 'all' || b.id === selectedBuildingFilter);
    }, [deviceList, searchQuery, selectedBuildingFilter]);

    const orphanedDevices = useMemo(() => {
        const buildingIds = BUILDINGS.map(b => b.id);
        return deviceList.filter(d => !buildingIds.includes(d.buildingId));
    }, [deviceList]);

    const onlineCount = deviceList.filter(d => d.status === 'online').length;
    const offlineCount = deviceList.filter(d => d.status === 'offline').length;
    const disabledCount = deviceList.filter(d => d.status === 'disabled').length;

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this module?")) {
            setDeviceList(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleAddModule = () => {
        setIsProvisioning(true);
        setScanStatus('idle');
    };

    const startBLEScan = () => {
        setScanStatus('scanning');
        // Simulate BLE Scan
        setTimeout(() => setScanStatus('found'), 2000);
    };

    const provisionDevice = () => {
        setScanStatus('provisioning');
        setTimeout(() => {
            // Randomly simulate success or failure for demo purposes
            if (Math.random() > 0.3) {
                setScanStatus('success');
                const newId = `ESP-32-00${deviceList.length + 1}`;
                setTimeout(() => {
                    const newDevice: Device = {
                        id: newId,
                        name: "New Modular Unit",
                        status: "offline",
                        type: "1-Phase",
                        load: "0.0 kW",
                        signal: "Wi-Fi",
                        buildingId: 'b1',
                        health: 100
                    };
                    setDeviceList(prev => [...prev, newDevice]);
                    setIsProvisioning(false);
                    router.push(`devices/${newId}`);
                }, 3000);
            } else {
                setScanStatus('error');
            }
        }, 3000);
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
            <Header title="Modular Units" subtitle="Manage and monitor your hardware modules">
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:ring-2 focus:ring-orange-500 outline-none w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <Filter size={16} className="text-gray-400" />
                        <select 
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none"
                            value={selectedBuildingFilter}
                            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                        >
                            <option value="all">All Buildings</option>
                            {BUILDINGS.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
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
                            <div className="flex gap-4">
                                <p className="text-sm font-medium text-orange-800"><span className="font-bold">{onlineCount}</span> Online Modules</p>
                                <p className="text-sm font-medium text-orange-800/60"><span className="font-bold">{offlineCount}</span> Offline</p>
                                <p className="text-sm font-medium text-orange-800/60"><span className="font-bold">{disabledCount}</span> Disabled</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">System Healthy</span>
                    </div>

                    <div className="space-y-10">
                        {groupedDevices.map((group) => (
                            <div key={group.id} className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h2 className="text-lg font-bold text-gray-900">{group.name}</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs font-bold">
                                        {group.devices.length} {group.devices.length === 1 ? 'Module' : 'Modules'}
                                    </span>
                                </div>
                                {group.devices.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {group.devices.map((device) => (
                                            <DeviceCard 
                                                key={device.id} 
                                                device={device} 
                                                onDelete={handleDelete} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 px-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <Cpu className="text-gray-200 mb-2" size={32} />
                                        <p className="text-sm text-gray-400 font-medium">No modules registered in this building yet.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ProvisioningModal 
                isOpen={isProvisioning} 
                onClose={() => setIsProvisioning(false)} 
                scanStatus={scanStatus} 
                onStartScan={startBLEScan} 
                onProvision={provisionDevice} 
                onRetry={() => setScanStatus('idle')}
                buildings={BUILDINGS}
                onSelectDevice={(device) => setScanStatus('configuring')}
            />
        </main>
    );
}