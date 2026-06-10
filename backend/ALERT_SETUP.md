# Energy Monitoring System - Alert Notification Setup

## Overview

This notification system provides automated email alerts for four critical energy monitoring scenarios in your Node.js backend. Using nodemailer (already installed), the system monitors sensor data in real-time and triggers alerts when thresholds are exceeded.

## Files Created

- **`alertService.js`** - Core alert module with email sending and trigger logic
- **`ALERT_INTEGRATION_GUIDE.md`** - Detailed integration instructions
- **`.env.example`** - Environment variables template

## Quick Start (5 Steps)

### Step 1: Configure Email Credentials

1. Go to your Gmail account: https://myaccount.google.com/
2. Enable **2-Factor Authentication** (if not already enabled)
3. Generate an **App Password** at https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
4. Update your `.env.local` file:

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ALERT_EMAIL_RECIPIENT=admin@yourdomain.com
```

### Step 2: Add Alert Service to server.js

At the top of your `server.js` file (after other require statements):

```javascript
const alertService = require('./alertService');

// Global variable to track previous readings (for spike detection)
let previousSensorData = null;
```

### Step 3: Integrate into Data Processing

Modify your `processDeviceData` function. Find this section in your existing `server.js`:

```javascript
async function processDeviceData(payload) {
  // ... existing code ...
  const saved = await data.save();
  
  // ADD THESE LINES:
  alertService.processAlerts(saved.toObject(), previousSensorData).catch(err => {
    console.error('[Server] Error in alert processing:', err);
  });
  previousSensorData = saved.toObject();
  
  io.emit('deviceData', saved);
  return saved;
}
```

### Step 4: (Optional) Add Alert Test Endpoints

If you want to test alerts independently, add these endpoints to server.js:

```javascript
// Test Energy Overuse
app.post('/test/overuse', async (req, res) => {
  const { power = 6, threshold = 5 } = req.body;
  await alertService.checkEnergyOveruse(power, { real_power: power, device_id: 'test' }, threshold);
  res.json({ tested: true, power, threshold });
});

// Test Power Spike
app.post('/test/spike', async (req, res) => {
  const { current = 5, previous = 2 } = req.body;
  await alertService.checkPowerSpike(current, previous, { real_power: current, device_id: 'test' }, 50);
  res.json({ tested: true, current, previous });
});

// Test Night Usage
app.post('/test/night-usage', async (req, res) => {
  const { power = 2 } = req.body;
  await alertService.checkNightUsage(power, { real_power: power, device_id: 'test' }, 1);
  res.json({ tested: true, power });
});

// Test Voltage Drop
app.post('/test/voltage', async (req, res) => {
  const { voltage = 200 } = req.body;
  await alertService.checkVoltageDrop(voltage, { voltage, device_id: 'test' }, 210);
  res.json({ tested: true, voltage });
});
```

### Step 5: Restart Your Server

```bash
npm start
# or for development
npm run dev
```

## Alert Types Explained

### 1. **Energy Overuse Alert** ⚠️
- **Triggered When**: Real power (kW) exceeds 5 kW (configurable)
- **Purpose**: Prevents excessive consumption, identifies high-load equipment
- **Example**: Multiple devices running simultaneously
- **Action**: Reduce non-essential loads

### 2. **Power Spike Alert** ⚡
- **Triggered When**: Power jumps more than 50% between consecutive readings
- **Purpose**: Detects sudden equipment activation or faults
- **Example**: Large motor starting, unexpected device activation
- **Action**: Investigate equipment status

### 3. **Unusual Night Usage Alert** 🌙
- **Triggered When**: Power > 1 kW between 12 AM and 5 AM
- **Purpose**: Identifies dormancy violations (security/efficiency)
- **Example**: HVAC or equipment left running overnight
- **Action**: Verify equipment is actually needed, check for security issues

### 4. **Voltage Drop Alert** 🔌
- **Triggered When**: Voltage falls below 210V
- **Purpose**: Prevents equipment damage from insufficient power
- **Example**: Grid issues, circuit overload
- **Action**: CRITICAL - Activate backup power, contact utility provider

## Testing the System

### Using curl Commands

```bash
# Test Energy Overuse (6.5 kW when threshold is 5 kW)
curl -X POST http://localhost:5000/test/overuse \
  -H "Content-Type: application/json" \
  -d '{"power": 6.5}'

# Test Power Spike (jump from 2 kW to 5 kW = 150% increase)
curl -X POST http://localhost:5000/test/spike \
  -H "Content-Type: application/json" \
  -d '{"current": 5, "previous": 2}'

# Test Night Usage (check current time - must be 12 AM - 5 AM)
curl -X POST http://localhost:5000/test/night-usage \
  -H "Content-Type: application/json" \
  -d '{"power": 2}'

# Test Voltage Drop (200V when minimum is 210V)
curl -X POST http://localhost:5000/test/voltage \
  -H "Content-Type: application/json" \
  -d '{"voltage": 200}'
