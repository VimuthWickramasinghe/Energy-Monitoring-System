# Frontend Alert Integration Guide

## Overview

Display energy alerts in your Next.js frontend with automatic Socket.io listening and beautiful UI components.

## Files Created

- **`AlertContext.tsx`** - Context for managing alert state
- **`useAlertListener.ts`** - Hook to listen for Socket.io alerts
- **`AlertComponents.tsx`** - Reusable display components
- **`FRONTEND_ALERTS_GUIDE.md`** - Detailed guide (this file)

## Quick Integration (3 Steps)

### Step 1: Wrap App with Providers

Update your root layout (`src/app/layout.tsx`):

```tsx
import { AlertProvider } from "@/lib/AlertContext";
import { NotificationProvider } from "@/lib/NotificationContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <NotificationProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
```

### Step 2: Initialize Alert Listener

In your dashboard or main component:

```tsx
"use client";

import { useAlertListener } from "@/hooks/useAlertListener";
import { AlertBadge, AlertPanel } from "@/components/alerts/AlertComponents";

export default function Dashboard() {
  // This hook connects to backend and listens for alerts
  useAlertListener();

  return (
    <div>
      {/* Your dashboard content */}
      
      {/* Add alert components */}
      <div className="fixed top-4 right-4">
        <AlertBadge />
      </div>
      
      <AlertPanel maxItems={10} showDetails={true} />
    </div>
  );
}
```

### Step 3: Backend Changes Required

In your backend `server.js`, emit alerts to frontend via Socket.io:

```javascript
// In alertService.js, after successful email send:
io.emit('energyAlert', {
  alertType,
  message,
  sensorData
});

// OR in server.js in processDeviceData after processing alerts:
// The alerts will automatically be emitted
```

## Components Available

### 1. **AlertPanel** - Main Alert Display

```tsx
import { AlertPanel } from "@/components/alerts/AlertComponents";

export function MyComponent() {
  return (
    <AlertPanel 
      maxItems={10}           // Show last 10 alerts
      showDetails={true}      // Show sensor data details
    />
  );
}
```

**Features:**
- Collapsible panel
- Color-coded by alert type
- Shows sensor readings
- Click to mark as read
- Auto-scrolls overflow

### 2. **AlertBadge** - Unread Count Badge

```tsx
import { AlertBadge } from "@/components/alerts/AlertComponents";

export function Header() {
  return (
    <div className="fixed top-4 right-4">
      <AlertBadge />  {/* Shows red badge with count */}
    </div>
  );
}
```

### 3. **AlertSummary** - Grid Summary

```tsx
import { AlertSummary } from "@/components/alerts/AlertComponents";

export function Dashboard() {
  return (
    <div className="p-4">
      <AlertSummary />  {/* 2x2 grid of alert counts */}
    </div>
  );
}
```

### 4. **AlertTimeline** - Chronological View

```tsx
import { AlertTimeline } from "@/components/alerts/AlertComponents";

export function AlertHistory() {
  return (
    <div className="p-4">
      <h2>Alert Timeline</h2>
      <AlertTimeline />  {/* Vertical timeline of alerts */}
    </div>
  );
}
```

## Using the Alert Context

Access alerts anywhere with the `useAlert` hook:

```tsx
import { useAlert } from "@/lib/AlertContext";

export function MyComponent() {
  const {
    alerts,           // Array of all alerts
    unreadCount,      // Number of unread alerts
    addAlert,         // Manually add alert
    markAsRead,       // Mark alert as read
    clearAlerts,      // Clear all alerts
    getAlertsByType   // Filter alerts by type
  } = useAlert();

  // Get only critical alerts
  const criticalAlerts = getAlertsByType("VOLTAGE_DROP");

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <p>Total: {alerts.length}</p>
    </div>
  );
}
```

## Socket.io Connection Flow

```
Backend (alertService.js)
    ↓
Detects Alert Condition
    ↓
Sends Email (optional)
    ↓
Emits via Socket.io:
io.emit('energyAlert', { alertType, message, sensorData })
    ↓
Frontend (useAlertListener hook)
    ↓
Receives socket event
    ↓
Calls addAlert()
    ↓
Context updates state
    ↓
UI Components re-render
    ↓
User sees notification + panel update
```

## Backend Socket.io Implementation

Add this to your `server.js` to emit alerts:

