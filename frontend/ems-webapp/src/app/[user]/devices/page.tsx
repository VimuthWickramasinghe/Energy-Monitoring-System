"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Plus, Wifi, Cpu, SignalHigh, Search, Filter, Activity, Edit2, RefreshCw, Bluetooth, X, Loader2, AlertCircle, Eye, EyeOff
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import { useBuilding, module_state, Module } from "@/lib/DeviceBuildingContext";
import { DeviceCard } from "@/components/device/DeviceCard";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";


interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: any;
}

const ProvisioningModal = ({ isOpen, onClose, scanStatus, onStartScan, onProvision, onRetry, buildings, onSelectDevice, foundDevices, onRegister, configDetails }: {
    isOpen: boolean;
    onClose: () => void;
    scanStatus: string;
    onStartScan: () => void;
    onProvision: () => void;
    onRetry: () => void;
    onRegister: () => void;
    onSelectDevice: (device: BluetoothDevice) => void;
    buildings: { building_id: string; building_name: string }[];
    foundDevices: BluetoothDevice[];
    configDetails: { name: string; building: string; phase: number; ssid: string };
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Provision New Module</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                    {(scanStatus === 'idle' || scanStatus === 'error') && (
                        <>
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
                                <Bluetooth size={40} />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-black">Connect via Bluetooth</h3>
                            <p className="text-gray-500 text-sm mb-8">Ensure your modular unit is in pairing mode <br/>(blinking blue LED).</p>
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
                                {foundDevices.map((dev) => (
                                    <div
                                        key={dev.id || dev.name}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Cpu className="text-gray-400 group-hover:text-orange-500" />
                                            <span className="font-bold text-gray-900 text-sm">{dev.name || 'Unknown Device'}</span>
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
                                <select id="provision-building" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500 appearance-none">
                                    <option value="">Select a building...</option>
                                    {buildings.map(b => (
                                        <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-orange-600 font-medium">
                                    Don't see your building? <Link href="./building" className="underline font-bold">Register it first</Link>
                                </p>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase">Phase Assignment</label>
                                <select id="provision-phase" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500 appearance-none">
                                    <option value="1">Phase 1 (L1)</option>
                                    <option value="2">Phase 2 (L2)</option>
                                    <option value="3">Phase 3 (L3)</option>
                                </select>
                                <p className="text-[10px] text-gray-500">Select which electrical phase this module is monitoring.</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase">Wi-Fi Network (SSID)</label>
                                <input
                                    id="wifi-ssid"
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                    placeholder="Home_Network_2.4G"
                                    required
                                />
                                <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                                <input
                                    id="wifi-pass"
                                    type="password"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                    placeholder="••••••••"
                                    required
                                />
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
                        <div className="w-full space-y-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Connected to Wi-Fi!</h3>
                            <div className="w-full bg-gray-50 rounded-xl p-4 my-4 text-left space-y-2 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Registration Details</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <span className="text-gray-500">Module Name:</span>
                                    <span className="text-gray-900 font-bold text-right">{configDetails.name}</span>
                                    <span className="text-gray-500">Building:</span>
                                    <span className="text-gray-900 font-bold text-right">{configDetails.building}</span>
                                    <span className="text-gray-500">Phase:</span>
                                    <span className="text-gray-900 font-bold text-right">Phase {configDetails.phase}</span>
                                </div>
                            </div>

                            <button onClick={() => onRegister()} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all">
                                Register Module
                            </button>
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
                            <button onClick={onRetry} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Try Again</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function DevicesPage() {
    const { modules, buildings, fetchModules, fetchBuildings, removeModule, registerModule, loading } = useBuilding();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>("all");
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'configuring' | 'provisioning' | 'success' | 'error'>('idle');
    const [foundDevices, setFoundDevices] = useState<BluetoothDevice[]>([]);
    const selectedDeviceRef = useRef<any>(null);
    const [selectedDeviceState, setSelectedDeviceState] = useState<any | null>(null);
    const [configDetails, setConfigDetails] = useState({ name: '', building: '', phase: 1, ssid: '' });
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            fetchModules();
            fetchBuildings();
        }
    }, [user, authLoading]);

    const groupedDevices = useMemo(() => {
        // Filter modules based on search and building filter
        const filtered = modules.filter(device =>
            (selectedBuildingFilter === "all" || device.building_id === selectedBuildingFilter) &&
            (device.module_name?.toLowerCase().includes(searchQuery.toLowerCase()) || device.module_id?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return buildings.map(building => ({
            ...building,
            devices: filtered.filter(d => d.building_id === building.building_id)
        })).filter(b => selectedBuildingFilter === 'all' || b.building_id === selectedBuildingFilter);
    }, [modules, buildings, searchQuery, selectedBuildingFilter]);


    const onlineCount = modules.filter(d => d.state === module_state.Active).length;
    const offlineCount = modules.filter(d => d.state === module_state.Offline).length;
    const disabledCount = modules.filter(d => d.state === module_state.Inactive).length;

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this module?")) {
            removeModule(id);
        }
    };

    const handleAddModule = () => {
        setIsProvisioning(true);
        setScanStatus('idle');
    };

    const startBLEScan = async () => {
        setScanStatus('scanning');
        try {
            const device = await (navigator as any).bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'ems' }
                ],
                optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'] // Example UUID
            });
            setFoundDevices([device]);
            selectedDeviceRef.current = device;
            setSelectedDeviceState(device);
            setScanStatus('found');
        } catch (error) {
            console.error("BLE Scan Error:", error);
            setScanStatus('error');
        }
    };

    const provisionDevice = async () => {
        if (!selectedDeviceRef.current) return;

        const ssid = (document.getElementById('wifi-ssid') as HTMLInputElement)?.value;
        const pass = (document.getElementById('wifi-pass') as HTMLInputElement)?.value;
        const name = selectedDeviceRef.current?.name || "Unknown Device";
        const buildingId = (document.getElementById('provision-building') as HTMLSelectElement)?.value;
        const phase = parseInt((document.getElementById('provision-phase') as HTMLSelectElement)?.value || "1");

        if (!ssid) return alert("SSID is required");
        if (!buildingId) return alert("Please select a building");

        setScanStatus('provisioning');
        try {
            const server = await selectedDeviceRef.current.gatt?.connect();
            const service = await server?.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');

            const ssidChar = await service?.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
            const passChar = await service?.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a9');
            const statusChar = await service?.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26aa'); // Status characteristic

            const encoder = new TextEncoder();
            if (ssidChar) await ssidChar.writeValue(encoder.encode(ssid));
            if (passChar) await passChar.writeValue(encoder.encode(pass));

            // Wait for connection status from device
            if (statusChar) {
                await statusChar.startNotifications();
                const statusValue = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error("Timeout waiting for device status")), 45000);
                    statusChar.addEventListener('characteristicvaluechanged', (event: any) => {
                        clearTimeout(timeout);
                        const val = new TextDecoder().decode(event.target.value);
                        resolve(val);
                    }, { once: true });
                });
                if (statusValue !== "CONNECTED" && statusValue !== "CONNECTED\n") throw new Error(statusValue === "FAILED" ? "WiFi Connection Failed" : "Unknown Error");
            }

            setConfigDetails({
                name: name, // 
                building: buildingId,  // uuid of the building
                phase: phase, // integer
                ssid: ssid // wifi SSI
            });
            setScanStatus('success');
        } catch (error) {
            console.error("Provisioning Error:", error);
            setScanStatus('error');
        }
    };

    const handleTestRegister = async () => {
        try {
            // Hardcoded test values
            const testName = "esp-ems-002";
            const testBuildingId = "0ebf0a65-ad07-4ba5-adf6-2b867703cac5";
            const testPhase = 1;

            await registerModule(testName, testBuildingId, testPhase);
            alert("Module registered successfully!");
        } catch (error: any) {
            alert(`Registration failed: ${error.message}`);
        }
    };

    const handleRegister = async () => {
        const moduleName = configDetails.name;
        const buildingId = configDetails.building;
        const phaseValue = configDetails.phase;
        let phase = typeof phaseValue === 'number' ? phaseValue : parseInt(phaseValue || "1");

        console.log("Registering Module with following details:", {
            moduleName,
            buildingId,
            phase,
            originalPhaseValue: phaseValue
        });
        try {
            // Use the BLE device name as the moduleId (e.g., ems-XXXXXX)
            await registerModule(moduleName, buildingId, phase);
            setIsProvisioning(false);
            // fetchModules();
            alert("Module registered successfully!");
        } catch (error) {
            alert(`Failed to register module in database ${error}`);
        }
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
            <Header
                title="Modular Units"
                subtitle="Manage and monitor your hardware modules"
            >
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
                            {buildings.map(b => (
                                <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
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
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="animate-spin text-orange-500" size={32} />
                                <p className="text-sm font-medium">Loading modules...</p>
                            </div>
                        ) : groupedDevices.map((group) => (
                            <div key={group.building_id} className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <h2 className="text-lg font-bold text-gray-900">{group.building_name}</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs font-bold">
                                        {group.devices.length} {group.devices.length === 1 ? 'Module' : 'Modules'}
                                    </span>
                                </div>
                                {group.devices.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {group.devices.map((device) => (
                                            <DeviceCard
                                                key={device.module_id}
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
                onRegister={handleRegister}
                buildings={buildings}
                foundDevices={foundDevices}
                configDetails={configDetails}
                onSelectDevice={(device) => {
                    selectedDeviceRef.current = device;
                    setSelectedDeviceState(device);
                    setScanStatus('configuring');
                }}
            />
        </main>
    );
}