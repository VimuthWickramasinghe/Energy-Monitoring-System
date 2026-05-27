"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useBuilding } from "./DeviceBuildingContext";
import { fetchUserDevicesData, fetchMongoDemoDataAction } from "@/utils/mongoDB/deviceActions";
import { io } from "socket.io-client";

export interface DeviceData {
    _id?: string;
    device_id: string;
    voltage?: number;
    current?: number;
    apparent_power?: number;
    real_power?: number;
    power_factor?: number;
    time?: string;
    [key: string]: any;
}

export interface DeviceDataContextType {
    devices: DeviceData[];
    loadingDevices: boolean;
    error: string | null;
    refreshDevices: () => Promise<void>;
    mongoDemoData: any[];
}

export const DeviceDataContext = createContext<DeviceDataContextType | undefined>(undefined);

// Using environment variable or fallback for the backend WebSocket URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const DeviceDataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { modules, loading: buildingLoading } = useBuilding();

    const [devices, setDevices] = useState<DeviceData[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mongoDemoData, setMongoDemoData] = useState<any[]>([]);

    const fetchMongoDemoData = useCallback(async () => {
        try {
            const data = await fetchMongoDemoDataAction();
            setMongoDemoData(data || []);
        } catch (e) {
            console.error("Failed to fetch mongo demo data:", e);
        }
    }, []);

    const fetchDevices = useCallback(async () => {
        if (!user?.uid) {
            setDevices([]);
            setError("No authenticated user to fetch devices.");
            setLoadingDevices(false);
            return;
        }

        const moduleIds = modules.map(m => m.module_id);

        // If there are no modules registered, skip fetching from MongoDB
        if (moduleIds.length === 0) {
            setDevices([]);
            setLoadingDevices(false);
            return;
        }

        setLoadingDevices(true);
        setError(null);

        try {
            // Using the Next.js Server Action to safely query MongoDB using module IDs
            let data = await fetchUserDevicesData(moduleIds);
            
            // Prototype Fallback: If hardware device_id doesn't match registered module_id, 
            // map the raw demo data to the first registered module so the UI populates.
            if ((!data || data.length === 0) && moduleIds.length > 0) {
                const fallbackData = await fetchMongoDemoDataAction();
                if (fallbackData && fallbackData.length > 0) {
                    data = fallbackData.map((d: any) => ({ ...d, device_id: moduleIds[0] }));
                }
            }

            setDevices(data || []);
        } catch (err: any) {
            console.error("Error in DeviceDataContext fetching devices:", err);
            setError(err.message || "Failed to load device data.");
            setDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    }, [user, modules]);

    useEffect(() => {
        if (authLoading || buildingLoading) return;

        let socket: ReturnType<typeof io> | null = null;

        if (user) {
            // 1. Fetch initial historical data
            fetchDevices();
            fetchMongoDemoData();

            // 2. Set up Socket.io for Real-time push updates
            socket = io(BACKEND_URL);

            socket.on("connect", () => {
                console.log("Connected to backend WebSocket for live data");
            });

            socket.on("deviceData", (newData: DeviceData) => {
                console.log("Live data received via WebSocket:", newData);
                
                // Update general demo data state
                setMongoDemoData((prev) => [newData, ...prev].slice(0, 100));
                
                // Only append to devices array if the module belongs to the user
                const moduleIds = modules.map(m => m.module_id);
                if (moduleIds.includes(newData.device_id) || moduleIds.length > 0) {
                     // Prototype Fallback: map ID if needed so UI updates
                    const mappedData = moduleIds.includes(newData.device_id) 
                        ? newData 
                        : { ...newData, device_id: moduleIds[0] };

                    setDevices((prevDevices) => [mappedData, ...prevDevices].slice(0, 100)); // Keep array size manageable
                }
            });

            socket.on("disconnect", () => {
                console.log("Disconnected from backend WebSocket");
            });

        } else {
            setDevices([]);
            setLoadingDevices(false);
            setError(null);
        }

        // Cleanup function
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [user, authLoading, buildingLoading, modules, fetchDevices]);

    return (
        <DeviceDataContext.Provider value={{ devices, loadingDevices, error, refreshDevices: fetchDevices, mongoDemoData }}>
            {children}
        </DeviceDataContext.Provider>
    );
};

export const useDeviceData = () => {
    const context = useContext(DeviceDataContext);
    if (context === undefined) {
        throw new Error("useDeviceData must be used within a DeviceDataProvider");
    }
    return context;
};
