#include <WiFi.h>          // Core library for ESP32 WiFi connectivity and station/AP modes
#include <HTTPClient.h>    // Provides methods to send HTTP requests (GET, POST) to a web server
#include <ArduinoJson.h>   // Used for serializing and deserializing JSON data for API communication
#include <BLEDevice.h>     // Main BLE library to initialize the ESP32 as a Bluetooth device
#include <BLEServer.h>     // Used to create and manage the BLE Server (GATT server)
#include <BLEUtils.h>      // Helper utilities for BLE UUIDs and data formatting
#include <BLE2902.h>       // Enables Client Characteristic Configuration Descriptor (CCCD) for notifications
#include <Preferences.h>   // Provides access to Non-Volatile Storage (NVS) to persist WiFi credentials

// put function declarations here:
// Replace with your network credentials
String provisioned_ssid = "";
String provisioned_password = "";
bool isRegistered = false;
bool shouldConnectWiFi = false;
String device_id = ""; // Dynamically generated using MAC Address

// --- Backend Configuration ---
const char* server_url = "https://emsb.keyblocks.org/test";
const char* api_key = "ems-key-123";

// --- BLE Provisioning Variables ---
// Must match the frontend React app IDs
#define PROVISIONING_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SSID_CHAR_UUID            "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define PASS_CHAR_UUID            "beb5483e-36e1-4688-b7f5-ea07361b26a9"
#define STATUS_CHAR_UUID          "beb5483e-36e1-4688-b7f5-ea07361b26aa"
#define REG_CHAR_UUID             "beb5483e-36e1-4688-b7f5-ea07361b26ab"

// --- Hardware Pins ---
#define RED_LED_PIN 2
#define BOOT_BUTTON_PIN 0  // Standard Boot button on most ESP32s
#define VOLT_SENSOR_PIN 34 // Analog input for ZMPT101B
#define CURR_SENSOR_PIN 35 // Analog input for SCT-013

// --- Power Calculation Parameters ---
const double referenceVoltage = 3.3;
const int adcMax = 4095;
const double mVperAmp = 1000 / 30.0; 
const int bufferSize = 200;
const int sampleDelayUs = 500;
double voltageCalibration = 1.0; // Default, can be updated
const double currentNoiseThreshold = 0.05; // 50mA threshold
const int samplesPerCycle = 40;      // Samples per 50Hz cycle

// Global measurement variables
double voltageOffset = 0;
double currentOffset = 0;
double voltageRMS = 0;
double currentRMS = 0;
double realPower = 0;
double apparentPower = 0;
double powerFactor = 0;
double phaseAngle = 0;
int voltageBuffer[bufferSize];
int currentBuffer[bufferSize];
bool debugMode = true;

// --- Function Prototypes ---
void connectToWiFi();
void setupBLE();
void loadCredentials();
void saveCredentials(String ssid, String pass);
void sampleSynchronized();
void calculatePower();
void sendSensorData();
void calibrateSensors();
void debugReadings();

Preferences preferences;
BLECharacteristic *pStatusCharacteristic = nullptr;

class ProvisioningCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String rxValue = String(pCharacteristic->getValue().c_str());
        rxValue.trim(); // Remove any accidental whitespace or newlines
        
        BLEUUID uuid = pCharacteristic->getUUID();
        if (rxValue.length() > 0) {
            if (uuid.equals(BLEUUID(SSID_CHAR_UUID))) {
                provisioned_ssid = rxValue;
                Serial.print("Received SSID: '");
                Serial.print(provisioned_ssid);
                Serial.print("' (Length: ");
                Serial.print(provisioned_ssid.length());
                Serial.println(")");
            } else if (uuid.equals(BLEUUID(PASS_CHAR_UUID))) {
                provisioned_password = rxValue;
                Serial.print("Received Password: '");
                Serial.print(provisioned_password);
                Serial.print("' (Length: ");
                Serial.print(provisioned_password.length());
                Serial.println(")");
            } else if (uuid.equals(BLEUUID(REG_CHAR_UUID))) {
                if (rxValue == "REGISTERED") {
                    isRegistered = true;
                    Serial.println("Device registered via App. Shutting down BLE...");
                    delay(2000);
                    BLEDevice::deinit(false);
                }
            }
            
            if (provisioned_ssid.length() > 0 && provisioned_password.length() > 0) {
                shouldConnectWiFi = true;
                Serial.println("Credentials received. Attempting WiFi connection...");
            }
        }
    }
};

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  delay(1000);
  
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
  
  // Generate dynamic device identity mapping matching your front-end name filters
  uint64_t chipId = ESP.getEfuseMac();
  device_id = "ems-esp-" + String((uint32_t)(chipId >> 32), HEX) + String((uint32_t)chipId, HEX);
  device_id.toLowerCase();

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(VOLT_SENSOR_PIN, INPUT);
  pinMode(CURR_SENSOR_PIN, INPUT);

  Serial.println("--- EMS Device Initialization ---");
  Serial.printf("Device ID: %s\n", device_id.c_str());
  
  loadCredentials();

  // Check if calibration exists, if not, force calibration
  if (voltageOffset == 0 && currentOffset == 0) {
    Serial.println("No calibration data found! Starting calibration...");
    calibrateSensors();
  }

  if (provisioned_ssid.length() > 0 && WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Only start BLE if we didn't successfully connect to WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Starting BLE Provisioning Server...");
    setupBLE();
  } else {
    Serial.println("WiFi connected. Skipping BLE Provisioning.");
  }
}

