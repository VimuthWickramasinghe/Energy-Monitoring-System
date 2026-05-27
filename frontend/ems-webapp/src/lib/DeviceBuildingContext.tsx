"use client"
import { client } from "@/utils/supabase/client";
import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuid } from "uuid";
import { useAuth } from "./AuthContext";


interface DeviceBuildingContextType {
    modules: Module[];
    buildings: Building[];
    loading: boolean;
    error: string | null;
    fetchModules: () => Promise<void>;
    updateModule: (moduleId: string, module: Partial<Module>) => Promise<void>;
    addModule: (module: Omit<Module, 'module_id'>) => Promise<void>;
    removeModule: (moduleId: string) => Promise<void>;
    fetchBuildings: () => Promise<void>;
    updateBuilding: (building_id: string, building_name: string | null, address: string | null) => Promise<void>;
    addBuilding: (building_name: string, address: string, owner_id: string) => Promise<void>;
    removeBuildings: (buildingId: string) => Promise<void>;
    registerModule: ( moduleName: string, buildingId: string, phase: number) => Promise<void>;
}

export const DeviceBuildingContext = createContext<DeviceBuildingContextType | undefined>(undefined);

export enum building_state {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Maintenance = "MAINTENANCE",
}

export enum module_state {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Offline = "OFFLINE",
}

export interface Building {
    building_id: string;
    building_name: string;
    owner_id: string;
    address: string;
    added_on: string;
    state: building_state;
}


export interface Module {
    module_id: string;
    module_name: string;
    building_id: string;
    state: module_state;
    // Add other module fields as necessary
}

export default function DeviceBuildingProvider({ children }: { children: ReactNode }) {
    const [modules, setModules] = useState<Module[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchModules = async () => {
        if (!user?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('MODULE')
                .select('*, BUILDING!inner(PROFILE!inner(firebase_uid))')
                .eq('BUILDING.PROFILE.firebase_uid', user.uid);

            if (error) {
                setError(error.message);
            } else {
                const mapped = (data || []).map((m: any) => ({
                    ...m,
                    state: m.state || m.module_state || module_state.Inactive
                }));
                setModules(mapped);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateModule = async (moduleId: string, module: Partial<Module>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('MODULE')
                .update(module)
                .eq('module_id', moduleId)
                .select();
            if (error) {
                throw error;
            }
            if (data) {
                const mappedUpdated = {
                    ...data[0],
                    state: data[0].state || data[0].module_state
                };
                setModules(modules.map(m => m.module_id === moduleId ? { ...m, ...mappedUpdated } : m));
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    const addModule = async (module: Omit<Module, 'module_id'>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('MODULE')
                .insert([{ ...module, module_id: uuid() }])
                .select();
            if (error) throw error;
            if (data) {
                const mappedNew = {
                    ...data[0],
                    state: data[0].state || data[0].module_state || module_state.Inactive
                };
                setModules([...modules, mappedNew]);
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    const registerModule = async (moduleName: string, buildingId: string, phase: number) => {
        setLoading(true);
        setError(null);

        try {
            
            const { data, error } = await client
                .from('MODULE')
                .insert([{ 
                    module_name: moduleName, 
                    building_id: buildingId,
                    phase: phase,
                    module_state: module_state.Active
                }])
                .select();
            if (error) throw error;
            if (data) {
                const mappedNew = {
                    ...data[0],
                    state: data[0].state || data[0].module_state || module_state.Active
                };
                setModules(prev => [...prev, mappedNew]);
            }
        } catch (error: any) {
            console.error("Supabase Insert Error:", error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeModule = async (moduleId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await client
                .from('MODULE')
                .delete()
                .eq('module_id', moduleId);
            if (error) throw error;
            setModules(modules.filter(m => m.module_id !== moduleId));
        } catch (error: any) {
            setError(error.message);
        }
    };

    // Building 
    const fetchBuildings = async () => {
        if (!user?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await client
                .from('BUILDING')
                .select('*, PROFILE!inner(firebase_uid)')
                .eq('PROFILE.firebase_uid', user.uid);

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
    const addBuilding = async (building_name: string, address: string, owner_id: string) => {
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
        <DeviceBuildingContext.Provider value={{ modules, buildings, loading, error, fetchModules, updateModule, addModule, removeModule, fetchBuildings, updateBuilding, addBuilding, removeBuildings, registerModule }}>
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
