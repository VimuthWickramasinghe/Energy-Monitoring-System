/**
 * ============================================================================
 * SERVER.JS INTEGRATION GUIDE - ALERT SERVICE
 * ============================================================================
 * This file contains the code snippets to integrate the alertService into
 * your existing server.js. Copy these sections into the appropriate places
 * in your server.js file.
 * ============================================================================
 */

// ============================================================================
// STEP 1: ADD THIS AT THE TOP OF SERVER.JS (after other require statements)
// ============================================================================

// After the existing require statements, add:
const alertService = require('./alertService');

// ============================================================================
// STEP 2: STORE PREVIOUS SENSOR DATA (for spike detection)
// ============================================================================

// Add this as a global variable to track previous readings
let previousSensorData = null;

// ============================================================================
// STEP 3: MODIFY THE processDeviceData FUNCTION
// ============================================================================

// Replace the existing processDeviceData function with this enhanced version:

/*
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
    if (typeof voltage !== 'undefined' && !isNaN(voltage)) docObj.voltage = Number(voltage);
    if (typeof current !== 'undefined' && !isNaN(current)) docObj.current = Number(current);
    if (typeof apparent_power !== 'undefined' && !isNaN(apparent_power)) docObj.apparent_power = Number(apparent_power);
    if (typeof real_power !== 'undefined' && !isNaN(real_power)) docObj.real_power = Number(real_power);
    if (typeof power_factor !== 'undefined' && !isNaN(power_factor)) docObj.power_factor = Number(power_factor);

    if (Object.keys(docObj).length <= 1) {
      console.log('No valid fields in incoming payload:', payload);
      return null;
    }

    const data = new Sensor(docObj);
    const saved = await data.save();
    
    // *** ADD THIS SECTION: CHECK ALL ALERTS ***
    // Call alert processing asynchronously (don't wait for it)
    alertService.processAlerts(saved.toObject(), previousSensorData).catch(err => {
      console.error('[Server] Error in alert processing:', err);
    });
    
    // Update previous sensor data for next spike detection
    previousSensorData = saved.toObject();
    // *** END ALERT SECTION ***
    
    io.emit('deviceData', saved);
    return saved;
  } catch (err) {
    console.error('Error processing device data:', err);
    return null;
  }
}
*/

// ============================================================================
// STEP 4: INDIVIDUAL ALERT TRIGGER EXAMPLES (Optional)
// ============================================================================

// If you want to trigger specific alerts independently, you can use these functions:

/*
// Example 1: Check only Energy Overuse (from an API endpoint)
app.post('/check-overuse', async (req, res) => {
  try {
    const { power } = req.body;
    const threshold = req.body.threshold || 5; // Default 5 kW
    
    const isOveruse = await alertService.checkEnergyOveruse(
      power,
      { real_power: power, device_id: 'manual-check' },
      threshold
    );
    
    res.json({
      overused: isOveruse,
      power: power,
      threshold: threshold
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example 2: Check only Power Spike
app.post('/check-spike', async (req, res) => {
  try {
    const { currentPower, previousPower } = req.body;
    const spikeThreshold = req.body.spikeThreshold || 50; // Default 50%
    
    const isSpike = await alertService.checkPowerSpike(
      currentPower,
      previousPower,
      { real_power: currentPower, device_id: 'manual-check' },
      spikeThreshold
    );
    
    res.json({
      spiked: isSpike,
      currentPower: currentPower,
      previousPower: previousPower,
      percentageIncrease: (((currentPower - previousPower) / previousPower) * 100).toFixed(1) + '%'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example 3: Check Night Usage
app.post('/check-night-usage', async (req, res) => {
  try {
    const { power } = req.body;
    const nightThreshold = req.body.nightThreshold || 1; // Default 1 kW
    
    const isNightUsage = await alertService.checkNightUsage(
      power,
      { real_power: power, device_id: 'manual-check' },
      nightThreshold
    );
    
    const hour = new Date().getHours();
    const isNightTime = hour >= 0 && hour < 5;
    
    res.json({
      unusualNightUsage: isNightUsage,
      power: power,
      nightThreshold: nightThreshold,
      currentHour: hour,
      isNightTime: isNightTime
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example 4: Check Voltage Drop
app.post('/check-voltage', async (req, res) => {
  try {
    const { voltage } = req.body;
    const minVoltage = req.body.minVoltage || 210; // Default 210V
    
    const isVoltageDrop = await alertService.checkVoltageDrop(
      voltage,
      { voltage: voltage, device_id: 'manual-check' },
      minVoltage
    );
    
    res.json({
      voltageDrop: isVoltageDrop,
      voltage: voltage,
      minVoltage: minVoltage,
      status: voltage < minVoltage ? 'CRITICAL - BROWNOUT' : 'NORMAL'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example 5: Trigger ALL alerts manually
app.post('/check-all-alerts', async (req, res) => {
  try {
    const sensorData = req.body; // Should contain voltage, real_power, etc.
    const previousData = previousSensorData;
    
    await alertService.processAlerts(sensorData, previousData);
    
    res.json({
      message: 'All alert checks completed',
      timestamp: new Date().toISOString(),
      sensorData: sensorData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/

// ============================================================================
// STEP 5: CONFIGURE ENVIRONMENT VARIABLES
// ============================================================================

/*
Add these to your .env.local file:

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

Note: For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use that App Password as EMAIL_PASS (not your regular password)
*/

