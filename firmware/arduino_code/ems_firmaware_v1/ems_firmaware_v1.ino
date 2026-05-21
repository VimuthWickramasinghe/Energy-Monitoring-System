#include <WiFi.h>          // Core library for ESP32 WiFi connectivity and station/AP modes
#include <HTTPClient.h>    // Provides methods to send HTTP requests (GET, POST) to a web server
#include <ArduinoJson.h>   // Used for serializing and deserializing JSON data for API communication
#include <BLEDevice.h>     // Main BLE library to initialize the ESP32 as a Bluetooth device
#include <BLEServer.h>     // Used to create and manage the BLE Server (GATT server)
#include <BLEUtils.h>      // Helper utilities for BLE UUIDs and data formatting
#include <BLE2902.h>       // Enables Client Characteristic Configuration Descriptor (CCCD) for notifications
#include <Preferences.h>   // Provides access to Non-Volatile Storage (NVS) to persist WiFi credentials
#include "EmonLib.h"       // Library for SCT-013 and ZMPT101B analog sensors

// put function declarations here:
// Replace with your network credentials
String provisioned_ssid = "";
String provisioned_password = "";
bool isRegistered = false;
bool shouldConnectWiFi = false;
String device_id = ""; // Dynamically generated using MAC Address

// --- Backend Configuration ---
const char* server_ip = "10.108.198.53";
const int server_port = 8080;
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

// Calibration constants (Adjust these based on your specific divider/burden resistor)
#define VOLT_CAL 440.0
#define CURR_CAL 30.0

// --- Function Prototypes ---
void connectToWiFi();
void setupBLE();
void loadCredentials();
void saveCredentials(String ssid, String pass);
void sendSensorData();

Preferences preferences;
EnergyMonitor emon1;
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

  emon1.voltage(VOLT_SENSOR_PIN, VOLT_CAL, 1.7); // Voltage: input pin, calibration, phase_shift
  emon1.current(CURR_SENSOR_PIN, CURR_CAL);       // Current: input pin, calibration.

  Serial.println("--- EMS Device Initialization ---");
  Serial.printf("Device ID: %s\n", device_id.c_str());
  
  loadCredentials();

  if (provisioned_ssid.length() > 0) {
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
  preferences.end();
  if(provisioned_ssid.length() > 0) Serial.println("Loaded stored credentials.");
}

void saveCredentials(String ssid, String pass) {
  preferences.begin("wifi-gate", false);
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
  preferences.end();
  Serial.println("Credentials saved to NVS.");
}

void sendSensorData() {
  HTTPClient http;
  char serverUrl[64];
  snprintf(serverUrl, sizeof(serverUrl), "http://%s:%d/test", server_ip, server_port);

  if (!http.begin(serverUrl)) return;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);

  // Create a JSON document
  JsonDocument doc;

  // Calculate energy data (crossings, timeout)
  emon1.calcVI(20, 2000);
  float voltage = emon1.Vrms;
  float current = emon1.Irms;
  float power   = emon1.apparentPower;

  if (voltage < 0 || current < 0) {
    Serial.println("Error reading from sensor");
    http.end();
    return;
  }

  doc["device_id"] = device_id;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["power"] = power;

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