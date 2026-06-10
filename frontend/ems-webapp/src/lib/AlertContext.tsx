"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNotification } from "@/lib/NotificationContext";
import { io } from "socket.io-client";

export interface EnergyAlert {
  id: string;
  alertType: "ENERGY_OVERUSE" | "POWER_SPIKE" | "NIGHT_USAGE" | "VOLTAGE_DROP";
  message: string;
  sensorData: {
    device_id?: string;
    voltage?: number;
    current?: number;
    real_power?: number;
    apparent_power?: number;
    power_factor?: number;
  };
  timestamp: Date;
  read: boolean;
}

interface AlertContextType {
  alerts: EnergyAlert[];
  unreadCount: number;
  addAlert: (alert: Omit<EnergyAlert, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  clearAlerts: () => void;
  getAlertsByType: (type: EnergyAlert["alertType"]) => EnergyAlert[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<EnergyAlert[]>([]);
  const { addNotification } = useNotification();

  const addAlert = useCallback(
    (alert: Omit<EnergyAlert, "id" | "timestamp" | "read">) => {
      const newAlert: EnergyAlert = {
        ...alert,
        id: `${alert.alertType}-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50)); // Keep last 50

      // Determine severity and show notification
      const severityMap: Record<EnergyAlert["alertType"], "error" | "error" | "error" | "error"> = {
        VOLTAGE_DROP: "error",
        POWER_SPIKE: "error",
        ENERGY_OVERUSE: "error",
        NIGHT_USAGE: "error",
      };

      addNotification(alert.message, severityMap[alert.alertType], 8000);
    },
    [addNotification]
  );

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getAlertsByType = useCallback(
    (type: EnergyAlert["alertType"]) => {
      return alerts.filter((alert) => alert.alertType === type);
    },
    [alerts]
  );

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        addAlert,
        markAsRead,
        clearAlerts,
        getAlertsByType,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
};