// ============================================================================
// QUICK REFERENCE - ALERT TYPES
// ============================================================================

/*
1. ENERGY OVERUSE ALERT
   - Triggered when: real_power > 5 kW (configurable)
   - Why: Indicates excessive consumption, potential cost overruns
   - Example scenario: Multiple heavy appliances running simultaneously
   - Action: Reduce non-essential loads, investigate high consumers

2. POWER SPIKE ALERT
   - Triggered when: Power increases > 50% in consecutive readings
   - Why: Indicates sudden equipment activation or fault
   - Example scenario: Large motor starting, equipment fault
   - Action: Investigate cause of spike, check equipment status

3. UNUSUAL NIGHT USAGE ALERT
   - Triggered when: Power > 1 kW between 12 AM - 5 AM
   - Why: Building should be dormant at night (security/efficiency)
   - Example scenario: HVAC running unnecessarily, equipment left on
   - Action: Check for security issues, verify equipment is off

4. VOLTAGE DROP (BROWNOUT) ALERT
   - Triggered when: Voltage < 210V
   - Why: Low voltage can damage sensitive equipment (computers, PLCs)
   - Example scenario: Grid issues, excessive load on circuit
   - Action: CRITICAL - Activate backup power, contact utility
*/

// ============================================================================
// TESTING THE ALERTS
// ============================================================================

/*
Use these curl commands to test the alert system:

// Test Energy Overuse
curl -X POST http://localhost:5000/check-overuse \
  -H "Content-Type: application/json" \
  -d '{"power": 6.5, "threshold": 5}'

// Test Power Spike
curl -X POST http://localhost:5000/check-spike \
  -H "Content-Type: application/json" \
  -d '{"currentPower": 5, "previousPower": 2}'

// Test Night Usage
curl -X POST http://localhost:5000/check-night-usage \
  -H "Content-Type: application/json" \
  -d '{"power": 2, "nightThreshold": 1}'

// Test Voltage Drop
curl -X POST http://localhost:5000/check-voltage \
  -H "Content-Type: application/json" \
  -d '{"voltage": 200, "minVoltage": 210}'

// Test All Alerts
curl -X POST http://localhost:5000/check-all-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ems-esm-test",
    "voltage": 200,
    "current": 10,
    "real_power": 6.5,
    "apparent_power": 7,
    "power_factor": 0.92
  }'
*/

// ============================================================================
// ADVANCED CUSTOMIZATION
// ============================================================================

/*
To customize alert thresholds per device or building:

1. Store thresholds in database:
   - Create AlertThreshold collection with device_id, building_id, thresholds
   
2. Load thresholds dynamically:
   const thresholds = await AlertThreshold.findOne({ device_id });
   const energyThreshold = thresholds?.energyOveruseThreshold || 5;

3. Use in alert checks:
   await alertService.checkEnergyOveruse(
     real_power,
     sensorData,
     energyThreshold  // Dynamic threshold
   );

4. Add alert cooldown to prevent spamming:
   - Store last alert time per device
   - Skip alert if already sent within cooldown period (e.g., 5 minutes)
*/

// ============================================================================
// MONITORING & DEBUGGING
// ============================================================================

/*
To monitor alert activity:

1. Check console logs:
   - Look for "[Alert Service]" messages
   - Check for "[Server]" messages in alert section

2. Create alert log collection:
   const AlertLogSchema = new mongoose.Schema({
     alertType: String,
     device_id: String,
     message: String,
     sensorData: Object,
     timestamp: { type: Date, default: Date.now }
   });

3. Log each alert:
   const log = new AlertLog({
     alertType,
     device_id: sensorData.device_id,
     message,
     sensorData
   });
   await log.save();

4. Query historical alerts:
   app.get('/alerts/history', async (req, res) => {
     const { device_id, days = 7 } = req.query;
     const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
     const alerts = await AlertLog.find({
       device_id,
       timestamp: { $gte: since }
     }).sort({ timestamp: -1 });
     res.json(alerts);
   });
*/
