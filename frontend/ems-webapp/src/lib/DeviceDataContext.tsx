"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useBuilding } from "./DeviceBuildingContext";
import { fetchUserDevicesData } from "../app/actions/deviceActions";

export interface DeviceData {
    _id?: string;
    device_id: string;
    voltage?: number;
    current?: number;
    power?: number;
    time?: string;
    [key: string]: any;
}

export interface DeviceDataContextType {
    devices: DeviceData[];
    loadingDevices: boolean;
    error: string | null;
    refreshDevices: () => Promise<void>;
}

export const DeviceDataContext = createContext<DeviceDataContextType | undefined>(undefined);

export const DeviceDataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { modules, loading: buildingLoading } = useBuilding();

    const [devices, setDevices] = useState<DeviceData[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            const data = await fetchUserDevicesData(moduleIds);
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

        if (user) {
            fetchDevices();

            // Set a polling interval to periodically refresh data, 
            // especially useful if device data is initially empty.
            const interval = setInterval(() => {
                fetchDevices();
            }, 15000); // Refresh every 15 seconds

            return () => clearInterval(interval);
        } else {
            setDevices([]);
            setLoadingDevices(false);
            setError(null);
        }
    }, [user, authLoading, buildingLoading, modules, fetchDevices]);

    return (
        <DeviceDataContext.Provider value={{ devices, loadingDevices, error, refreshDevices: fetchDevices }}>
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