```javascript
// At the top with other imports:
let io = null;  // Will be set when server starts

// In your Socket.io setup:
io = new Server(server, {
  cors: { /* your cors config */ }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
});

// In alertService.js, modify sendEnergyAlert to also emit:
async function sendEnergyAlert(alertType, message, sensorData = {}) {
  try {
    // ... existing email code ...
    
    // ALSO emit to frontend via Socket.io
    if (io) {
      io.emit('energyAlert', {
        alertType,
        message,
        sensorData,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('[Alert Service] Error:', error.message);
    return false;
  }
}

// Export io so alertService can use it
module.exports = { io };
```

## Display Locations

### Option 1: Dashboard Widget
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <AlertSummary />
  <div>Main Dashboard</div>
</div>
```

### Option 2: Floating Badge + Panel
```tsx
<div className="fixed top-4 right-4">
  <AlertBadge />
</div>
<div className="fixed bottom-4 right-4 max-w-md">
  <AlertPanel maxItems={5} />
</div>
```

### Option 3: Alert Page
```tsx
export function AlertsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1>Energy Alert Center</h1>
      <AlertTimeline />
    </div>
  );
}
```

### Option 4: Header Alert Icon
```tsx
export function Header() {
  const { unreadCount } = useAlert();
  
  return (
    <header className="flex justify-between items-center">
      <div>My App</div>
      <div className="relative cursor-pointer">
        🔔
        <AlertBadge />
      </div>
    </header>
  );
}
```

## Styling & Customization

### Color Scheme by Alert Type

```
VOLTAGE_DROP   → 🔴 Red    (bg-red-50, border-red-500)
POWER_SPIKE    → ⚡ Orange (bg-orange-50, border-orange-500)
ENERGY_OVERUSE → ⚠️  Yellow (bg-yellow-50, border-yellow-500)
NIGHT_USAGE    → 🌙 Blue   (bg-blue-50, border-blue-500)
```

### Custom Styling

Edit `AlertComponents.tsx` to change colors:

```tsx
const getAlertColor = (alertType: EnergyAlert["alertType"]) => {
  switch (alertType) {
    case "VOLTAGE_DROP":
      return "border-red-500 bg-red-50";
      // Change these Tailwind classes to customize
    // ...
  }
};
```

## Testing Alerts in Frontend

### Test 1: Verify Socket.io Connection
```tsx
useEffect(() => {
  console.log("Alert listener initialized");
  // Check browser console for connection messages
}, []);
```

### Test 2: Manually Add Alert
```tsx
const { addAlert } = useAlert();

// In a button or component
<button onClick={() => {
  addAlert({
    alertType: "ENERGY_OVERUSE",
    message: "Test alert - Power exceeded 5 kW",
    sensorData: { real_power: 6.5, device_id: "test" }
  });
}}>
  Test Alert
</button>
```

### Test 3: Check Network Tab
1. Open DevTools → Network → WS (WebSocket)
2. Look for Socket.io connection
3. Search for "energyAlert" messages

## Performance Considerations

- ✅ Alerts limited to 50 items in memory (configurable)
- ✅ Auto-cleanup of old notifications after 5-8 seconds
- ✅ Efficient re-renders with React Context
- ✅ Socket.io auto-reconnection handled
- ⚠️ Consider localStorage persistence if needed

## Advanced: Persist Alerts

Store alerts in localStorage:

```tsx
// In AlertContext.tsx
useEffect(() => {
  localStorage.setItem('energyAlerts', JSON.stringify(alerts));
}, [alerts]);

useEffect(() => {
  const saved = localStorage.getItem('energyAlerts');
  if (saved) setAlerts(JSON.parse(saved));
}, []);
```

## Troubleshooting

### Alerts Not Appearing
1. Check DevTools Console for Socket.io connection errors
2. Verify AlertProvider is wrapping your component
3. Check Network tab for `energyAlert` events
4. Ensure backend is emitting: `io.emit('energyAlert', ...)`

### Socket.io Connection Failed
1. Check BACKEND_URL environment variable
2. Verify backend is running
3. Check CORS settings in backend server.js
4. Try accessing http://backend-url directly

### No Alert Notification Toast
1. Check NotificationProvider is in root layout
2. Verify addNotification is being called
3. Check browser notifications permission

## Next Steps

1. ✅ Integrate AlertProvider in root layout
2. ✅ Add useAlertListener hook in main component
3. ✅ Place AlertPanel/Badge in your UI
4. ✅ Update backend to emit Socket.io events
5. ⭐ Test with curl commands from backend guide
6. 🎉 Deploy and monitor!

---

**Live Demo:** Once integrated, you'll see:
- Toast notifications when alerts occur
- Real-time badge count updates
- Alert history in expandable panel
- Color-coded alert types
