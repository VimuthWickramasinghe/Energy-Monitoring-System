
# AC Power Monitor for ESP32 with Backend Integration
# Measures AC Current (ACS712) and AC Voltage (ZMPT101B)

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>


// WiFi configuration
const char* ssid = "Janitha";
const char* password = " ";

// Backend configuration
const char* server_ip = "10.82.80.53";  // Your backend server IP
const int server_port = 8080;            // Backend port
const char* api_key = "ems-key-123";
const char* device_id = "esp_esm-01";    // Device identifier

// Pin definitions (ADC1 pins)
const int currentPin = 34;    // ACS712 output on GPIO34 (ADC1_CH6)
const int voltagePin = 35;    // ZMPT101B output on GPIO35 (ADC1_CH7)

// Current sensor parameters (ACS712)
const double mVperAmp = 1000 / 30.0; // 30A version: 33.33mV/A
const double currentNoiseThreshold = 0.05; // 50mA threshold
const double referenceVoltage = 3.3;
const int adcMax = 4095;

// Voltage sensor parameters (ZMPT101B)
const int samplesPerCycle = 40;      // Samples per 50Hz cycle
const int sampleDelayUs = 500;       // 500us = 2kHz sampling (40 samples @ 50Hz)
double voltageCalibration = 1.0;

// Global variables
double voltageOffset = 0;
double currentOffset = 0;
double voltageRMS = 0;
double currentRMS = 0;
double realPower = 0;
double apparentPower = 0;
double powerFactor = 0;
double phaseAngle = 0;

// Buffers for sampling
const int bufferSize = 200;  // Buffer for 5 cycles (40 samples * 5)
int voltageBuffer[bufferSize];
int currentBuffer[bufferSize];

// Timing
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 15000;  // Send every 15 seconds (matching test code)

// Debug variables
bool debugMode = true;

// Function prototypes
void calibrateSensors();
void sampleSynchronized();
void calculatePower();
void sendDataToBackend();
void connectToWiFi();
void debugReadings();

// Calibrate sensors
void calibrateSensors() {
  Serial.println("\n=== CALIBRATION START ===");
  
  // Calibrate current sensor (zero current)
  Serial.println("Step 1: Current Sensor Calibration");
  Serial.println("Make sure NO LOAD is connected to ACS712!");
  delay(3000);
  
  long currentSum = 0;
  for (int i = 0; i < 1000; i++) {
    currentSum += analogRead(currentPin);
    delay(1);
  }
  currentOffset = currentSum / 1000.0;
  Serial.printf("Current sensor offset: %.2f ADC (%.3f V)\n", 
                currentOffset, (currentOffset * referenceVoltage / adcMax));
  
  // Calibrate voltage sensor (find zero crossing offset)
  Serial.println("\nStep 2: Voltage Sensor Zero Calibration");
  long voltageSum = 0;
  for (int i = 0; i < 1000; i++) {
    voltageSum += analogRead(voltagePin);
    delay(1);
  }
  voltageOffset = voltageSum / 1000.0;
  Serial.printf("Voltage sensor zero offset: %.2f ADC (%.3f V)\n", 
                voltageOffset, (voltageOffset * referenceVoltage / adcMax));
  
  // Voltage gain calibration
  Serial.println("\nStep 3: Voltage Gain Calibration");
  Serial.println("You have 60 seconds to connect a multimeter and measure the actual AC voltage");
  Serial.println("Apply known AC voltage (e.g., 220V or 110V) to ZMPT101B");
  
  // Countdown for user to connect multimeter and measure
  for (int countdown = 60; countdown > 0; countdown--) {
    if (countdown % 10 == 0 || countdown <= 5) {
      Serial.printf("Time remaining: %d seconds\n", countdown);
    }
    delay(1000);
  }
  
  double vSumSq = 0;
  for (int i = 0; i < 1000; i++) {
    int rawADC = analogRead(voltagePin);
    double diff = rawADC - voltageOffset;
    vSumSq += diff * diff;
    delayMicroseconds(500);
  }
  double measuredVRMS_raw = sqrt(vSumSq / 1000);
  double measuredVRMS = (measuredVRMS_raw * referenceVoltage / adcMax);
  
  Serial.printf("Measured voltage (raw): %.2f V\n", measuredVRMS);
  Serial.println("\nNow enter the ACTUAL voltage you measured with the multimeter:");
  Serial.print("Enter ACTUAL RMS voltage (e.g., 230): ");
  
  unsigned long inputTimeout = millis() + 30000;  // 30 second timeout for input
  while (!Serial.available()) {
    if (millis() > inputTimeout) {
      Serial.println("\nTimeout! Using default calibration (1.0)");
      voltageCalibration = 1.0;
      Serial.println("=== CALIBRATION COMPLETE ===\n");
      return;
    }
    delay(100);
  }
  
  double actualVoltage = Serial.parseFloat();
  if (actualVoltage > 0) {
    voltageCalibration = actualVoltage / measuredVRMS;
    Serial.printf("Voltage calibration factor: %.3f\n", voltageCalibration);
  } else {
    voltageCalibration = 1.0;
    Serial.println("Using default calibration (1.0)");
  }
  
  Serial.println("=== CALIBRATION COMPLETE ===\n");
}