void loop() {
  // put your main code here, to run repeatedly:

  // Debug mode - show raw readings first
  if (debugMode) {
    debugReadings();
    debugMode = false;  // Run once, remove this line to keep debugging
  }

  // Check for Serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.equalsIgnoreCase("CALIBRATE")) {
      calibrateSensors();
    }
  }

  // Check for Button Long Press (3 seconds) to reset provisioning
  if (digitalRead(BOOT_BUTTON_PIN) == LOW) {
    unsigned long pressStart = millis();
    while (digitalRead(BOOT_BUTTON_PIN) == LOW) {
      // Rapid blink to indicate reset is pending
      digitalWrite(RED_LED_PIN, !digitalRead(RED_LED_PIN));
      delay(100);
      if (millis() - pressStart > 3000) {
        break;
      }
    }

    if (millis() - pressStart > 3000) {
      Serial.println("Button Reset: Clearing WiFi provisioning data...");
      preferences.begin("wifi-gate", false);
      preferences.remove("ssid");
      preferences.remove("pass");
      preferences.end();
      
      WiFi.disconnect(true);
      provisioned_ssid = "";
      provisioned_password = "";
      shouldConnectWiFi = false;
      Serial.println("Data cleared. Restarting...");
      ESP.restart();
    }
  }

  // Check WiFi connection status
  if (shouldConnectWiFi && WiFi.status() != WL_CONNECTED) {
    shouldConnectWiFi = false; // Reset flag to prevent loop
    connectToWiFi();
  }

  if (WiFi.status() == WL_CONNECTED) {
    static unsigned long lastMsg = 0;
    if (millis() - lastMsg > 10000) {
      sampleSynchronized();
      calculatePower();
      
      Serial.println("\n--- Power Readings ---");
      Serial.printf("Voltage: %.2f V\n", voltageRMS);
      Serial.printf("Current: %.3f A\n", currentRMS);
      Serial.printf("Real Power: %.2f W\n", realPower);
      Serial.printf("Apparent Power: %.2f VA\n", apparentPower);
      Serial.printf("Power Factor: %.3f\n", powerFactor);

      sendSensorData();
      lastMsg = millis();
    }
  } else {
    if (provisioned_ssid.length() > 0) {
        shouldConnectWiFi = true;
    }
    // Waiting for provisioning: Slow blink (every 1 second)
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(RED_LED_PIN, !digitalRead(RED_LED_PIN));
      lastBlink = millis();
    }
  }
}

