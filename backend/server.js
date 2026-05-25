const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
 
const express = require('express');
const mongoose = require('mongoose'); // Kept for Schema/Model functionality
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

const corsOptions = {
  // Use '*' to allow all local network devices during development
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
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

// listen on all interfaces so other devices can reach this server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

// MongoDB connection (dotenv)
const mongoUri = process.env.MONGODB_URI;
mongoose.set('strictQuery', false);

// Schema (kept because you requested to store one dataset)
const SensorSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  voltage: Number,
  current: Number,
  power: Number,
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
      power,
    } = req.body;

    const docObj = { device_id };
    if (typeof voltage !== 'undefined' && !isNaN(voltage)) docObj.voltage = Number(voltage);
    if (typeof current !== 'undefined' && !isNaN(current)) docObj.current = Number(current);
    if (typeof power !== 'undefined' && !isNaN(power)) docObj.power = Number(power);
    
    if (Object.keys(docObj).length === 0) {
      console.log('No valid fields in incoming body:', req.body);
      return res.status(400).json({ error: 'No valid sensor fields in body' });
    }

    const data = new Sensor(docObj);
    const saved = await data.save();
    console.log('Saved document id:', saved._id.toString());
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

// Connect and optionally insert ONE sample dataset if collection empty
const uri = process.env.MONGODB_URI || "mongodb+srv://vimuth:<db_password>@ems-device-data-cluster.b4ircf5.mongodb.net/?appName=EMS-Device-data-Cluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Maintain mongoose connection for the Schema/Models used in endpoints
    await mongoose.connect(uri);

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

const port = process.env.BACKEND_PORT || 8080;
// listen on all interfaces so other devices can reach this server
app.listen(port, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  const localIp = Object.values(networkInterfaces).flat().find(i => i.family === 'IPv4' && !i.internal)?.address;
  console.log(`Server listening on port ${port} (Local IP: ${localIp || 'localhost'})`);
});