// Synchronized sampling
void sampleSynchronized() {
  for (int i = 0; i < bufferSize; i++) {
    voltageBuffer[i] = analogRead(voltagePin);
    currentBuffer[i] = analogRead(currentPin);
    delayMicroseconds(sampleDelayUs);
  }
}

// Calculate power
void calculatePower() {
  double vSum = 0, vSumSq = 0;
  double cSum = 0, cSumSq = 0;
  double powerSum = 0;
  
  // Calculate averages (DC offset)
  for (int i = 0; i < bufferSize; i++) {
    vSum += voltageBuffer[i];
    cSum += currentBuffer[i];
  }
  double vAvg = vSum / bufferSize;
  double cAvg = cSum / bufferSize;
  
  // Calculate RMS and real power
  for (int i = 0; i < bufferSize; i++) {
    double vDiff = voltageBuffer[i] - vAvg;
    double cDiff = currentBuffer[i] - cAvg;
    
    vSumSq += vDiff * vDiff;
    cSumSq += cDiff * cDiff;
    
    // Convert to actual values
    double vInstant = (vDiff * referenceVoltage / adcMax) * voltageCalibration;
    double cInstant = (cDiff * referenceVoltage / adcMax) / (mVperAmp / 1000);
    powerSum += vInstant * cInstant;
  }
  
  // Calculate RMS values
  double vRMS_raw = sqrt(vSumSq / bufferSize);
  double cRMS_raw = sqrt(cSumSq / bufferSize);
  
  voltageRMS = (vRMS_raw * referenceVoltage / adcMax) * voltageCalibration;
  currentRMS = (cRMS_raw * referenceVoltage / adcMax) / (mVperAmp / 1000);
  
  // Apply noise threshold
  if (currentRMS < currentNoiseThreshold) {
    currentRMS = 0;
  }
  
  // Calculate powers
  realPower = powerSum / bufferSize;
  
  // Ensure real power isn't negative due to noise
  if (fabs(realPower) < 0.5) {
    realPower = 0;
  }
  
  apparentPower = voltageRMS * currentRMS;
  
  // Calculate power factor
  powerFactor = 0;
  
  if (apparentPower > 0.01) {
    powerFactor = realPower / apparentPower;
  }
  
  // Limit PF
  if (powerFactor > 1.0)
    powerFactor = 1.0;
  
  if (powerFactor < -1.0)
    powerFactor = -1.0;
  
  // Phase angle
  phaseAngle = acos(powerFactor) * 180.0 / PI;
}

// Send data to backend
void sendDataToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }
  
  HTTPClient http;
  
  // Construct the server URL (using HTTP instead of HTTPS)
  String serverUrl = "http://" + String(server_ip) + ":" + String(server_port) + "/send";
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);
  
  // Create a JSON document matching the backend schema
  JsonDocument doc;
  
  // Add data to JSON document (matching the test code format)
  doc["device_id"] = device_id;
  doc["voltage"] = voltageRMS;
  doc["current"] = currentRMS;
  doc["power"] = realPower;  // Using real power as "power" field
  
  // Optional: Include additional fields if your backend supports them
  // doc["apparent_power"] = apparentPower;
  // doc["power_factor"] = powerFactor;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("\n--- Sending to Backend ---");
  Serial.print("URL: ");
  Serial.println(serverUrl);
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.printf("Response from server: %s\n", response.c_str());
    }
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

