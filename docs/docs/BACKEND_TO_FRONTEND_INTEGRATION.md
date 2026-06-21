/**
 * ============================================================================
 * BACKEND CHANGES NEEDED FOR FRONTEND ALERTS
 * ============================================================================
 * Copy these changes into your server.js to emit alerts to the frontend
 * ============================================================================
 */

// ============================================================================
// CHANGE 1: Export io from server.js so alertService can emit alerts
// ============================================================================

/*
At the top of server.js, after creating the io instance:

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST"]
  }
});

// ADD THIS LINE AT THE END OF THE FILE:
module.exports = { io };  // Export for alertService to use
*/

// ============================================================================
// CHANGE 2: Pass io to alertService
// ============================================================================

/*
In alertService.js, at the top after requires:

const nodemailer = require('nodemailer');
const { io } = require('./server');  // Import io from server

// Or inject io via a function:
let ioInstance = null;
function setIo(socketIo) {
  ioInstance = socketIo;
}
module.exports = {
  setIo,
  sendEnergyAlert,
  // ...other exports
};

// In server.js after io is created:
const alertService = require('./alertService');
alertService.setIo(io);
*/

// ============================================================================
// CHANGE 3: Emit alert to frontend in sendEnergyAlert function
// ============================================================================

/*
In alertService.js, modify sendEnergyAlert to also emit to frontend:

async function sendEnergyAlert(alertType, message, sensorData = {}, recipientEmail = null) {
  try {
    const recipient = recipientEmail || process.env.ALERT_EMAIL_RECIPIENT;
    
    if (!recipient) {
      console.warn('[Alert Service] No recipient email configured.');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[Alert Service] Email credentials not configured.');
      return false;
    }

    const mailer = getMailer();
    const alertTypeNames = {
      ENERGY_OVERUSE: 'Energy Overuse Alert',
      POWER_SPIKE: 'Power Spike Alert',
      NIGHT_USAGE: 'Unusual Night Usage Alert',
      VOLTAGE_DROP: 'Voltage Drop Alert'
    };

    const subject = `[EMS Alert] ${alertTypeNames[alertType] || alertType}`;
    const htmlBody = buildAlertEmailHTML(alertType, message, sensorData);
    
    // Send email
    const info = await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: htmlBody,
      text: `${alertTypeNames[alertType]}\n\n${message}`
    });

    console.log(`[Alert Service] Email sent for ${alertType} alert:`, info.messageId);

    // *** ADD THESE LINES: EMIT TO FRONTEND ***
    if (ioInstance) {
      console.log(`[Alert Service] Emitting ${alertType} alert to frontend`);
      ioInstance.emit('energyAlert', {
        alertType,
        message,
        sensorData,
        timestamp: new Date().toISOString()
      });
    }
    // *** END SOCKET.IO SECTION ***

    return true;

  } catch (error) {
    console.error('[Alert Service] Error sending email:', error.message);
    return false;
  }
}
*/

// ============================================================================
// CHANGE 4: Simple Alternative - Direct io.emit in server.js
// ============================================================================

/*
If you don't want to modify alertService.js, add this directly in server.js:

In the processDeviceData function, after calling alertService.processAlerts:

async function processDeviceData(payload) {
  try {
    // ... existing code ...
    const saved = await data.save();
    
    // Alert processing
    const alertResults = await alertService.processAlerts(saved.toObject(), previousSensorData);
    previousSensorData = saved.toObject();
    
    // *** ADD THIS: Broadcast the sensor data (alertService will emit separately for alerts)
    io.emit('deviceData', saved);
    
    return saved;
  } catch (err) {
    console.error('Error processing device data:', err);
    return null;
  }
}
*/

// ============================================================================
// CHANGE 5: Add test endpoint for frontend alerts
// ============================================================================

/*
Add these endpoints to test alert emission without ESP32 data:

// Test: Emit a manual alert to frontend
app.post('/test/alert', (req, res) => {
  const { alertType = 'ENERGY_OVERUSE', message = 'Test alert' } = req.body;
  
  io.emit('energyAlert', {
    alertType,
    message,
    sensorData: {
      device_id: 'test-device',
      real_power: 6.5,
      voltage: 215,
      current: 10,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
  
  res.json({ message: 'Alert emitted', alertType });
});

// Test: Broadcast device data
app.post('/test/emit-device-data', (req, res) => {
  const data = req.body;
  io.emit('deviceData', data);
  res.json({ message: 'Device data emitted', data });
});
*/

