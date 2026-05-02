#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// put function declarations here:
int myFunction(int, int);
// --- Configuration ---
// Replace with your network credentials
const char* ssid = "Vimuth_hs";
const char* password = "23456789";

// Replace with your backend server details
// If running locally, this is your computer's IP address on the local network
const char* server_ip = "10.108.198.53";  // Todo: change it to the official backend code
const int server_port = 8080;
const char* api_key = "ems-key-123"; // Todo: Must match HARDWARE_API_KEY in your .env.local

// --- Function Prototypes ---
void connectToWiFi();
void sendMockData();

void setup() {
  // put your setup code here, to run once:
  int result = myFunction(2, 3);
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect.
  }
  
  connectToWiFi();
}

void loop() {
  // put your main code here, to run repeatedly:
  // Check WiFi connection status
  if (WiFi.status() == WL_CONNECTED) {
    sendMockData();
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Wait for 15 seconds before sending the next reading
  delay(15000);
}

// put function definitions here:
int myFunction(int x, int y) {
  return x + y;
}

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
      // You might want to restart the ESP32 here
      ESP.restart();
    }
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendMockData() {
  HTTPClient http;
  
  // Construct the server URL
  String serverUrl = "http://" + String(server_ip) + ":" + String(server_port) + "/send";
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);

  // Create a JSON document. Use https://arduinojson.org/v7/assistant/ to calculate size.
  JsonDocument doc;

  // Generate mock data based on the backend schema in server.js
  float volt = 228.0 + (random(0, 50) / 10.0); // 228.0 - 233.0
  float current1 = 10.0 + (random(0, 50) / 10.0);
  float current2 = 10.0 + (random(0, 50) / 10.0);
  float current3 = 10.0 + (random(0, 50) / 10.0);
  float power1 = volt * current1;
  float power2 = volt * current2;
  float power3 = volt * current3;
  float total_power = power1 + power2 + power3;
  float temperature = 20.0 + (random(0, 100) / 10.0); // 20.0 - 30.0
  float humidity = 50.0 + (random(0, 200) / 10.0); // 50.0 - 70.0

  doc["volt"] = volt;
  doc["current1"] = current1;
  doc["current2"] = current2;
  doc["current3"] = current3;
  doc["power1"] = power1;
  doc["power2"] = power2;
  doc["power3"] = power3;
  doc["total_power"] = total_power;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;

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