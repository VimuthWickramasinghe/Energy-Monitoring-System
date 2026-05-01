"use client";
import React, { useState } from 'react';
import { 
  Battery, 
  Power, 
  Settings2, 
  AlertTriangle, 
  Search, 
  Plus,
  MoreVertical,
  Zap,
  Thermometer,
  Wifi
} from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: 'HVAC' | 'Lighting' | 'Power' | 'Sensor';
  status: 'online' | 'offline' | 'warning';
  usage: string;
  location: string;
  lastActive: string;
  isOn: boolean;
}

const initialDevices: Device[] = [
  { id: '1', name: 'Main Lobby AC', type: 'HVAC', status: 'online', usage: '1.2 kW', location: 'Floor 1', lastActive: 'Now', isOn: true },
  { id: '2', name: 'Floor 2 Lighting', type: 'Lighting', status: 'online', usage: '0.8 kW', location: 'Floor 2', lastActive: 'Now', isOn: true },
  { id: '3', name: 'Server Room UPS', type: 'Power', status: 'warning', usage: '4.5 kW', location: 'Basement', lastActive: '2m ago', isOn: true },
  { id: '4', name: 'Zone B Sensor', type: 'Sensor', status: 'offline', usage: '0 kW', location: 'Floor 2', lastActive: '1h ago', isOn: false },
];

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [filter, setFilter] = useState('');

  const toggleDevice = (id: string) => {
    setDevices(devices.map(d => 
      d.id === id ? { ...d, isOn: !d.isOn, status: !d.isOn ? 'online' : 'offline' } : d
    ));
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) || 
    d.location.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search devices by name or location..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
            <Settings2 size={18} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors shadow-sm shadow-orange-200">
            <Plus size={18} />
            Add Device
          </button>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <div key={device.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${
                device.status === 'online' ? 'bg-green-50 text-green-600' : 
                device.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
              }`}>
                {device.type === 'HVAC' && <Thermometer size={24} />}
                {device.type === 'Lighting' && <Zap size={24} />}
                {device.type === 'Power' && <Battery size={24} />}
                {device.type === 'Sensor' && <Wifi size={24} />}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleDevice(device.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    device.isOn ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    device.isOn ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-gray-900">{device.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {device.location} • Last active {device.lastActive}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current Load</span>
                <span className="text-lg font-bold text-gray-900">{device.usage}</span>
              </div>
              {device.status === 'warning' && (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold">
                  <AlertTriangle size={14} />
                  High Load
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
