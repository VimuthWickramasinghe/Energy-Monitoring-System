"use client"
import { client } from "@/utils/supabase/client";
import { UUID } from "mongodb";
import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuid } from "uuid";

export interface Device {
    id: string;
    name: string;
    building_id: string;
    status: string;
    // Add other device fields as necessary
}

interface DeviceBuildingContextType {
    devices: Device[];
    buildings: Building[];
    loading: boolean;
    error: string | null;
    fetchDevices: () => Promise<void>;
    addDevice: (device: Omit<Device, 'id'>) => Promise<void>;
    removeDevice: (deviceId: string) => Promise<void>;
    fetchBuildings: () => Promise<void>;
    updateBuilding: (building_id: string, building_name: string | null, address: string | null) => Promise<void>;
    addBuilding: (building_name: string, address: string, owner_id: UUID) => Promise<void>;
    removeBuildings: (buildingId: string) => Promise<void>;
}

export const DeviceBuildingContext = createContext<DeviceBuildingContextType | undefined>(undefined);

export enum building_state {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Maintenance = "MAINTENANCE",
}

export interface Building {
    building_id: string;
    building_name: string;
    owner_id: string;
    address: string;
    added_on: string;
    state: building_state;
}

export default function DeviceBuildingProvider({ children }: { children: ReactNode }) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('DEVICES')
                .select('*');
            if (error) {
                setError(error.message);
            } else {
                setDevices(data);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const addDevice = async (device: Omit<Device, 'id'>) => {
        try {
            const { data, error } = await client
                .from('DEVICES')
                .insert([{ ...device, id: uuid() }])
                .select();
            if (error) throw error;
            if (data) setDevices([...devices, data[0]]);
        } catch (error: any) {
            setError(error.message);
        }
    };

    const removeDevice = async (deviceId: string) => {
        try {
            const { error } = await client
                .from('DEVICES')
                .delete()
                .eq('id', deviceId);
            if (error) throw error;
            setDevices(devices.filter(d => d.id !== deviceId));
        } catch (error: any) {
            setError(error.message);
        }
    };

    // Building 
    const fetchBuildings = async (owner_id?: string) => {
        setLoading(true);
        setError(null);
        try {
            let query = client.from('BUILDING').select('*');
            if (owner_id) {
                query = query.eq('owner_id', owner_id);
            }
            const { data, error } = await query;
            if (error) {
                setError(error.message);
            } else {
                setBuildings(data);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    const updateBuilding = async (building_id: string, building_name: string | null, address: string | null) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('BUILDING')
                .update({ address: address, building_name: building_name })
                .eq('building_id', building_id)
                .select();
            if (error) {
                throw error;
            }
            if (data) {
                // Update the local state so the UI reflects the change immediately
                setBuildings(buildings.map(b => b.building_id === building_id ? { ...b, ...data[0] } : b));
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }
    const addBuilding = async (building_name: string, address: string, owner_id: UUID) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('BUILDING')
                .insert([{ building_name: building_name, address: address, owner_id: owner_id }])
                .select();
            if (error) throw error;
            if (data) {
                // Add the new building to the local state
                setBuildings([...buildings, data[0]]);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const removeBuildings = async (buildingId: string) => {
        try {
            const { error } = await client
                .from('BUILDING')
                .delete()
                .eq('building_id', buildingId);
            if (error) throw error;
            setBuildings(buildings.filter(b => b.building_id !== buildingId));
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <DeviceBuildingContext.Provider value={{ devices, buildings, loading, error, fetchDevices, addDevice, removeDevice, fetchBuildings, updateBuilding, addBuilding, removeBuildings }}>
            {children}
        </DeviceBuildingContext.Provider>
    );
}

export const useDeviceBuilding = () => {
    const context = useContext(DeviceBuildingContext);
    if (context === undefined) {
        throw new Error("useDeviceBuilding must be used within a DeviceBuildingProvider");
    }
    return context;
};

export const useBuilding = () => {
    return useDeviceBuilding();
};
