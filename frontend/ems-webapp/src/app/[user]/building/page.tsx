"use client";
import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  Trash2,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import { UUID } from "mongodb";

import Header from "@/components/Header";
import { useBuilding, building_state } from "@/lib/DeviceBuldingContext";
import { useAuth } from "@/lib/AuthContext";
import BuildingCard from "@/components/dashboard/BuildingCard";
import BuildingModal from "@/components/dashboard/NewEditBuildingWindow"
// --- Components ---


/**
 * Main Page Component
 */
export default function BuildingManagement() {
  const { buildings, fetchBuildings, updateBuilding, addBuilding, removeBuildings, loading } = useBuilding();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);

  useEffect(() => {
    fetchBuildings();
  }, []);


  // Window position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition({ x: window.innerWidth / 2 - 192, y: window.innerHeight / 2 - 200 });
  }, []);





  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  };




  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId ) {
      updateBuilding(editingId, newBuilding.name, newBuilding.address);
    } else if (user) {
      addBuilding(newBuilding.name, newBuilding.address, "e30c98e4-a721-4928-9db9-9c0b24c6a728" as any);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setNewBuilding({ name: '', address: '' });
  };

  const handleEditClick = (e: React.MouseEvent, building: any) => {
    e.stopPropagation();
    setNewBuilding({
      name: building.building_name,
      address: building.address
    });
    setEditingId(building.building_id);
    setIsModalOpen(true);
  }

  const handleDeleteBuilding = () => {
    if (!editingId) return;
    removeBuildings(editingId);
    setIsModalOpen(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 relative">
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

      {/* Component to handle Adding a new building and editing building information */}
      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBuilding}
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
            {loading ? (
              <div className="col-span-3 py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-sm font-medium">Loading buildings...</p>
              </div>
            ) : (
              buildings.map((building) => (
                <BuildingCard
                  key={building.building_id}
                  building={{
                    id: building.building_id,
                    name: building.building_name,
                    address: building.address,
                    status: building.state?.toLowerCase() as ('active' | 'inactive' | 'maintenance') || 'inactive'
                  }}
                  onEdit={(e) => handleEditClick(e, building)}
                  onClick={() => setSelectedBuilding(building)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
