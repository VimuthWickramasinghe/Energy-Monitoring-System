"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
    Plus, Wifi, Cpu, SignalHigh, Search, Filter, Activity, Edit2, RefreshCw, Bluetooth, X, Loader2, AlertCircle, Trash2
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import { useBuilding, module_state, Module } from "@/lib/DeviceBuildingContext";
import { useAuth } from "@/lib/AuthContext";


interface DeviceCardProps {
    device: Module;
    onDelete: (id: string) => void;
}


export const DeviceCard = ({ device, onDelete }: DeviceCardProps) => {
    const { user } = useAuth();
    let statusClasses = 'bg-gray-400 text-white';
    let borderClasses = 'border-gray-100 bg-gray-50/50';
    const state = device.state;

    if (state === module_state.Active) {
        statusClasses = 'bg-green-500 text-white';
        borderClasses = 'border-green-100';
    } else if (state === module_state.Offline) {
        statusClasses = 'bg-red-500 text-white';
        borderClasses = 'border-red-100 bg-red-50/30';
    } else if (state === module_state.Inactive) {
        statusClasses = 'bg-gray-500 text-white';
        borderClasses = 'border-gray-200 bg-gray-100/50';
    }

    return (
        <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all ${borderClasses}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${state === module_state.Active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{device.module_name}</h3>
                        <p className="text-xs text-gray-500 font-mono uppercase truncate max-w-[150px]">{device.module_id}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${statusClasses}`}>
                    {state}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Active Load</p>
                    <p className="text-sm font-bold text-gray-900 text-center">-- kW</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Protocol</p>
                    <p className="text-sm font-bold text-gray-900 text-center flex items-center justify-center gap-1">
                        <Wifi size={14} /> Wi-Fi
                    </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Health</p>
                    <p className="text-sm font-bold text-gray-900 text-center">--%</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <Link
                    href={`/${user?.email}/analytics/${device.building_id}`}
                    className={`text-sm font-semibold transition-colors ${state === module_state.Offline ? 'text-gray-400 cursor-not-allowed pointer-events-none' : 'text-orange-600 hover:text-orange-700'}`}
                >
                    View Details
                </Link>
                <div className="flex gap-2">
                    <Link
                        href={`devices/${device.module_id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Module"
                    >
                        <Edit2 size={18} />
                    </Link>
                    <button
                        onClick={() => onDelete(device.module_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Module"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};