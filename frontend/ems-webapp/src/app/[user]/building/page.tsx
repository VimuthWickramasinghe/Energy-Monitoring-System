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
  Pencil,
  Trash2,
  ShieldCheck,
  Thermometer
} from "lucide-react";
import Header from "@/components/Header";

interface Building {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'maintenance';
}

const INITIAL_BUILDINGS: Building[] = [

];

// --- Components ---

/**
 * BuildingCard Component
 */
const BuildingCard = ({ building, onClick, onEdit }: { building: Building; onClick: () => void; onEdit: (e: React.MouseEvent) => void }) => (
  <div 
    onClick={onClick}
    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
        <Building2 size={20} />
      </div>
      <span className="flex items-center gap-2">
        <div className="hidden group-hover:flex items-center gap-1 mr-2">
          <button 
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${building.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{building.status}</span>
      </span>
    </div>
    <h3 className="font-bold text-gray-900">{building.name}</h3>
    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
      <MapPin size={12} /> {building.address}
    </p>
  </div>
);

/**
 * BuildingModal Component
 */
const BuildingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position, 
  onMouseDown, 
  newBuilding, 
  setNewBuilding,
  editingId,
  onDelete
}: any) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmId, setConfirmId] = useState('');
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
            <span className="font-bold text-sm">{editingId ? 'Edit Building' : 'Register Building'}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
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
            {editingId ? 'Save Changes' : 'Confirm Registration'}
          </button>
          </form>

          {editingId && (
            <div className="pt-4 border-t border-gray-100">
              {!showConfirmDelete ? (
                <button 
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} /> Delete Building
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[10px] font-bold text-red-600">TYPE ID TO CONFIRM <br/>ID <span className="select-all bg-red-50 px-1">{editingId}</span></p>
                  <input
                    type="text"
                    className="w-full p-2 bg-red-50 border border-red-100 rounded-lg outline-none text-sm"
                    placeholder="Enter Building ID"
                    value={confirmId}
                    onChange={e => setConfirmId(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setShowConfirmDelete(false); setConfirmId(''); }}
                      className="flex-1 py-2 text-gray-500 text-xs font-bold"
                    >Cancel</button>
                    <button 
                      disabled={confirmId !== editingId}
                      onClick={() => { onDelete(); setShowConfirmDelete(false); setConfirmId(''); }}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >Confirm Delete</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Main Page Component
 */
export default function DeviceManagement() {
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
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
    if (editingId) {
      setBuildings(buildings.map(b => 
        b.id === editingId 
          ? { ...b, name: newBuilding.name, address: newBuilding.address }
          : b
      ));
    } else {
      const building: Building = {
        id: `b${Date.now()}`,
        name: newBuilding.name,
        address: newBuilding.address,
        status: 'active'
      };
      setBuildings([...buildings, building]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setNewBuilding({ name: '', address: '' });
  };

  const handleEditClick = (e: React.MouseEvent, building: Building) => {
    e.stopPropagation();
    setNewBuilding({
      name: building.name,
      address: building.address
    });
    setEditingId(building.id);
    setIsModalOpen(true);
  }

  const handleDeleteBuilding = () => {
    if (!editingId) return;
    setBuildings(buildings.filter(b => b.id !== editingId));
    setIsModalOpen(false);
  };

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
          onClick={() => {
            setEditingId(null);
            setNewBuilding({ name: '', address: '' });
            setIsModalOpen(true);
          }}
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
        editingId={editingId}
        onDelete={handleDeleteBuilding}
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
                onEdit={(e) => handleEditClick(e, building)}
                onClick={() => setSelectedBuilding(building)} 
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
