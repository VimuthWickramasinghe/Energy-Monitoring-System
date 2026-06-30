#include <WiFi.h>            // Core library for ESP32 WiFi connectivity and station/AP modes
#include <WiFiClientSecure.h> // FIX: needed for HTTPS fallback POST (server_url is https://)
#include <HTTPClient.h>      // Provides methods to send HTTP requests (GET, POST) to a web server
#include <ArduinoJson.h>     // Used for serializing and deserializing JSON data for API communication
#include <BLEDevice.h>       // Main BLE library to initialize the ESP32 as a Bluetooth device
#include <BLEServer.h>       // Used to create and manage the BLE Server (GATT server)
#include <BLEUtils.h>        // Helper utilities for BLE UUIDs and data formatting
#include <BLE2902.h>         // Enables Client Characteristic Configuration Descriptor (CCCD) for notifications
#include <Preferences.h>     // Provides access to Non-Volatile Storage (NVS) to persist WiFi credentials
#include <PubSubClient.h>    // MQTT Client Library

// ============================================================================
//  BOARD SELECTION  --  Uncomment exactly ONE line.
// ============================================================================
// #define BOARD_ESP32_DEV_MODULE     // ESP32 DevKitC, WROOM/WROVER (e.g. ESP32-WROOM-32)
#define BOARD_ESP32_C3_SUPER_MINI     // ESP32-C3 Super Mini / C3-MINI-1 boards

// ----- Sensor type -----
#define USE_HALL_EFFECT_SENSOR true   // true = ACS712 (hall), false = SCT-013 clamp

// mqtt setup variables
const char *mqtt_broker = "34.142.217.143";
const int mqtt_port = 1883;
String mqtt_topic = "";
const char *mqtt_user = "vimuthwic3";
const char *mqtt_pass = "vimpra25";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// put function declarations here:
// Replace with your network credentials
String provisioned_ssid = "";
String provisioned_password = "";
bool USE_MQTT = true;
bool isRegistered = true;          // NOTE: set false to actually enforce the BLE registration gate
bool shouldConnectWiFi = false;
String device_id = "";             // Dynamically generated using MAC Address

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

// ============================================================================
//  BOARD-SPECIFIC PIN MAP
// ============================================================================
#if defined(BOARD_ESP32_DEV_MODULE)
  #define RED_LED_PIN     2      // Onboard LED on most ESP32 dev boards
  #define LED_ACTIVE_LOW  false  // dev-module LED is active HIGH
  #define BOOT_BUTTON_PIN 0      // BOOT button = GPIO0 on classic ESP32
  #define VOLT_SENSOR_PIN 34     // ZMPT101B  -> ADC1_CH6 (input-only pin)
  #if USE_HALL_EFFECT_SENSOR
    #define CURR_SENSOR_PIN 33   // ACS712    -> ADC1_CH5
  #else
    #define CURR_SENSOR_PIN 35   // SCT-013   -> ADC1_CH7 (input-only pin)
  #endif

#elif defined(BOARD_ESP32_C3_SUPER_MINI)
  #define RED_LED_PIN     8      // FIX: onboard LED is GPIO8 on the C3 SuperMini (was 7)
  #define LED_ACTIVE_LOW  true   // FIX: C3 SuperMini onboard LED is active LOW
  #define BOOT_BUTTON_PIN 9      // FIX: BOOT button = GPIO9 on the C3 (was global 0)
  #define VOLT_SENSOR_PIN 1      // ZMPT101B  -> ADC1_CH1
  #if USE_HALL_EFFECT_SENSOR
    #define CURR_SENSOR_PIN 0    // FIX: ACS712 -> ADC1_CH0 (was GPIO2, a strapping pin)
  #else
    #define CURR_SENSOR_PIN 3    // SCT-013   -> ADC1_CH3
  #endif

#else
  #error "Define your board: BOARD_ESP32_DEV_MODULE or BOARD_ESP32_C3_SUPER_MINI"
#endif

// Polarity-aware LED helper (so 'on' means lit on both boards)
inline void ledWrite(bool on) {
  digitalWrite(RED_LED_PIN, (LED_ACTIVE_LOW ? !on : on));
}

#if USE_HALL_EFFECT_SENSOR
  const float hall_sensitivity = 0.185; // 185 mV/A for 5A module
#else
  // const float sct_sensitivity = ... // If SCT-013 specific sensitivity is needed, define here
#endif

// --- Power Calculation Parameters ---
const double referenceVoltage = 3.3;
const int adcMax = 4095;
const double mVperAmp = 1000 / 30.0;
const float voltageDividerRatio = (18.8 / 6.8); // For Hall Effect scaling
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
bool reconnect_mqtt();

Preferences preferences;
BLECharacteristic *pStatusCharacteristic = nullptr;

class ProvisioningCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String rxValue = String(pCharacteristic->getValue().c_str());
        rxValue.trim();

        if (rxValue.length() == 0) return;

        BLEUUID uuid = pCharacteristic->getUUID();

        if (uuid.equals(BLEUUID(SSID_CHAR_UUID))) {
            provisioned_ssid = rxValue;
            // Clear the old password and connection flag to wait for a new password.
            provisioned_password = "";
            shouldConnectWiFi = false;
            Serial.print("Received SSID: '");
            Serial.print(provisioned_ssid);
            Serial.println("'");
        } else if (uuid.equals(BLEUUID(PASS_CHAR_UUID))) {
            provisioned_password = rxValue;
            Serial.print("Received Password of length: ");
            Serial.println(provisioned_password.length());
        } else if (uuid.equals(BLEUUID(REG_CHAR_UUID))) {
            if (rxValue == "REGISTERED") {
                isRegistered = true;
                Serial.println("Device registration status set to REGISTERED.");
                // We no longer shut down BLE here. It will be shut down after WiFi connects.
            }
        }

        // Check if we have a complete, fresh set of credentials and haven't tried to connect yet.
        if (provisioned_ssid.length() > 0 && provisioned_password.length() > 0 && !shouldConnectWiFi) {
            shouldConnectWiFi = true;
            Serial.println("SSID and Password received. Triggering WiFi connection attempt.");
        }
    }
};

// FIX: bounded retry. Returns true if connected, false after giving up so the
// HTTP fallback path can run instead of blocking forever.
bool reconnect_mqtt() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 3) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "EMS-ESP32-";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      return true;
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying...");
      attempts++;
      delay(2000);
    }
  }
  return mqttClient.connected();
}

void setup()
{
  // put your setup code here, to run once:
  Serial.begin(115200);
  delay(2000); // Increased delay to allow stable power-up

  pinMode(RED_LED_PIN, OUTPUT);
  ledWrite(false);                       // start with LED off regardless of polarity
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);

  device_id = "ems-esp-dcb1f6641d44"; // Hardcoded device ID
  device_id.toLowerCase();
  mqtt_topic = "ems/devices/" + device_id + "/data";

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

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
  if (USE_MQTT)
  {
    mqttClient.setServer(mqtt_broker, mqtt_port);
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
  // Add current sensor type
  #if USE_HALL_EFFECT_SENSOR
    Serial.println("ACS712 Hall Effect");
  #else
      Serial.println("SCT-013 Clamp");
  #endif

      sendSensorData();
      lastMsg = millis();
    }
  } else {
    // If WiFi is not connected, just wait for provisioning.
    // The shouldConnectWiFi flag is set by the BLE callback when credentials are received.

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
    WiFi.setAutoReconnect(true); // FIX: recover automatically if the AP drops
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

  // Keep LED solid ON when successfully connected (polarity-aware)
  ledWrite(true);

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
  // For voltage, we use the pre-calibrated voltageOffset as the stable DC bias.
  // For current, we calculate the average of the current buffer to remove its DC offset.
  for (int i = 0; i < bufferSize; i++) {
    cSum += currentBuffer[i];
  }
  double cAvg = cSum / bufferSize;

  // Calculate RMS and real power
  for (int i = 0; i < bufferSize; i++) {
    double vDiff = voltageBuffer[i] - voltageOffset; // Use calibrated DC offset for voltage
    double cDiff = currentBuffer[i] - cAvg;

    vSumSq += vDiff * vDiff;
    cSumSq += cDiff * cDiff;

    // Convert to actual values
    double vInstant = (vDiff * referenceVoltage / adcMax) * voltageCalibration;
    double cInstant;
    #if USE_HALL_EFFECT_SENSOR
      float sensorVoltage = ((double)currentBuffer[i] / adcMax) * referenceVoltage * voltageDividerRatio;
      cInstant = (sensorVoltage - 2.5) / hall_sensitivity;
    #else
      cInstant = (cDiff * referenceVoltage / adcMax) / (mVperAmp / 1000);
    #endif
    powerSum += vInstant * cInstant;
  }

  // Calculate RMS values
  double vRMS_raw = sqrt(vSumSq / bufferSize);
  double cRMS_raw = sqrt(cSumSq / bufferSize);

  voltageRMS = (vRMS_raw * referenceVoltage / adcMax) * voltageCalibration;

  #if USE_HALL_EFFECT_SENSOR
    // For Hall effect, we use the instantaneous calculation logic for RMS
    currentRMS = sqrt(cSumSq / bufferSize) * (referenceVoltage / adcMax) * voltageDividerRatio / hall_sensitivity;
  #else
    currentRMS = (cRMS_raw * referenceVoltage / adcMax) / (mVperAmp / 1000);
  #endif

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

void sendSensorData()
{
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

  bool mqttSuccess = false;

  // --- Try MQTT if enabled ---
  if (USE_MQTT) {
    if (!mqttClient.connected()) {
      reconnect_mqtt();               // FIX: bounded, won't block forever
    }
    if (mqttClient.connected()) {     // FIX: only publish if we actually connected
      mqttClient.loop();
      if (mqttClient.publish(mqtt_topic.c_str(), jsonPayload.c_str())) {
        Serial.println("[MQTT] Payload published successfully.");
        mqttSuccess = true;
      } else {
        Serial.println("[MQTT] Failed to publish payload. Falling back to HTTP.");
      }
    } else {
      Serial.println("[MQTT] Broker unreachable. Falling back to HTTP.");
    }
  }

  // --- Send via HTTP if MQTT is disabled or failed ---
  if (!mqttSuccess) {
    WiFiClientSecure secureClient;    // FIX: TLS client for the https endpoint
    secureClient.setInsecure();       // no cert validation (fallback path only)

    HTTPClient http;
    if (!http.begin(secureClient, server_url))
      return;

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", api_key);

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
