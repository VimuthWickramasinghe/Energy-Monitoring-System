/**
 * ============================================================================
 * FRONTEND ALERT DISPLAY GUIDE
 * ============================================================================
 * This guide shows how to display energy alerts in your Next.js frontend
 * using your existing NotificationContext and Socket.io connection.
 * ============================================================================
 */

// ============================================================================
// OPTION 1: USE EXISTING NotificationContext (Simplest)
// ============================================================================

/*
Your NotificationContext already exists and displays notifications
in the bottom-right corner. You can use it directly:

In any component with useNotification hook:

import { useNotification } from "@/lib/NotificationContext";

export function MyComponent() {
  const { addNotification } = useNotification();

  // Trigger an alert
  addNotification("High power consumption detected!", "error", 7000);
  
  return <div>...</div>;
}

Alert Types:
- "error" = Red background (for critical: voltage drop)
- "success" = Green background
- "info" = Blue background

The notification auto-dismisses after 5000ms (5 seconds).
*/

// ============================================================================
// OPTION 2: EXTEND NotificationContext FOR ENERGY ALERTS (Recommended)
// ============================================================================

/*
Update your NotificationContext.tsx to support energy alert metadata:

interface EnergyAlert {
    id: number;
    alertType: "ENERGY_OVERUSE" | "POWER_SPIKE" | "NIGHT_USAGE" | "VOLTAGE_DROP";
    message: string;
    sensorData: any;
    timestamp: Date;
}

interface NotificationContextType {
    notifications: Notification[];
    energyAlerts: EnergyAlert[];
    addNotification: (message: string, type?: "info" | "success" | "error", duration?: number) => void;
    addEnergyAlert: (alert: EnergyAlert) => void;
    removeNotification: (id: number) => void;
    clearEnergyAlerts: () => void;
}

Then in your Socket.io listener:

socket.on('energyAlert', (alert) => {
  addEnergyAlert({
    id: Date.now(),
    alertType: alert.alertType,
    message: alert.message,
    sensorData: alert.sensorData,
    timestamp: new Date()
  });
});
*/

// ============================================================================
// OPTION 3: LISTEN TO SOCKET.IO ALERTS (Direct Implementation)
// ============================================================================

/*
In your DeviceDataProvider or a new AlertProvider:

useEffect(() => {
  if (!socket) return;

  // Listen for energy alerts from backend
  socket.on('energyAlert', (alertData) => {
    const { alertType, message, sensorData } = alertData;
    
    // Determine notification type based on alert severity
    const notificationType = 
      alertType === 'VOLTAGE_DROP' ? 'error' :    // Critical
      alertType === 'POWER_SPIKE' ? 'error' :     // High
      alertType === 'ENERGY_OVERUSE' ? 'error' :  // High
      'info';                                      // Night usage
    
    // Display notification
    addNotification(message, notificationType, 8000);
    
    // Optional: Store in state for alert history
    setRecentAlerts(prev => [alertData, ...prev].slice(0, 10));
  });

  return () => {
    socket.off('energyAlert');
  };
}, [socket, addNotification]);
*/

// ============================================================================
// FLOW DIAGRAM
// ============================================================================

/*
BACKEND FLOW:
Sensor Data ─> processDeviceData ─> alertService.processAlerts
                                         ├─ checkEnergyOveruse
                                         ├─ checkPowerSpike
                                         ├─ checkNightUsage
                                         └─ checkVoltageDrop
                                              │
                                              └─> sendEnergyAlert (EMAIL)
                                              
FRONTEND FLOW:
Socket.io listener receives 'energyAlert' event
                 │
                 ├─> Extract alertType, message, sensorData
                 │
                 ├─> Determine severity
                 │
                 ├─> Add to NotificationContext
                 │
                 ├─> Store in state (optional)
                 │
                 └─> Display in UI
                      ├─ Toast/Notification
                      ├─ Alert History Panel
                      └─ Dashboard Badge
*/

// ============================================================================
// WHAT THE FRONTEND NEEDS TO DO
// ============================================================================

/*
MINIMAL (Required):
1. Socket.io already connects to backend
2. Just add listener: socket.on('energyAlert', (data) => { ... })
3. Display using existing addNotification()

RECOMMENDED:
1. Create AlertProvider.tsx
2. Listen for socket alerts
3. Display toast notifications
4. Show alert history panel
5. Add alert count badge to header

ADVANCED:
1. Persist alerts to localStorage
2. Filter/search alerts
3. Acknowledge/resolve alerts
4. Export alert reports
*/
