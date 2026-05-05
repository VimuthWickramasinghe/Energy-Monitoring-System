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

const BuildingCard = ({ building, onClick }: { building: Building; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
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
    </div>
  </div>
);

const BuildingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position, 
  onMouseDown, 
  newBuilding, 
  setNewBuilding 
}: any) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity" />
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div
          onMouseDown={onMouseDown}
          className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center cursor-move select-none"
        >
          <div className="flex items-center gap-2 text-gray-600">
            <GripHorizontal size={18} />
            <span className="font-bold text-sm">Register Building</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Building Name</label>
            <input
              required
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. North Wing"
              value={newBuilding.name}
              onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })}
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
              onChange={e => setNewBuilding({ ...newBuilding, address: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all mt-2">
            Confirm Registration
          </button>
        </form>
      </div>
    </>
  );
};

const BuildingDetailsView = ({ building, onBack }: { building: Building; onBack: () => void }) => (
  <main className="flex-1 flex flex-col overflow-hidden bg-white">
    <Header title={building.name} subtitle={building.address}>
      <button
        onClick={onBack}
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
      </div>
    </div>
  </main>
);

export default function DeviceManagement() {
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

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

  if (selectedBuilding) {
    return (
      <BuildingDetailsView building={selectedBuilding} onBack={() => setSelectedBuilding(null)} />
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

      <BuildingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBuilding}
        position={position}
        onMouseDown={handleMouseDown}
        newBuilding={newBuilding}
        setNewBuilding={setNewBuilding}
      />

      <div className="p-8 space-y-6">
        {/* Buildings Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-orange-500" size={20} />
            Registered Buildings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <BuildingCard 
                key={building.id} 
                building={building} 
                onClick={() => setSelectedBuilding(building)} 
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
