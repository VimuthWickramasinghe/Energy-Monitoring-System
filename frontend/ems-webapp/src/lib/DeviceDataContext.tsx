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

    // ========================================================================
    // REAL-TIME WEBSOCKET LIFECYCLE & EVENT BINDING
    // ========================================================================
    // We establish a persistent Socket.io connection when the user authenticates,
    // and clean it up when they sign out or when their registered modules change.
    useEffect(() => {
        // If authentication or buildings/modules database lists are still loading,
        // wait until they resolve to ensure we have the correct user and module IDs context.
        if (authLoading || buildingLoading) return;

        let socket: ReturnType<typeof io> | null = null;

        if (user) {
            // 1. Fetch initial historical database records from MongoDB.
            // This populates the charts and tables on page load.
            fetchDevices();
            fetchMongoDemoData();

            // 2. Determine WebSocket server URL dynamically:
            // - If the website is loaded locally or on a local area network (LAN) for development/testing, connect to the local IP/port 8080.
            // - If it is running on a public production domain (e.g. keyblocks.org, Vercel, Netlify, custom domains), connect to NEXT_PUBLIC_BACKEND_URL.
            const isLocal = typeof window !== "undefined" && (
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1" ||
                window.location.hostname.startsWith("192.168.") ||
                window.location.hostname.startsWith("10.") ||
                window.location.hostname.startsWith("172.16.") ||
                window.location.hostname.startsWith("172.31.") ||
                window.location.hostname.endsWith(".local")
            );

            const socketUrl = isLocal
                ? `http://${window.location.hostname}:8080`
                : (BACKEND_URL || "http://localhost:8080");

            // 3. Instantiate the Socket.io client connection.
            // This opens a persistent TCP-based WebSocket connection to the backend.
            socket = io(socketUrl);

            // Log connection state for debugging
            socket.on("connect", () => {
                console.log("Connected to backend WebSocket for live data");
            });

            // 4. Register event listener for 'deviceData' broadcasts from the backend.
            // This is triggered whenever a physical device publishes telemetry to the backend.
            socket.on("deviceData", (newData: DeviceData) => {
                console.log("Live data received via WebSocket:", newData);
                
                // Update general historical demo data list
                setMongoDemoData((prev) => [newData, ...prev].slice(0, 100));
                
                // Only process and react to the telemetry packet if it belongs to one of the user's modules
                const moduleIds = modules.map(m => m.module_id);
                if (moduleIds.includes(newData.device_id) || moduleIds.length > 0) {
                    // PROTOTYPE FALLBACK:
                    // If the hardware device transmits a test ID (e.g. ems-esm-test) that isn't explicitly
                    // registered in Supabase under this user, map it to the user's first module so the user
                    // can see live readings on their cards.
                    const mappedData = moduleIds.includes(newData.device_id) 
                        ? newData 
                        : { ...newData, device_id: moduleIds[0] };

                    // Prepend the new telemetry reading to the state array.
                    // Since the array is stateful, this instantly updates the UI in all consuming pages (like analytics)
                    // without any page reloads or API polling. We slice it to keep the last 100 readings.
                    setDevices((prevDevices) => [mappedData, ...prevDevices].slice(0, 100));
                }
            });

            // Log disconnection for debugging
            socket.on("disconnect", () => {
                console.log("Disconnected from backend WebSocket");
            });

        } else {
            // Clear state if the user signs out
            setDevices([]);
            setLoadingDevices(false);
            setError(null);
        }

        // ====================================================================
        // CLEANUP FUNCTION
        // ====================================================================
        // This runs when the component unmounts, or when user or modules change.
        // It disconnects the WebSocket client to prevent socket leaks, duplicate
        // subscription bindings, and high memory usage.
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
