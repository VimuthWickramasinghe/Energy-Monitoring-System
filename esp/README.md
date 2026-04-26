# ESP32 Code Project with PlatformIO

This project is designed for the ESP32 microcontroller using the **PlatformIO** ecosystem and the Arduino framework. It includes basic setup for WiFi connectivity and a simple blink example to verify hardware functionality.

## Getting Started

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [PlatformIO IDE Extension](https://platformio.org/platformio-ide)
- ESP32 Development Board
- USB Cable

### Installation

1. Install the PlatformIO extension in VS Code.
2. Clone this repository.
3. Open the project folder.
4. Build and Upload using the PlatformIO toolbar.

## Source Code (`src/main.cpp`)

```cpp
#include <Arduino.h>

// Define LED Pin
#define LED_PIN 2

void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);
  
  // Initialize LED Pin
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("ESP32 Started Successfully");
}

void loop() {
  // Toggle LED
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
```

## Configuration (platformio.ini)
If using PlatformIO, ensure your configuration looks like this:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

------------