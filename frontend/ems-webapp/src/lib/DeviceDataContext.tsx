"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useBuilding } from "./DeviceBuildingContext";
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
    deleteAllData: () => Promise<any>;
    mongoDemoData: any[];
    clockSkew: number;
}

export const DeviceDataContext = createContext<DeviceDataContextType | undefined>(undefined);

// Using environment variable or fallback for the backend URL
const BACKEND_URL = process.env.BACKEND_URL;

const getBackendUrl = () => {
    // Fallback to the active deployed Cloud Run backend URL if BACKEND_URL
    // is missing or points to the unresolved keyblocks domain placeholder.
    if (!BACKEND_URL || BACKEND_URL.includes("esmb.keyblocks.org") || BACKEND_URL.includes("emsb.keyblocks.org")) {
        return "https://ems-backend-475776935743.asia-southeast1.run.app";
    }
    return BACKEND_URL;
};

export const DeviceDataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { modules, loading: buildingLoading } = useBuilding();

    const [devices, setDevices] = useState<DeviceData[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mongoDemoData, setMongoDemoData] = useState<any[]>([]);
    const [clockSkew, setClockSkew] = useState(0);

    const fetchMongoDemoData = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const apiBaseUrl = getBackendUrl();
            const res = await fetch(`${apiBaseUrl}/history?limit=100`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch mongo demo data: ${res.statusText}`);
            }

            const serverDate = res.headers.get("Date");
            if (serverDate) {
                setClockSkew(Date.now() - new Date(serverDate).getTime());
            }

            const data = await res.json();
            setMongoDemoData(data || []);
        } catch (e) {
            console.error("Failed to fetch mongo demo data:", e);
        }
    }, [user]);

    const fetchDevices = useCallback(async () => {
        if (!user?.uid) {
            setDevices([]);
            setError("No authenticated user to fetch devices.");
            setLoadingDevices(false);
            return;
        }

        const moduleIds = modules.map(m => m.module_id);

        // If there are no modules registered, skip fetching from backend
        if (moduleIds.length === 0) {
            setDevices([]);
            setLoadingDevices(false);
            return;
        }

        setLoadingDevices(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const apiBaseUrl = getBackendUrl();
            const res = await fetch(`${apiBaseUrl}/history?limit=1000`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch history: ${res.statusText}`);
            }

            const serverDate = res.headers.get("Date");
            if (serverDate) {
                setClockSkew(Date.now() - new Date(serverDate).getTime());
            }

            const historyData = await res.json();

            // Filter the returned JSON to only contain items matching user's moduleIds
            let data = (historyData || []).filter((item: any) =>
                moduleIds.includes(item.device_id)
            );

            // Prototype Fallback: If hardware device_id doesn't match registered module_id, 
            // map the raw demo data to the first registered module so the UI populates.
            if ((!data || data.length === 0) && moduleIds.length > 0) {
                if (historyData && historyData.length > 0) {
                    data = historyData.map((d: any) => ({ ...d, device_id: moduleIds[0] }));
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

    const deleteAllData = useCallback(async () => {
        if (!user) {
            throw new Error("You must be logged in to perform this action.");
        }

        const token = await user.getIdToken();
        const response = await fetch('/api/mongo/delete', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setDevices([]);
            setMongoDemoData([]);
            return result.data;
        } else {
            throw new Error(result.error || "Failed to delete data.");
        }
    }, [user]);

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
            // 1. Fetch initial historical database records from backend.
            // This populates the charts and tables on page load.
            fetchDevices();
            fetchMongoDemoData();

            // 2. Determine WebSocket server URL dynamically:
            const socketUrl = getBackendUrl();

            // 3. Instantiate the Socket.io client connection.
            // This opens a persistent TCP-based WebSocket connection to the backend.
            // We force 'websocket' as the only transport. This bypasses the default HTTP long-polling
            // handshake upgrade stage, preventing "Session ID unknown" or 400 Bad Request handshake errors
            // when deployed on containerized serverless hosting like Google Cloud Run (which routes multi-request polls across different instances).
            socket = io(socketUrl, {
                transports: ['websocket'],
                upgrade: false
            });

            // Log connection state for debugging
            socket.on("connect", () => {
                console.log("Connected to backend WebSocket for live data");
            });

            // 4. Register event listener for 'deviceData' broadcasts from the backend.
            // This is triggered whenever a physical device publishes telemetry to the backend.
            socket.on("deviceData", (newData: DeviceData) => {
                console.log("Live data received via WebSocket:", newData);

                // Update general historical demo data list (keep up to 1000 items)
                setMongoDemoData((prev) => [newData, ...prev].slice(0, 1000));

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
                    // without any page reloads or API polling. We slice it to keep the last 1000 readings to preserve history.
                    setDevices((prevDevices) => [mappedData, ...prevDevices].slice(0, 1000));
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
    }, [user, authLoading, buildingLoading, modules, fetchDevices, fetchMongoDemoData]);

    return (
        <DeviceDataContext.Provider value={{ devices, loadingDevices, error, refreshDevices: fetchDevices, deleteAllData, mongoDemoData, clockSkew }}>
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
