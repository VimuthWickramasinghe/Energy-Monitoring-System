---
sidebar_position: 2
title: Alert Setup
description: Guide on integrating the alert service into the backend server.
---

# Alert Service Integration Guide

This file contains the code snippets and instructions to integrate the `alertService` into your existing `server.js`.

---

## 1. Import the Alert Service

At the top of `server.js`, after your other `require` statements, import the alert service.

```javascript
// After the existing require statements, add:
const alertService = require("./alertService");
```

---

## 2. Store Previous Sensor Data

To detect power spikes, we need to compare the current sensor reading with the previous one. Add a global variable in `server.js` to track the last reading.

```javascript
// Add this as a global variable to track previous readings
let previousSensorData = null;
```

---

## 3. Modify `processDeviceData`

Enhance the `processDeviceData` function to check for alerts after saving new sensor data.

```javascript
async function processDeviceData(payload) {
  try {
    const {
      device_id,
      voltage,
      current,
      apparent_power,
      real_power,
      power_factor,
    } = payload;

    const docObj = { device_id };
    if (typeof voltage !== "undefined" && !isNaN(voltage))
      docObj.voltage = Number(voltage);
    if (typeof current !== "undefined" && !isNaN(current))
      docObj.current = Number(current);
    if (typeof apparent_power !== "undefined" && !isNaN(apparent_power))
      docObj.apparent_power = Number(apparent_power);
    if (typeof real_power !== "undefined" && !isNaN(real_power))
      docObj.real_power = Number(real_power);
    if (typeof power_factor !== "undefined" && !isNaN(power_factor))
      docObj.power_factor = Number(power_factor);

    if (Object.keys(docObj).length <= 1) {
      console.log("No valid fields in incoming payload:", payload);
      return null;
    }

    const data = new Sensor(docObj);
    const saved = await data.save();

    // *** ADD THIS SECTION: CHECK ALL ALERTS ***
    // Call alert processing asynchronously (don't wait for it)
    alertService
      .processAlerts(saved.toObject(), previousSensorData)
      .catch((err) => {
        console.error("[Server] Error in alert processing:", err);
      });

    // Update previous sensor data for next spike detection
    previousSensorData = saved.toObject();
    // *** END ALERT SECTION ***

    io.emit("deviceData", saved);
    return saved;
  } catch (err) {
    console.error("Error processing device data:", err);
    return null;
  }
}
```

---

## 4. Configure Environment Variables

Add the following variables to your `.env.local` file to configure email notifications and alert thresholds.

```env
# Email Configuration for Alerts
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password  # Use Gmail App Password, not your regular password

# Alert Recipient Email
ALERT_EMAIL_RECIPIENT=admin@yourdomain.com

# (Optional) Alert Thresholds - adjust these as needed
ENERGY_OVERUSE_THRESHOLD=5        # kW
POWER_SPIKE_THRESHOLD=50          # percentage increase
NIGHT_USAGE_THRESHOLD=1           # kW
VOLTAGE_DROP_THRESHOLD=210        # V
```

> **Note on Gmail App Passwords:** To use Gmail, you need to enable 2-Factor Authentication on your Google account and then generate an "App Password" at myaccount.google.com/apppasswords. Use that 16-digit password as your `EMAIL_PASS`.

---

## 5. Quick Reference: Alert Types

| Alert Type              | Trigger Condition             | Purpose & Action                                                                        |
| :---------------------- | :---------------------------- | :-------------------------------------------------------------------------------------- |
| **Energy Overuse**      | `real_power > 5 kW`           | Indicates excessive consumption. **Action:** Reduce non-essential loads.                |
| **Power Spike**         | Power increases `> 50%`       | Indicates sudden equipment activation or fault. **Action:** Investigate cause.          |
| **Unusual Night Usage** | `Power > 1 kW` (12 AM - 5 AM) | Building should be dormant. **Action:** Check for security issues or equipment left on. |
| **Voltage Drop**        | `Voltage < 210V`              | Low voltage can damage equipment. **Action:** CRITICAL - Activate backup power.         |

---

## 6. Testing the Alerts

You can use `curl` to test the alert system by simulating different conditions.

