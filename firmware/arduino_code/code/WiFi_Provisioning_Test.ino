#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// put function declarations here:
// Replace with your network credentials
String provisioned_ssid = "";
String provisioned_password = "";
bool shouldConnectWiFi = false;

// --- BLE Provisioning Variables ---
// Must match the frontend React app IDs
#define PROVISIONING_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SSID_CHAR_UUID            "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define PASS_CHAR_UUID            "beb5483e-36e1-4688-b7f5-ea07361b26a9"
#define STATUS_CHAR_UUID          "beb5483e-36e1-4688-b7f5-ea07361b26aa"

// Define the pin for the Red LED (Adjust if your board uses a different pin)
#define RED_LED_PIN 8

// --- Function Prototypes ---
void connectToWiFi();
void setupBLE();

BLECharacteristic *pStatusCharacteristic = nullptr;

class ProvisioningCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String rxValue = pCharacteristic->getValue();
        if (rxValue.length() > 0) {
            if (String(pCharacteristic->getUUID().toString().c_str()) == String(SSID_CHAR_UUID)) {
                provisioned_ssid = rxValue;
                Serial.print("Received SSID: ");
                Serial.println(provisioned_ssid);
            } else if (String(pCharacteristic->getUUID().toString().c_str()) == String(PASS_CHAR_UUID)) {
                provisioned_password = rxValue;
                Serial.println("Received Password.");
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
  
  Serial.println("--- EMS Device Initialization ---");
  Serial.println("Device Name: esp_esm-01");
  
  if (provisioned_ssid.length() > 0) {
    connectToWiFi();
  }

  Serial.println("Starting BLE Provisioning Server...");
  setupBLE();
}

void loop() {
  // put your main code here, to run repeatedly:

  // Check for Serial commands to reset provisioning
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.equalsIgnoreCase("RESET")) {
      Serial.println("Resetting WiFi provisioning data...");
      WiFi.disconnect(true);
      provisioned_ssid = "";
      provisioned_password = "";
      shouldConnectWiFi = false;
      Serial.println("Provisioning data cleared. Device ready for new credentials.");
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
      Serial.print("WiFi Status: Connected. IP: ");
      Serial.println(WiFi.localIP());
      lastMsg = millis();
    }
  } else {
    // Waiting for provisioning: Slow blink (every 1 second)
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(RED_LED_PIN, !digitalRead(RED_LED_PIN));
      lastBlink = millis();
    }
  }
}

void setupBLE() {
  BLEDevice::init("esp_esm-01"); 
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
  pStatusCharacteristic->addDescriptor(new BLE2902());

  ProvisioningCallbacks* pCallbacks = new ProvisioningCallbacks();
  pSsidCharacteristic->setCallbacks(pCallbacks);
  pPassCharacteristic->setCallbacks(pCallbacks);

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
  
  // Notify the Web App that the connection was successful
  if (pStatusCharacteristic != nullptr) {
    pStatusCharacteristic->setValue("CONNECTED");
    pStatusCharacteristic->notify();
  }
}