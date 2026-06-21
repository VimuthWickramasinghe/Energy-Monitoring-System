# Alert System: Complete Flow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENERGY MONITORING SYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐         ┌──────────────────┐                  │
│  │   ESP32/IoT    │         │   MQTT Broker    │                  │
│  │   Sensors      │────────→│                  │                  │
│  └────────────────┘         └──────────────────┘                  │
│                                     │                              │
│                                     ↓                              │
│       ┌─────────────────────────────────────────────────────────┐ │
│       │            BACKEND (Node.js)                          │ │
│       │  ┌─────────────────────────────────────────────────┐  │ │
│       │  │  server.js                                      │  │ │
│       │  │  - Receives MQTT/HTTP sensor data              │  │ │
│       │  │  - Calls processDeviceData()                   │  │ │
│       │  │  - Triggers alertService.processAlerts()       │  │ │
│       │  └─────────────────────────────────────────────────┘  │ │
│       │                        │                               │ │
│       │                        ↓                               │ │
│       │  ┌─────────────────────────────────────────────────┐  │ │
│       │  │  alertService.js                                │  │ │
│       │  │  ✓ checkEnergyOveruse()                         │  │ │
│       │  │  ✓ checkPowerSpike()                            │  │ │
│       │  │  ✓ checkNightUsage()                            │  │ │
│       │  │  ✓ checkVoltageDrop()                           │  │ │
│       │  └─────────────────────────────────────────────────┘  │ │
│       │                        │                               │ │
│       │           ┌────────────┴────────────┐                 │ │
│       │           ↓                         ↓                 │ │
│       │    ┌────────────────┐      ┌──────────────────────┐  │ │
│       │    │ sendEnergyAlert│      │ io.emit('energy     │  │ │
│       │    │  (Email)       │      │  Alert', {...})     │  │ │
│       │    └────────────────┘      └──────────────────────┘  │ │
│       │           │                         │                 │ │
│       │           ↓                         ↓                 │ │
│       │    ┌────────────────┐      ┌──────────────────────┐  │ │
│       │    │   Gmail SMTP   │      │   Socket.io Emit    │  │ │
│       │    │  (Notification)│      │  (Real-time to FE)  │  │ │
│       │    └────────────────┘      └──────────────────────┘  │ │
│       └─────────────────────────────────────────────────────────┘ │
│                                     │                              │
│                                     ↓                              │
│       ┌─────────────────────────────────────────────────────────┐ │
│       │       WebSocket Connection (Socket.io)                │ │
│       └─────────────────────────────────────────────────────────┘ │
│                                     │                              │
│                                     ↓                              │
│       ┌─────────────────────────────────────────────────────────┐ │
│       │            FRONTEND (Next.js React)                    │ │
│       │  ┌─────────────────────────────────────────────────┐  │ │
│       │  │  useAlertListener.ts (Hook)                     │  │ │
│       │  │  - socket.on('energyAlert', (data) => {...})   │  │ │
│       │  │  - Calls addAlert() from AlertContext           │  │ │
│       │  └─────────────────────────────────────────────────┘  │ │
│       │                        │                               │ │
│       │                        ↓                               │ │
│       │  ┌─────────────────────────────────────────────────┐  │ │
│       │  │  AlertContext.tsx                               │  │ │
│       │  │  - Manages alert state                          │  │ │
│       │  │  - Triggers toast notification                  │  │ │
│       │  │  - Stores in memory (limit 50)                  │  │ │
│       │  └─────────────────────────────────────────────────┘  │ │
│       │                        │                               │ │
│       │           ┌────────────┴───────────┐                  │ │
│       │           ↓                        ↓                  │ │
│       │  ┌─────────────────────┐  ┌────────────────────────┐ │ │
│       │  │ NotificationContext │  │ AlertComponents.tsx    │ │ │
│       │  │ (Toast Display)     │  │ - AlertPanel           │ │ │
│       │  │                     │  │ - AlertBadge           │ │ │
│       │  │ (bottom-right)      │  │ - AlertTimeline        │ │ │
│       │  └─────────────────────┘  │ - AlertSummary         │ │ │
│       │           │                └────────────────────────┘ │ │
│       │           ↓                        │                  │ │
│       │   Toast Appears              UI Components Update     │ │
│       │   ▼──────────────────────────▼                        │ │
│       │  [⚠️ Energy Overuse Alert]  ▼ [Alerts Badge: 5]      │ │
│       │  Power: 6.5 kW (threshold 5)│ ▼ [Alert Panel]        │ │
│       │                             │ ▼ [Alert Timeline]     │ │
│       └─────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Alert Flow Timeline

### When New Sensor Data Arrives:

```
1. ESP32/IoT Sensor ──→ MQTT Broker ──→ Backend
   └─ Sends: { voltage, current, real_power, ... }

2. Backend (server.js)
   ├─ Receives via MQTT or HTTP POST
   ├─ Calls processDeviceData(payload)
   └─ Saves to MongoDB

3. Alert Processing
   ├─ Calls alertService.processAlerts(currentData, previousData)
   └─ Checks all 4 alert conditions in parallel:
       ├─ checkEnergyOveruse() ─→ if real_power > threshold
       ├─ checkPowerSpike() ────→ if power_increase > threshold %
       ├─ checkNightUsage() ────→ if power > threshold between 12-5 AM
       └─ checkVoltageDrop() ───→ if voltage < 210V

4. If Alert Triggered:
   ├─ sendEnergyAlert(type, message, sensorData)
   │  ├─ Sends email via Gmail SMTP
   │  └─ Logs to console
   └─ io.emit('energyAlert', { alertType, message, sensorData })

5. Frontend Receives Socket.io Event:
   ├─ useAlertListener hook catches 'energyAlert'
   ├─ Calls addAlert() from AlertContext
   ├─ AddNotification() called from NotificationContext
   └─ Updates UI components

6. User Sees:
   ├─ Toast notification (bottom-right) ─→ Auto-dismisses in 5-8 seconds
   ├─ Alert badge updates (top-right) ──→ Shows unread count
   ├─ Alert panel updates ──────────────→ New alert added to list
   └─ Alert timeline ──────────────────→ New entry in history
```

## Data Structure Flow

### Backend Alert Emission:

```javascript
// Backend sends this via Socket.io:
{
  alertType: "ENERGY_OVERUSE" | "POWER_SPIKE" | "NIGHT_USAGE" | "VOLTAGE_DROP",
  message: "High energy consumption detected!",
  sensorData: {
    device_id: "ems-esm-test",
    voltage: 220.5,
    current: 12.3,
    real_power: 6.5,      // kW
    apparent_power: 7.0,  // kVA
    power_factor: 0.92
  },
  timestamp: "2026-06-10T14:30:00Z"
}
```

### Frontend Stores As:

```typescript
interface EnergyAlert {
  id: string;                    // auto-generated: "ENERGY_OVERUSE-1234567890"
  alertType: "ENERGY_OVERUSE";
  message: string;
  sensorData: {
    device_id?: string;
    voltage?: number;
    current?: number;
    real_power?: number;
    apparent_power?: number;
    power_factor?: number;
  };
  timestamp: Date;               // parsed from backend
  read: boolean;                 // user interaction
}
```

## Component Rendering Flow

```
Root Layout
├─ NotificationProvider
│  └─ Shows toast notifications
│
└─ AlertProvider
   └─ Manages alert state
      │
      └─ Dashboard Component
         ├─ useAlertListener()
         │  └─ Listens for Socket.io 'energyAlert'
         │
         ├─ Header
         │  └─ <AlertBadge />  ←── Shows unread count
         │
         ├─ Main Content
         │  └─ <AlertPanel />  ←── Shows collapsible alert list
         │
         └─ Optional:
            ├─ <AlertSummary />    ←── Grid view of alert counts
            └─ <AlertTimeline />   ←── Chronological view
```

## Alert Threshold Configuration

```
┌────────────────────────────────────────────────────────────────┐
│              Alert Type Thresholds (Configurable)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. ENERGY OVERUSE ALERT                                       │
│     Trigger: real_power > 5 kW (default)                      │
│     Color: 🟨 Yellow / Orange                                 │
│                                                                │
│  2. POWER SPIKE ALERT                                          │
│     Trigger: power_increase > 50% (default)                   │
│     Color: ⚡ Orange                                           │
│                                                                │
│  3. NIGHT USAGE ALERT                                          │
│     Trigger: real_power > 1 kW (default)                      │
│            && time between 12 AM - 5 AM                       │
│     Color: 🌙 Blue                                            │
│                                                                │
│  4. VOLTAGE DROP ALERT (CRITICAL)                              │
│     Trigger: voltage < 210 V (default)                        │
│     Color: 🔴 Red (most severe)                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Notification Display Examples

### Toast Notification (Auto-dismiss):
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Energy Overuse Alert                      × │
│ Power: 6.5 kW (threshold: 5 kW)                │
│                                                 │
│ [Auto-dismisses in 8 seconds]                   │
└─────────────────────────────────────────────────┘
```

### Alert Panel (Expandable):
```
┌──────────────────────────────────┐
│ Energy Alerts                 [−] │
├──────────────────────────────────┤
│                                  │
│ ⚠️  ENERGY_OVERUSE               │ ← Click to read
│ High energy consumption detected! │
│ Device: ems-esm-test             │
│ Power: 6.5 kW                    │
│ 2:30:45 PM                       │
│ ● (unread indicator)             │
│                                  │
│ ⚡ POWER_SPIKE                    │
│ Sudden power spike detected!      │
│ Previous: 2 kW → Current: 5 kW   │
│ 2:29:12 PM                       │
│                                  │
│ 🔴 VOLTAGE_DROP (CRITICAL)        │
│ CRITICAL: Low voltage detected    │
│ Voltage: 200V (min: 210V)         │
│ 2:15:00 PM                       │
│                                  │
└──────────────────────────────────┘
```

### Badge on Header:
```
🔔 (notification icon)
  5  ← Red badge with unread count
```

## Deployment Checklist

```
Backend:
  ☐ alertService.js created
  ☐ server.js updated with alert integration
  ☐ .env.local has EMAIL_USER, EMAIL_PASS, ALERT_EMAIL_RECIPIENT
  ☐ Socket.io emitting 'energyAlert' events
  ☐ Tested with curl commands
  
Frontend:
  ☐ AlertContext.tsx created
  ☐ useAlertListener.ts created
  ☐ AlertComponents.tsx created
  ☐ AlertProvider wrapped in root layout
  ☐ useAlertListener() called in dashboard
  ☐ Alert components added to UI
  ☐ .env has correct BACKEND_URL
  ☐ Socket.io connection verified in browser console
  
Integration:
  ☐ Backend and frontend deployed
  ☐ Testing with real/mock sensor data
  ☐ Email alerts working
  ☐ Frontend alerts displaying
  ☐ Notifications appearing correctly
  ☐ User testing completed
```

---

**Key Points:**
- 📧 Backend sends alerts both via EMAIL and Socket.io
- 🔔 Frontend displays via toast + panels + badges
- ⚡ Real-time updates via Socket.io WebSocket
- 📊 4 different alert types with color coding
- ✅ Context-based state management
- 🎨 Fully customizable components
