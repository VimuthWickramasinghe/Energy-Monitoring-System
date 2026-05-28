const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Kept for Schema/Model functionality
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  // Use '*' to allow all local network devices during development
  origin: process.env.NODE_ENV === 'development' ? '*' : (process.env.FRONTEND_URL || '*'),
  optionsSuccessStatus: 200
};

/**
 * ============================================================================
 * WEBSOCKET / SOCKET.IO SETUP
 * ============================================================================
 * We initialize a Socket.io Server instance on top of the HTTP server.
 * This enables bidirectional, real-time communication between the backend and
 * frontend clients (e.g. dashboards) using web sockets as the transport protocol.
 */
const io = new Server(server, {
  // CORS (Cross-Origin Resource Sharing) Configuration:
  // In development (NODE_ENV === 'development'), we allow any origin ('*') to connect.
  // This allows developer local machines, LAN-connected clients, and different dev ports
  // (e.g. Next.js running on localhost:3000) to connect without CORS browser violations.
  // In production, we restrict connections to our designated FRONTEND_URL.
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : (process.env.FRONTEND_URL || '*'),
    methods: ["GET", "POST"]
  }
});

// Listener for client connection events.
// Each time a frontend client connects (e.g. dashboard tab), a new socket session is initialized.
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  // Clean up and log when a client closes the connection (e.g. closes the browser tab).
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);


app.use(cors(corsOptions));
app.use(bodyParser.json());

// Firebase Admin Setup
// Note: You need to place your serviceAccountKey.json in the backend folder
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Firebase Admin Setup Error:", error);
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('\n❌ FATAL ERROR: Missing Firebase Admin credentials.');
    console.error('Node.js could not find the "serviceAccountKey.json" file in your backend folder.');
    console.error('Please make sure you saved it exactly as "backend/serviceAccountKey.json".\n');
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}



// MongoDB connection (dotenv)
const mongoUri = process.env.MONGODB_URI;
mongoose.set('strictQuery', false);

// Schema (kept because you requested to store one dataset)
const SensorSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  voltage: Number,
  current: Number,
  apparent_power: Number,
  real_power: Number,
  power_factor: Number,
  time: { type: Date, default: Date.now }
});

const Sensor = mongoose.model("Sensor", SensorSchema, "finalVolData");

// Firebase Authentication Middleware
const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
  if (req.method === 'POST') console.log('  body:', req.body);
  next();
});

// Root endpoint for Cloud Run health checks
app.get('/', (req, res) => {
  res.send('Hello from EMS Backend!');
});

// health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API endpoint to get the latest data
app.get('/current', authenticateFirebaseToken, async (req, res) => {
  try {
    const latest = await Sensor.findOne().sort({ time: -1 });
    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }
    res.json(latest);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to test data reception (same logic as /send)
app.post('/test', async (req, res) => {
  return handleSendData(req, res);
});

// API endpoint to receive data from ESP
app.post('/send', async (req, res) => {
  return handleSendData(req, res);
});

// Shared logic for /send and /test
async function handleSendData(req, res) {
  try {
    // Basic API Key protection for hardware devices
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.HARDWARE_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    const {
      device_id,
      voltage,
      current,
      apparent_power,
      real_power,
      power_factor,
    } = req.body;

    const docObj = { device_id };
    if (typeof voltage !== 'undefined' && !isNaN(voltage)) docObj.voltage = Number(voltage);
    if (typeof current !== 'undefined' && !isNaN(current)) docObj.current = Number(current);
    if (typeof apparent_power !== 'undefined' && !isNaN(apparent_power)) docObj.apparent_power = Number(apparent_power);
    if (typeof real_power !== 'undefined' && !isNaN(real_power)) docObj.real_power = Number(real_power);
    if (typeof power_factor !== 'undefined' && !isNaN(power_factor)) docObj.power_factor = Number(power_factor);
    
    if (Object.keys(docObj).length <= 1) {
      console.log('No valid fields in incoming body:', req.body);
      return res.status(400).json({ error: 'No valid sensor fields in body' });
    }

    // Save the telemetry readings to MongoDB.
    // Sensor is a Mongoose Model pointing to the finalVolData collection.
    const data = new Sensor(docObj);
    const saved = await data.save();
    console.log('Saved document id:', saved._id.toString());
    
    // ========================================================================
    // WEBSOCKET BROADCAST LOGIC
    // ========================================================================
    // Immediately after saving the data packet to MongoDB, we broadcast it
    // to all currently connected frontend web browsers.
    //
    // - Event Name: 'deviceData'
    // - Payload: The saved Mongoose document (contains fields like device_id,
    //   voltage, current, real_power, apparent_power, power_factor, and the
    //   server-generated database timestamp 'time').
    //
    // By using 'io.emit', we push this update over the open WebSocket TCP
    // connection to all clients. This implements the Observer / Pub-Sub pattern:
    // the frontend clients do not have to poll the database or make repetitive HTTP requests.
    // They just listen for 'deviceData' updates and update their local state reactively.
    io.emit('deviceData', saved);
    
    // Respond back to the hardware device to confirm receipt and successful database storage.
    res.status(201).json({ message: 'Data saved', id: saved._id, data: docObj });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ error: err.message });
  }
}