// ============================================================================
// FULL INTEGRATION EXAMPLE (Copy-Paste Ready)
// ============================================================================

/*
Add this to your alertService.js:

// At the top, after require statements:
let ioInstance = null;

// Add this function:
function setIo(io) {
  ioInstance = io;
}

// Modify sendEnergyAlert (just add this section after email is sent):
async function sendEnergyAlert(alertType, message, sensorData = {}, recipientEmail = null) {
  try {
    const recipient = recipientEmail || process.env.ALERT_EMAIL_RECIPIENT;
    
    if (!recipient) {
      console.warn('[Alert Service] No recipient email configured.');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[Alert Service] Email credentials not configured.');
      return false;
    }

    const mailer = getMailer();
    const alertTypeNames = {
      ENERGY_OVERUSE: 'Energy Overuse Alert',
      POWER_SPIKE: 'Power Spike Alert',
      NIGHT_USAGE: 'Unusual Night Usage Alert',
      VOLTAGE_DROP: 'Voltage Drop Alert'
    };

    const subject = `[EMS Alert] ${alertTypeNames[alertType] || alertType}`;
    const htmlBody = buildAlertEmailHTML(alertType, message, sensorData);
    
    // Send email
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: htmlBody,
      text: `${alertTypeNames[alertType]}\n\n${message}`
    });

    console.log(`[Alert Service] Email sent for ${alertType} alert`);

    // *** EMIT TO FRONTEND ***
    if (ioInstance) {
      ioInstance.emit('energyAlert', {
        alertType,
        message,
        sensorData,
        timestamp: new Date().toISOString()
      });
    }

    return true;

  } catch (error) {
    console.error('[Alert Service] Error sending email:', error.message);
    return false;
  }
}

// Update module exports:
module.exports = {
  setIo,  // ADD THIS
  sendEnergyAlert,
  checkEnergyOveruse,
  checkPowerSpike,
  checkNightUsage,
  checkVoltageDrop,
  processAlerts,
  getMailer
};


Add this to your server.js (after io is created):

// After creating io instance:
const io = new Server(server, { /* config */ });

// IMPORT alertService
const alertService = require('./alertService');

// INITIALIZE io in alertService
alertService.setIo(io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});
*/

// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

/*
After making changes, verify with:

1. Console Logs:
   Look for "[Alert Service] Emitting ... alert to frontend"
   
2. Browser DevTools:
   Network tab → WS → Look for socket.io messages
   Console → Look for "[Alert Listener] Received alert:"
   
3. Test Endpoint:
   curl -X POST http://localhost:5000/test/alert \
     -H "Content-Type: application/json" \
     -d '{"alertType": "ENERGY_OVERUSE", "message": "Test alert"}'
   
4. Frontend:
   - Toast notification should appear (bottom-right)
   - Alert badge should show unread count
   - Alert panel should show new alert
*/

// ============================================================================
// TROUBLESHOOTING: Socket.io Not Connecting
// ============================================================================

/*
If frontend Socket.io connection fails:

1. Check backend server.js:
   - Is io = new Server(server, { cors: {...} }) created?
   - Is io.on('connection', ...) handler registered?

2. Check environment variable:
   - frontend: .env has NEXT_PUBLIC_BACKEND_URL pointing to backend
   - backend: server running on correct port

3. Check CORS:
   - Verify CORS settings allow frontend origin
   - Check browser console for "Origin not allowed" errors

4. Test direct connection:
   const socket = io('http://localhost:5000');
   socket.on('connect', () => console.log('Connected!'));
   socket.on('energyAlert', (data) => console.log(data));
*/

// ============================================================================
// FILE SUMMARY
// ============================================================================

/*
Files to modify/create:

BACKEND (Node.js):
✓ alertService.js      - Already created
✓ server.js            - Add alert listener initialization
✓ .env.local           - Add email credentials

FRONTEND (Next.js):
✓ AlertContext.tsx     - Already created
✓ useAlertListener.ts  - Already created
✓ AlertComponents.tsx  - Already created
✓ layout.tsx           - Wrap with AlertProvider
✓ dashboard.tsx        - Add useAlertListener() and AlertPanel

INTEGRATION:
1. Update server.js to initialize alertService with io instance
2. Import alertService in server.js
3. Ensure alertService emits via Socket.io
4. Update frontend layout to wrap with AlertProvider
5. Add useAlertListener() to main component
6. Add AlertPanel/Badge to UI
7. Test with curl commands
*/