### Test Energy Overuse

```bash
curl -X POST http://localhost:8080/testemail \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "ENERGY_OVERUSE",
    "message": "Test: Energy consumption has exceeded the 5 kW threshold.",
    "sensorData": { "real_power": 6.5 }
  }'
```

### Test Power Spike

```bash
curl -X POST http://localhost:8080/testemail \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "POWER_SPIKE",
    "message": "Test: A sudden power spike of 75% was detected.",
    "sensorData": { "real_power": 3.5, "previous_power": 2.0 }
  }'
```

### Test Night Usage

```bash
curl -X POST http://localhost:8080/testemail \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "NIGHT_USAGE",
    "message": "Test: Unusual energy usage detected during off-hours.",
    "sensorData": { "real_power": 1.2 }
  }'
```

### Test Voltage Drop

```bash
curl -X POST http://localhost:8080/testemail \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "VOLTAGE_DROP",
    "message": "Test: Critical voltage drop detected.",
    "sensorData": { "voltage": 205 }
  }'
```

---

## 7. Advanced Customization

### Dynamic Thresholds

To customize alert thresholds per device or building, you can:

1.  Store thresholds in a database (e.g., a new `AlertThresholds` table in Supabase).
2.  In `alertService.js`, load the thresholds dynamically based on the `device_id` from the incoming sensor data.
3.  Use the dynamic threshold in your alert checks instead of the one from the environment variable.

### Alert Cooldown

To prevent spamming a user with repeated alerts for the same ongoing issue:

1.  Store the timestamp of the last alert sent for a specific `alertType` and `device_id`.
2.  Before sending a new alert, check if enough time has passed since the last one (e.g., 5-10 minutes).

---

## 8. Monitoring & Debugging

To monitor alert activity, you can implement an alert logging system.

1.  **Create a Log Schema/Table**: Define a new Mongoose schema or Supabase table (`AlertLog`) to store alert details.

    ```javascript
    const AlertLogSchema = new mongoose.Schema({
      alertType: String,
      device_id: String,
      message: String,
      sensorData: Object,
      timestamp: { type: Date, default: Date.now },
    });
    ```

2.  **Log Each Alert**: In `alertService.js`, after an alert is confirmed and before the email is sent, save a record to this new collection.

3.  **Create a History Endpoint**: Build a new API endpoint (e.g., `/api/alerts/history`) to query and display historical alerts in the frontend dashboard.

---

## Appendix: Individual Alert Trigger Examples

If you want to trigger specific alert checks independently (e.g., from new API endpoints), you can use the individual functions from `alertService`.

### Check Energy Overuse

```javascript
app.post("/check-overuse", async (req, res) => {
  try {
    const { power, threshold = 5 } = req.body;
    const isOveruse = await alertService.checkEnergyOveruse(
      power,
      { real_power: power, device_id: "manual-check" },
      threshold,
    );
    res.json({ overused: isOveruse, power, threshold });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Check Power Spike

```javascript
app.post("/check-spike", async (req, res) => {
  try {
    const { currentPower, previousPower, spikeThreshold = 50 } = req.body;
    const isSpike = await alertService.checkPowerSpike(
      currentPower,
      previousPower,
      { real_power: currentPower, device_id: "manual-check" },
      spikeThreshold,
    );
    res.json({ spiked: isSpike, currentPower, previousPower });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Check Night Usage

```javascript
app.post("/check-night-usage", async (req, res) => {
  try {
    const { power, nightThreshold = 1 } = req.body;
    const isNightUsage = await alertService.checkNightUsage(
      power,
      { real_power: power, device_id: "manual-check" },
      nightThreshold,
    );
    res.json({ unusualNightUsage: isNightUsage, power, nightThreshold });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Check Voltage Drop

```javascript
app.post("/check-voltage", async (req, res) => {
  try {
    const { voltage, minVoltage = 210 } = req.body;
    const isVoltageDrop = await alertService.checkVoltageDrop(
      voltage,
      { voltage: voltage, device_id: "manual-check" },
      minVoltage,
    );
    res.json({ voltageDrop: isVoltageDrop, voltage, minVoltage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```