// API endpoint to register a new device (Supabase Metadata)
app.post('/register-device', authenticateFirebaseToken, async (req, res) => {
  try {
    const { device_id, name, building_id, phase } = req.body;

    if (!device_id || !name || !building_id) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    // Save metadata to Supabase
    const { data, error } = await supabase
      .from('MODULE')
      .upsert({ 
        device_id, 
        name, 
        building_id, 
        phase,
        user_id: req.user.uid,
        updated_at: new Date() 
      });

    if (error) throw error;

    res.status(200).json({ message: 'Registration Success', data });
  } catch (err) {
    console.error('Error registering device:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to get historical data
app.get('/history', authenticateFirebaseToken, async (req, res) => {
  try {
    const { start, end, limit } = req.query;
    const query = {};

    if (start || end) {
      query.time = {};
      if (start) query.time.$gte = new Date(start);
      if (end) query.time.$lte = new Date(end);
    }

    const limitVal = parseInt(limit) || 100;
    // Sort by time descending (newest first)
    const data = await Sensor.find(query).sort({ time: -1 }).limit(limitVal);
    res.json(data);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- NEW API Endpoint for Prediction ---

// Use environment variable for Python path (Docker) or fallback to local venv
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || path.join(__dirname, '..', 'venv', 'bin', 'python3');
const PREDICT_SCRIPT = path.join(__dirname, '..', 'ml_service', 'predict_future.py');

app.get('/predict', authenticateFirebaseToken, (req, res) => {
  // Spawn the Python process to run the prediction script
  const python = spawn(PYTHON_EXECUTABLE, [PREDICT_SCRIPT]);

  let predictionOutput = '';
  let errorOutput = '';

  // Capture standard output (the predicted numerical value)
  python.stdout.on('data', (data) => {
    predictionOutput += data.toString().trim();
  });

  // Capture standard error (for debugging)
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // Handle process completion
  python.on('close', (code) => {
    if (code === 0) {
      // Prediction succeeded
      try {
        const predictions = JSON.parse(predictionOutput);
        return res.json({
          success: true,
          predictions: predictions,
          units: {
            watt: 'Watts',
            temperature: 'Celsius',
            humidity: '%'
          },
          model: 'Ridge Regression (Time Series)'
        });
      } catch (e) {
        console.error('Failed to parse Python output:', predictionOutput);
        return res.status(500).json({ success: false, error: 'Invalid output from ML script' });
      }
    }

    // If code != 0 or output was invalid
    console.error(`Prediction script failed with code ${code}. Error: ${errorOutput}`);
    return res.status(500).json({
      success: false,
      error: 'ML prediction failed. An internal error occurred.'
    });
  });

  // Handle spawn errors (e.g., python executable path is wrong)
  python.on('error', (err) => {
    console.error('Failed to spawn Python process:', err);
    res.status(500).json({ success: false, error: 'Internal server error running ML script.' });
  });
});

// Background mock data generator for testing
function startMockDataGenerator() {
  console.log("[Mock Generator] Starting background telemetry generator for 'ems-esm-test'...");
  setInterval(async () => {
    try {
      const voltage = parseFloat((220 + Math.random() * 20).toFixed(1)); // 220V - 240V
      const current = parseFloat((0.5 + Math.random() * 5).toFixed(2)); // 0.5A - 5.5A
      const real_power = parseFloat(((voltage * current * 0.92) / 1000).toFixed(3)); // kW
      const apparent_power = parseFloat(((voltage * current) / 1000).toFixed(3)); // kVA
      const power_factor = 0.92;

      const mockEntry = new Sensor({
        device_id: "ems-esm-test",
        voltage,
        current,
        real_power,
        apparent_power,
        power_factor,
        time: new Date()
      });

      const saved = await mockEntry.save();
      console.log(`[Mock Generator] Saved telemetry for 'ems-esm-test' - ID: ${saved._id}`);
      
      // Broadcast live update over Socket.io
      io.emit('deviceData', saved);
    } catch (err) {
      console.error("[Mock Generator] Failed to generate mock telemetry:", err);
    }
  }, 10000); // every 10 seconds
}

// Connect and optionally insert ONE sample dataset if collection empty
const uri = process.env.MONGODB_URI || "mongodb+srv://vimuth:<db_password>@ems-device-data-cluster.b4ircf5.mongodb.net/?appName=EMS-Device-data-Cluster";

async function run() {
  try {
    // Use Mongoose to connect with recommended options for Cloud hosting
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to MongoDB via Mongoose!");
    startMockDataGenerator();

    const count = await Sensor.countDocuments().catch(() => 0);
    if (!count) {
      const sampleData = new Sensor({ device_id: "ESP32_01", voltage: 230.5, current: 1.2, power: 276.6 });
      await sampleData.save();
      console.log('Inserted ONE sample dataset');
    }
  } catch (err) {
    console.dir(err);
  }
}
run().catch(console.dir);

const port = process.env.PORT || process.env.BACKEND_PORT || 8080;
// listen on all interfaces so other devices can reach this server
server.listen(port, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  const localIp = Object.values(networkInterfaces).flat().find(i => i.family === 'IPv4' && !i.internal)?.address;
  console.log(`Server listening on port ${port} (Local IP: ${localIp || 'localhost'})`);
});