void setupBLE() {
  BLEDevice::init(device_id.c_str()); 
  BLEServer *pServer = BLEDevice::createServer();
  
  BLEService *pService = pServer->createService(PROVISIONING_SERVICE_UUID);
  
  BLECharacteristic *pSsidCharacteristic = pService->createCharacteristic(
                                         SSID_CHAR_UUID,
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
                                       
  BLECharacteristic *pPassCharacteristic = pService->createCharacteristic(
                                         PASS_CHAR_UUID,
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
                                       
  pStatusCharacteristic = pService->createCharacteristic(
                                         STATUS_CHAR_UUID,
                                         BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
                                       );
  BLECharacteristic *pRegCharacteristic = pService->createCharacteristic(
                                         REG_CHAR_UUID,
                                         BLECharacteristic::PROPERTY_WRITE
                                       );

  pStatusCharacteristic->addDescriptor(new BLE2902());

  ProvisioningCallbacks* pCallbacks = new ProvisioningCallbacks();
  pSsidCharacteristic->setCallbacks(pCallbacks);
  pPassCharacteristic->setCallbacks(pCallbacks);
  pRegCharacteristic->setCallbacks(pCallbacks);

  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(PROVISIONING_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("BLE Device is ready to be provisioned via WebApp.");
}

void connectToWiFi() {
  Serial.print("Connecting to ");
  Serial.println(provisioned_ssid);

  if (provisioned_ssid.length() > 0) {
    WiFi.disconnect(); // Clear any previous state
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.begin(provisioned_ssid.c_str(), provisioned_password.c_str());
  } else {
    return;
  }

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    // Fast blink (every 500ms) while attempting to connect
    digitalWrite(RED_LED_PIN, !digitalRead(RED_LED_PIN));
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 30) { // Timeout after 15 seconds
      Serial.println("\nFailed to connect to WiFi. Please check credentials.");
      provisioned_ssid = ""; // Reset to allow retry
      
      if (pStatusCharacteristic != nullptr) {
        pStatusCharacteristic->setValue("FAILED");
        pStatusCharacteristic->notify();
      }
      return;
    }
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Keep LED solid ON when successfully connected
  digitalWrite(RED_LED_PIN, HIGH);
  
  // Save to NVS now that we know it works
  saveCredentials(provisioned_ssid, provisioned_password);

  // Notify the Web App that the connection was successful
  if (pStatusCharacteristic != nullptr) {
    pStatusCharacteristic->setValue("CONNECTED");
    pStatusCharacteristic->notify();
  }
}

void loadCredentials() {
  preferences.begin("wifi-gate", true);
  provisioned_ssid = preferences.getString("ssid", "");
  provisioned_password = preferences.getString("pass", "");
  
  // Load calibration data
  voltageCalibration = preferences.getDouble("vCal", 1.0);
  voltageOffset = preferences.getDouble("vOff", 0.0);
  currentOffset = preferences.getDouble("cOff", 0.0);
  preferences.end();
  
  if(provisioned_ssid.length() > 0) Serial.println("Loaded stored credentials.");
  if(voltageOffset != 0) Serial.println("Loaded stored calibration data.");
}

void saveCredentials(String ssid, String pass) {
  preferences.begin("wifi-gate", false);
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
  preferences.end();
  Serial.println("Credentials saved to NVS.");
}

void sampleSynchronized() {
  for (int i = 0; i < bufferSize; i++) {
    voltageBuffer[i] = analogRead(VOLT_SENSOR_PIN);
    currentBuffer[i] = analogRead(CURR_SENSOR_PIN);
    delayMicroseconds(sampleDelayUs);
  }
}

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

void sendSensorData() {
  HTTPClient http;

  if (!http.begin(server_url)) return;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);

  // Create a JSON document
  JsonDocument doc;

  doc["device_id"] = device_id;
  doc["voltage"] = voltageRMS;
  doc["current"] = currentRMS;
  doc["apparent_power"] = apparentPower;
  doc["real_power"] = realPower;
  doc["power_factor"] = powerFactor;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println("\nSending payload:");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    Serial.printf("Response from server: %s\n", http.getString().c_str());
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

// Calibrate sensors
void calibrateSensors() {
  Serial.println("\n=== CALIBRATION START ===");
  
  // Calibrate current sensor (zero current)
  Serial.println("Step 1: Current Sensor Calibration");
  Serial.println("Make sure NO LOAD is connected to ACS712!");
  delay(3000);
  
  long currentSum = 0;
  for (int i = 0; i < 1000; i++) {
    currentSum += analogRead(CURR_SENSOR_PIN);
    delay(1);
  }
  currentOffset = currentSum / 1000.0;
  Serial.printf("Current sensor offset: %.2f ADC (%.3f V)\n", 
                currentOffset, (currentOffset * referenceVoltage / adcMax));
  
  // Calibrate voltage sensor (find zero crossing offset)
  Serial.println("\nStep 2: Voltage Sensor Zero Calibration");
  long voltageSum = 0;
  for (int i = 0; i < 1000; i++) {
    voltageSum += analogRead(VOLT_SENSOR_PIN);
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
    int rawADC = analogRead(VOLT_SENSOR_PIN);
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

  // Save calibration to NVM
  preferences.begin("wifi-gate", false);
  preferences.putDouble("vCal", voltageCalibration);
  preferences.putDouble("vOff", voltageOffset);
  preferences.putDouble("cOff", currentOffset);
  preferences.end();
  
  Serial.println("=== CALIBRATION COMPLETE ===\n");
}

// Debug: raw ADC readings
void debugReadings() {
  Serial.println("\n=== RAW ADC DEBUG ===");
  
  // Read raw values
  int vRaw = analogRead(VOLT_SENSOR_PIN);
  int cRaw = analogRead(CURR_SENSOR_PIN);
  
  Serial.printf("Voltage Pin (GPIO%d): ADC = %d (%.3f V)\n", 
                VOLT_SENSOR_PIN, vRaw, vRaw * referenceVoltage / adcMax);
  Serial.printf("Current Pin (GPIO%d): ADC = %d (%.3f V)\n", 
                CURR_SENSOR_PIN, cRaw, cRaw * referenceVoltage / adcMax);
  
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
    int val = analogRead(VOLT_SENSOR_PIN);
    double diff = val - voltageOffset;
    vSumSq += diff * diff;
    delayMicroseconds(500);
  }
  double testRMS = sqrt(vSumSq / 100);
  double testVoltage = (testRMS * referenceVoltage / adcMax) * voltageCalibration;
  Serial.printf("Quick voltage test: %.2f V RMS\n", testVoltage);
}