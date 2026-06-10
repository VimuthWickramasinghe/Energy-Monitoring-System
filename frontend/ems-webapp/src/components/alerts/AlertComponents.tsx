"use client";

import React, { useState } from "react";
import { useAlert, EnergyAlert } from "@/lib/AlertContext";

interface AlertDisplayProps {
  maxItems?: number;
  showDetails?: boolean;
}

/**
 * AlertPanel Component
 * Displays recent energy alerts in a panel format
 */
export function AlertPanel({
  maxItems = 10,
  showDetails = true,
}: AlertDisplayProps) {
  const { alerts, markAsRead } = useAlert();
  const [expanded, setExpanded] = useState(false);

  const displayedAlerts = alerts.slice(0, maxItems);

  const getAlertColor = (alertType: EnergyAlert["alertType"]) => {
    switch (alertType) {
      case "VOLTAGE_DROP":
        return "border-red-500 bg-red-50";
      case "POWER_SPIKE":
        return "border-orange-500 bg-orange-50";
      case "ENERGY_OVERUSE":
        return "border-yellow-500 bg-yellow-50";
      case "NIGHT_USAGE":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getAlertIcon = (alertType: EnergyAlert["alertType"]) => {
    switch (alertType) {
      case "VOLTAGE_DROP":
        return "🔴";
      case "POWER_SPIKE":
        return "⚡";
      case "ENERGY_OVERUSE":
        return "⚠️";
      case "NIGHT_USAGE":
        return "🌙";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-lg">Energy Alerts</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="max-h-96 overflow-y-auto">
          {displayedAlerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No alerts yet. Stay tuned!
            </div>
          ) : (
            <div className="divide-y">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition ${getAlertColor(
                    alert.alertType
                  )}`}
                  onClick={() => markAsRead(alert.id)}
                >
                  {/* Alert Header */}
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getAlertIcon(alert.alertType)}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {alert.alertType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {/* Sensor Data (if showDetails) */}
                  {showDetails && Object.keys(alert.sensorData).length > 0 && (
                    <div className="mt-2 ml-6 text-xs text-gray-600 bg-white rounded p-2">
                      {alert.sensorData.device_id && (
                        <div>
                          <strong>Device:</strong> {alert.sensorData.device_id}
                        </div>
                      )}
                      {alert.sensorData.real_power && (
                        <div>
                          <strong>Power:</strong> {alert.sensorData.real_power.toFixed(2)} kW
                        </div>
                      )}
                      {alert.sensorData.voltage && (
                        <div>
                          <strong>Voltage:</strong> {alert.sensorData.voltage.toFixed(1)} V
                        </div>
                      )}
                      {alert.sensorData.current && (
                        <div>
                          <strong>Current:</strong> {alert.sensorData.current.toFixed(2)} A
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 ml-6 text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>

                  {/* Read Indicator */}
                  {!alert.read && (
                    <div className="mt-1 ml-6">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AlertBadge Component
 * Shows unread alert count in header
 */
export function AlertBadge() {
  const { unreadCount } = useAlert();

  if (unreadCount === 0) return null;

  return (
    <div className="relative inline-block">
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? "9+" : unreadCount}
      </div>
    </div>
  );
}

/**
 * AlertSummary Component
 * Shows brief summary of recent alerts
 */
export function AlertSummary() {
  const { alerts, unreadCount } = useAlert();

  const alertCounts = {
    ENERGY_OVERUSE: alerts.filter((a) => a.alertType === "ENERGY_OVERUSE").length,
    POWER_SPIKE: alerts.filter((a) => a.alertType === "POWER_SPIKE").length,
    NIGHT_USAGE: alerts.filter((a) => a.alertType === "NIGHT_USAGE").length,
    VOLTAGE_DROP: alerts.filter((a) => a.alertType === "VOLTAGE_DROP").length,
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {alertCounts.ENERGY_OVERUSE > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="text-lg">⚠️</div>
          <div className="text-xs font-semibold">Overuse: {alertCounts.ENERGY_OVERUSE}</div>
        </div>
      )}
      {alertCounts.POWER_SPIKE > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded p-2">
          <div className="text-lg">⚡</div>
          <div className="text-xs font-semibold">Spike: {alertCounts.POWER_SPIKE}</div>
        </div>
      )}
      {alertCounts.NIGHT_USAGE > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <div className="text-lg">🌙</div>
          <div className="text-xs font-semibold">Night: {alertCounts.NIGHT_USAGE}</div>
        </div>
      )}
      {alertCounts.VOLTAGE_DROP > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <div className="text-lg">🔴</div>
          <div className="text-xs font-semibold">Critical: {alertCounts.VOLTAGE_DROP}</div>
        </div>
      )}
      <div className="col-span-2 bg-gray-100 rounded p-2 text-center">
        <div className="text-xs text-gray-600">
          <strong>{unreadCount}</strong> unread alert{unreadCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

/**
 * AlertTimeline Component
 * Shows alerts in chronological order
 */
export function AlertTimeline() {
  const { alerts } = useAlert();

  if (alerts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No alerts to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.slice(0, 20).map((alert, index) => (
        <div key={alert.id} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                alert.alertType === "VOLTAGE_DROP"
                  ? "bg-red-500"
                  : alert.alertType === "POWER_SPIKE"
                  ? "bg-orange-500"
                  : alert.alertType === "ENERGY_OVERUSE"
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }`}
            ></div>
            {index < alerts.length - 1 && <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>}
          </div>

          {/* Alert content */}
          <div className="pb-4">
            <p className="font-semibold text-sm">{alert.alertType.replace(/_/g, " ")}</p>
            <p className="text-sm text-gray-600">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {alert.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
