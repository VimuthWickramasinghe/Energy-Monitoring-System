"use client";

import { useEffect } from "react";
import { useAlert, EnergyAlert } from "@/lib/AlertContext";
import { io, Socket } from "socket.io-client";

// Get backend URL (same as DeviceDataContext)
const getBackendUrl = () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (
    !BACKEND_URL ||
    BACKEND_URL.includes("esmb.keyblocks.org") ||
    BACKEND_URL.includes("emsb.keyblocks.org")
  ) {
    return "https://ems-backend-475776935743.asia-southeast1.run.app";
  }
  return BACKEND_URL;
};

/**
 * Hook to listen for energy alerts from the backend via Socket.io
 * Call this in your root layout or a provider component
 */
export function useAlertListener() {
  const { addAlert } = useAlert();

  useEffect(() => {
    const backendUrl = getBackendUrl();
    let socket: Socket | null = null;

    try {
      socket = io(backendUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // When a connection is established
      socket.on("connect", () => {
        console.log("[Alert Listener] Connected to backend");
      });

      // Listen for energy alerts
      socket.on("energyAlert", (alertData: any) => {
        console.log("[Alert Listener] Received alert:", alertData);

        try {
          addAlert({
            alertType: alertData.alertType,
            message: alertData.message,
            sensorData: alertData.sensorData || {},
          });
        } catch (error) {
          console.error("[Alert Listener] Error adding alert:", error);
        }
      });

      // Legacy fallback: listen for deviceData and check thresholds client-side if needed
      socket.on("deviceData", (data: any) => {
        console.log("[Alert Listener] Received device data:", data);
        // Optional: Add client-side threshold checks here
      });

      socket.on("error", (error: any) => {
        console.error("[Alert Listener] Socket error:", error);
      });

      socket.on("disconnect", () => {
        console.log("[Alert Listener] Disconnected from backend");
      });
    } catch (error) {
      console.error("[Alert Listener] Failed to initialize socket:", error);
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [addAlert]);
}

/**
 * Optional: Client-side alert validation
 * Use this if you want to verify thresholds on the frontend as well
 */
export function validateAlertThresholds(
  deviceData: any,
  thresholds?: {
    energyOveruse?: number;
    powerSpike?: number;
    nightUsage?: number;
    voltageDrop?: number;
  }
) {
  const defaults = {
    energyOveruse: 5,
    powerSpike: 50,
    nightUsage: 1,
    voltageDrop: 210,
  };

  const config = { ...defaults, ...thresholds };
  const alerts: Partial<EnergyAlert>[] = [];

  // Energy Overuse Check
  if (deviceData.real_power > config.energyOveruse) {
    alerts.push({
      alertType: "ENERGY_OVERUSE",
      message: `High energy consumption: ${deviceData.real_power.toFixed(2)} kW (threshold: ${config.energyOveruse} kW)`,
      sensorData: deviceData,
    });
  }

  // Voltage Drop Check
  if (deviceData.voltage && deviceData.voltage < config.voltageDrop) {
    alerts.push({
      alertType: "VOLTAGE_DROP",
      message: `CRITICAL: Low voltage detected: ${deviceData.voltage.toFixed(1)} V (min: ${config.voltageDrop} V)`,
      sensorData: deviceData,
    });
  }

  // Night Usage Check
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5 && deviceData.real_power > config.nightUsage) {
    alerts.push({
      alertType: "NIGHT_USAGE",
      message: `Unusual night usage: ${deviceData.real_power.toFixed(2)} kW at ${new Date().toLocaleTimeString()}`,
      sensorData: deviceData,
    });
  }

  return alerts;
}
