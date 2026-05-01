const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const admin = require('firebase-admin');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  volt: Number,
  current1: Number,
  current2: Number,
  current3: Number,
  power1: Number,
  power2: Number,
  power3: Number,
  total_power: Number,
  watt: Number, // Kept for ML compatibility (mapped from total_power)
  temperature: Number,
  humidity: Number,
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

// API endpoint to receive data from ESP
app.post('/send', async (req, res) => {
  try {
    // Basic API Key protection for hardware devices
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.HARDWARE_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    const {
      volt,
      current1, current2, current3,
      power1, power2, power3,
      total_power,
      temperature, humidity
    } = req.body;

    const docObj = {};

    if (typeof volt !== 'undefined' && !isNaN(volt)) docObj.volt = Number(volt);

    if (typeof current1 !== 'undefined' && !isNaN(current1)) docObj.current1 = Number(current1);
    if (typeof current2 !== 'undefined' && !isNaN(current2)) docObj.current2 = Number(current2);
    if (typeof current3 !== 'undefined' && !isNaN(current3)) docObj.current3 = Number(current3);

    if (typeof power1 !== 'undefined' && !isNaN(power1)) docObj.power1 = Number(power1);
    if (typeof power2 !== 'undefined' && !isNaN(power2)) docObj.power2 = Number(power2);
    if (typeof power3 !== 'undefined' && !isNaN(power3)) docObj.power3 = Number(power3);

    if (typeof total_power !== 'undefined' && !isNaN(total_power)) {
      docObj.total_power = Number(total_power);
      docObj.watt = Number(total_power); // Map to watt for ML compatibility
    }

    if (typeof temperature !== 'undefined' && !isNaN(temperature)) docObj.temperature = Number(temperature);
    if (typeof humidity !== 'undefined' && !isNaN(humidity)) docObj.humidity = Number(humidity);

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
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');

    const count = await Sensor.countDocuments().catch(() => 0);
    if (!count) {
      const sampleData = new Sensor({
        volt: 201.5,
        amps: 1.23,
        watt: 283.5,
        temperature: 20.4,
        humidity: 60.2
      });
      await sampleData.save();
      console.log('Inserted ONE sample dataset:', sampleData);
    } else {
      console.log('Collection already contains documents, skipping sample insert.');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const port = process.env.PORT || 5000;
// listen on all interfaces so other devices can reach this server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} (listening on 0.0.0.0)`);
});
