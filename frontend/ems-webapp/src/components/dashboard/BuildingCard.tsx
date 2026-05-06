import React from 'react';
import { Building2, Pencil, MapPin } from 'lucide-react';

export interface Building {
    id: string;
    name: string;
    address: string;
    status: 'active' | 'maintenance' | 'inactive';
}

/**
 * BuildingCard Component
 */
export const BuildingCard = ({ building, onClick, onEdit }: { building: Building; onClick: () => void; onEdit: (e: React.MouseEvent) => void }) => (
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
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    building.status === 'active' ? 'bg-green-50 text-green-600' : 
                    building.status === 'maintenance' ? 'bg-yellow-50 text-yellow-600' : 
                    'bg-gray-100 text-gray-500'
                }`}>{building.status}</span>
            </span>
        </div>
        <h3 className="font-bold text-gray-900">{building.name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} /> {building.address}
        </p>
    </div>
);

export default BuildingCard;