// Debug: raw ADC readings
void debugReadings() {
  Serial.println("\n=== RAW ADC DEBUG ===");
  
  // Read raw values
  int vRaw = analogRead(voltagePin);
  int cRaw = analogRead(currentPin);
  
  Serial.printf("Voltage Pin (GPIO%d): ADC = %d (%.3f V)\n", 
                voltagePin, vRaw, vRaw * referenceVoltage / adcMax);
  Serial.printf("Current Pin (GPIO%d): ADC = %d (%.3f V)\n", 
                currentPin, cRaw, cRaw * referenceVoltage / adcMax);
  
  // Check for stuck ADC
  if (vRaw == 0 || vRaw == 4095) {
    Serial.println("WARNING: Voltage ADC seems stuck! Check wiring.");
  }
  if (cRaw == 0 || cRaw == 4095) {
    Serial.println("WARNING: Current ADC seems stuck! Check wiring.");
  }
  
  // Check offset calibration
  Serial.printf("\nCurrent Offset: %.2f ADC\n", currentOffset);
  Serial.printf("Voltage Offset: %.2f ADC\n", voltageOffset);
  
  // Quick RMS test
  double vSumSq = 0;
  for (int i = 0; i < 100; i++) {
    int val = analogRead(voltagePin);
    double diff = val - voltageOffset;
    vSumSq += diff * diff;
    delayMicroseconds(500);
  }
  double testRMS = sqrt(vSumSq / 100);
  double testVoltage = (testRMS * referenceVoltage / adcMax) * voltageCalibration;
  Serial.printf("Quick voltage test: %.2f V RMS\n", testVoltage);
}

// Connect to WiFi
void connectToWiFi() {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 20) { // Timeout after 10 seconds
      Serial.println("\nFailed to connect to WiFi. Please check credentials.");
      ESP.restart(); // Restart ESP32 if WiFi connection fails
    }
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Setup
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("AC Power Monitor with Backend Integration");
  Serial.println("========================================\n");
  
  // Configure ADC
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  
  // Test ADC pins
  Serial.println("Testing ADC pins...");
  pinMode(currentPin, INPUT);
  pinMode(voltagePin, INPUT);
  
  // Read initial values
  Serial.printf("GPIO%d initial read: %d\n", currentPin, analogRead(currentPin));
  Serial.printf("GPIO%d initial read: %d\n", voltagePin, analogRead(voltagePin));
  
  // Calibrate sensors
  calibrateSensors();
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\nSystem Ready!");
  Serial.println("========================================\n");
}

// Loop
void loop() {
  // Debug mode - show raw readings first
  if (debugMode) {
    debugReadings();
    debugMode = false;  // Run once, remove this line to keep debugging
  }
  
  // Sample and calculate
  sampleSynchronized();
  calculatePower();
  
  // Display readings
  Serial.println("\n--- Power Readings ---");
  Serial.printf("Voltage: %.2f V\n", voltageRMS);
  Serial.printf("Current: %.3f A\n", currentRMS);
  Serial.printf("Real Power: %.2f W\n", realPower);
  Serial.printf("Apparent Power: %.2f VA\n", apparentPower);
  Serial.printf("Power Factor: %.3f\n", powerFactor);
  Serial.printf("Phase Angle: %.2f degrees\n", phaseAngle);
  
  // Send to backend at specified interval
  unsigned long now = millis();
  if (now - lastSendTime >= sendInterval) {
    if (WiFi.status() == WL_CONNECTED) {
      sendDataToBackend();
    } else {
      Serial.println("WiFi Disconnected. Reconnecting...");
      connectToWiFi();
    }
    lastSendTime = now;
  }
  
  delay(500);  // Short delay between readings
}