"use client";
import React, { useState, useRef } from 'react';
import { 
  Plus,
  MapPin,
  Building2,
  X,
  GripHorizontal,
  Cpu,
  ArrowLeft,
  Settings,
  Activity,
  Zap,
  ShieldCheck,
  Thermometer
} from "lucide-react";
import Header from "@/components/Header";

interface Building {
  id: string;
  name: string;
  address: string;
  deviceCount: number;
  status: 'active' | 'maintenance';
}

const INITIAL_BUILDINGS: Building[] = [
  { id: 'b1', name: 'Corporate HQ', address: '123 Innovation Way', deviceCount: 12, status: 'active' },
  { id: 'b2', name: 'West Warehouse', address: '456 Logistics Blvd', deviceCount: 8, status: 'active' },
  { id: 'b3', name: 'Downtown Hub', address: '789 Center St', deviceCount: 5, status: 'maintenance' },
];

const MOCK_DEVICES = [
  { id: "ESP-32-001", name: "Main Panel", status: "online", load: "4.2 kW" },
  { id: "ESP-32-002", name: "HVAC Unit", status: "online", load: "2.1 kW" },
  { id: "ESP-32-003", name: "Lighting Controller", status: "offline", load: "0.0 kW" },
];

export default function DeviceManagement() {
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [activeConfigDevice, setActiveConfigDevice] = useState<typeof MOCK_DEVICES[0] | null>(null);
  
  // Window position state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
  };

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    const building: Building = {
      id: `b${buildings.length + 1}`,
      name: newBuilding.name,
      address: newBuilding.address,
      deviceCount: 0,
      status: 'active'
    };
    setBuildings([...buildings, building]);
    setIsModalOpen(false);
    setNewBuilding({ name: '', address: '' });
  };

  if (activeConfigDevice) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header 
          title={`Configure ${activeConfigDevice.name}`} 
          subtitle={`Hardware ID: ${activeConfigDevice.id}`}
        >
          <button 
            onClick={() => setActiveConfigDevice(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft size={18} /> Back to Building
          </button>
        </Header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 text-orange-500 mb-2"><Zap size={18} /><span className="text-xs font-bold uppercase">Load</span></div>
                <p className="text-2xl font-bold text-gray-900">{activeConfigDevice.load}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 text-blue-500 mb-2"><Thermometer size={18} /><span className="text-xs font-bold uppercase">Temp</span></div>
                <p className="text-2xl font-bold text-gray-900">38.2°C</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 text-green-500 mb-2"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase">Health</span></div>
                <p className="text-2xl font-bold text-gray-900">Optimal</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings size={18}/> Device Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Sampling Rate (ms)</label>
                  <input type="number" defaultValue="100" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Alert Threshold (W)</label>
                  <input type="number" defaultValue="5000" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <button className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all">
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (selectedBuilding) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header 
          title={selectedBuilding.name} 
          subtitle={selectedBuilding.address}
        >
          <button 
            onClick={() => setSelectedBuilding(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </Header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Building Devices</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all">
                <Plus size={18} /> Provision New Device
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {MOCK_DEVICES.map((device) => (
                <div key={device.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${device.status === 'online' ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400'}`}>
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{device.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{device.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                      <p className={`text-sm font-bold ${device.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                        {device.status.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Current Load</p>
                      <p className="text-sm font-bold text-gray-900">{device.load}</p>
                    </div>
                    <button 
                      onClick={() => setActiveConfigDevice(device)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <Settings size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="flex-1 overflow-y-auto bg-gray-50 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Header 
        title="Building Management" 
        subtitle="Monitor and control your infrastructure"
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={18} />
          <span>Add Building</span>
        </button>
      </Header>

      {/* Backdrop overlay when modal is open */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity" />
      )}

      {/* Floating Window Modal */}
      {isModalOpen && (
        <div 
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className="fixed z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          <div 
            onMouseDown={handleMouseDown}
            className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center cursor-move select-none"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <GripHorizontal size={18} />
              <span className="font-bold text-sm">Register Building</span>
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
      )}

      <div className="p-8 space-y-6">
      {/* Buildings Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="text-orange-500" size={20} />
          Registered Buildings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buildings.map((building) => (
            <div key={building.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                  <Building2 size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                  building.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {building.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{building.name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {building.address}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-400 font-medium">{building.deviceCount} Devices</span>
                <button 
                  onClick={() => setSelectedBuilding(building)}
                  className="text-orange-600 font-bold hover:underline"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>
    </main>
  );
}