```

### Using Postman

1. Create a POST request to `http://localhost:5000/test/overuse`
2. Set Header: `Content-Type: application/json`
3. Set Body (raw JSON):
```json
{
  "power": 7,
  "threshold": 5
}
```
4. Send and check your email inbox

## Customization Guide

### Adjust Alert Thresholds

In your `.env.local`, modify these values:

```bash
# Allow up to 8 kW before alert (default is 5)
ENERGY_OVERUSE_THRESHOLD=8

# Allow 30% power increase before spike alert (default is 50%)
POWER_SPIKE_THRESHOLD=30

# Alert if night usage exceeds 2 kW (default is 1)
NIGHT_USAGE_THRESHOLD=2

# Alert if voltage drops below 220V (default is 210)
VOLTAGE_DROP_THRESHOLD=220
```

### Change Night Hours Window

Edit the night usage check in `alertService.js`:

```javascript
// Current: checks 12 AM (0) to 5 AM (5)
const isNightHours = hour >= 0 && hour < 5;

// Change to: 11 PM (23) to 6 AM (6)
const isNightHours = hour >= 23 || hour < 6;
```

### Multiple Recipients

Modify `sendEnergyAlert` function to accept array of emails:

```javascript
async function sendEnergyAlert(alertType, message, sensorData, recipientEmail) {
  // ... existing code ...
  
  const recipients = Array.isArray(recipientEmail) 
    ? recipientEmail.join(', ')
    : recipientEmail;
  
  // ... send to recipients ...
}
```

## Troubleshooting

### Emails Not Being Sent

1. **Check credentials**: Verify EMAIL_USER and EMAIL_PASS in `.env.local`
2. **Gmail App Password**: Ensure you're using an App-Specific Password, not your regular password
3. **2FA Enabled**: Confirm 2-Factor Authentication is enabled on your Gmail account
4. **Check logs**: Look for `[Alert Service]` messages in console output

### "No recipient email configured"

Add to `.env.local`:
```bash
ALERT_EMAIL_RECIPIENT=your-email@gmail.com
```

### Alerts Not Triggering

1. **Check sensor data**: Verify real_power, voltage values are being received
2. **Check thresholds**: Ensure test values exceed configured thresholds
3. **Time zone**: For night usage alerts, verify your server time is correct

### Email Goes to Spam

1. Gmail may initially flag alerts as spam
2. Mark first alert as "Not Spam" in your inbox
3. Add sender to contacts: add `process.env.EMAIL_USER` to contacts
4. Configure DKIM/SPF if using custom domain

## Advanced: Storing Alert History

To log all alerts for auditing:

```javascript
// Add to server.js after mongoose setup
const AlertLogSchema = new mongoose.Schema({
  alertType: String,
  device_id: String,
  message: String,
  sensorData: Object,
  emailSent: Boolean,
  timestamp: { type: Date, default: Date.now }
});
const AlertLog = mongoose.model('AlertLog', AlertLogSchema);

// In alertService.js, after sendEnergyAlert succeeds:
const log = new AlertLog({
  alertType,
  device_id: sensorData.device_id,
  message,
  sensorData,
  emailSent: true
});
await log.save();

// Add query endpoint in server.js
app.get('/alerts/history', authenticateFirebaseToken, async (req, res) => {
  const { device_id, days = 7 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const alerts = await AlertLog.find({
    device_id,
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
  res.json(alerts);
});
```

## Alert Cooldown (Prevent Spamming)

Add this to prevent the same alert from triggering too frequently:

```javascript
// Track last alert time per device
const lastAlertTime = {};

async function checkEnergyOveruse(realPower, sensorData, threshold = 5) {
  const deviceId = sensorData.device_id;
  const now = Date.now();
  const cooldownMs = 5 * 60 * 1000; // 5 minutes
  
  // Skip if alert was already sent recently
  if (lastAlertTime[deviceId] && now - lastAlertTime[deviceId] < cooldownMs) {
    return false;
  }
  
  if (realPower > threshold) {
    await sendEnergyAlert('ENERGY_OVERUSE', message, sensorData);
    lastAlertTime[deviceId] = now;
    return true;
  }
  return false;
}
```

## Production Checklist

- [ ] Email credentials configured in production environment
- [ ] Alert recipient email verified and tested
- [ ] Alert thresholds appropriate for your building
- [ ] Backup email recipient configured for critical alerts
- [ ] Alert logs enabled for auditing
- [ ] Cooldown periods configured to prevent alert spam
- [ ] Team trained on alert response procedures
- [ ] Backup power systems checked (for voltage drop alerts)

## Support

For issues or questions:
1. Check the console for `[Alert Service]` error messages
2. Review `ALERT_INTEGRATION_GUIDE.md` for detailed specifications
3. Test individual alert functions using curl commands
4. Verify `.env.local` has all required variables

---

**Next Steps**: After confirming alerts are working, consider:
- Implementing SMS alerts for critical conditions
- Adding alert acknowledgment/resolution tracking
- Building an admin dashboard for alert management
- Setting up escalation for unhandled alerts
