# EMS Firmware v1

This document provides instructions for setting up the Arduino IDE to compile and upload the EMS Firmware (v1) to your ESP32 board. The firmware is designed to run on either a generic ESP32 Dev Module or an ESP32-C3 Super Mini.

## Arduino IDE Setup

Before compiling, ensure you have the ESP32 board definitions installed in your Arduino IDE Boards Manager. You might need to add `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` to your "Additional Board Manager URLs" in `File > Preferences`.

Once the ESP32 boards are installed, configure your Arduino IDE as follows, based on your board type:

---

### For ESP32 Dev Module (e.g., ESP32-WROOM-32)

If you have `#define BOARD_ESP32_DEV_MODULE` uncommented in `ems_firmaware_v1.ino`:

Go to `Tools` and set the following options:

*   **Board:** `ESP32 Dev Module`
*   **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)` (or similar large app partition)
*   **Flash Frequency:** `80MHz`
*   **Upload Speed:** `921600`
*   **CPU Frequency:** `240MHz (WiFi/BT)`
*   **Core Debug Level:** `None`
*   **Erase All Flash Before Sketch Upload:** `Disabled`

---

### For ESP32-C3 Super Mini (or similar C3 boards)

If you have `#define BOARD_ESP32_C3_SUPER_MINI` uncommented in `ems_firmaware_v1.ino`:

Go to `Tools` and set the following options:

*   **Board:** `ESP32C3 Dev Module` or `LOLIN C3 Mini`
*   **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)`
*   **Flash Frequency:** `80MHz`
*   **Upload Speed:** `921600`
*   **USB CDC On Boot:** `Enabled` (Crucial for serial output on native USB)
*   **CPU Frequency:** `160MHz (WiFi)`
*   **Core Debug Level:** `None`
*   **Erase All Flash Before Sketch Upload:** `Disabled`

---

**Important Notes:**
*   Always ensure you select the correct COM port for your device under `Tools > Port`.
*   After uploading, if you don't see serial output, try pressing the physical Reset button on your ESP32 board.
*   If your code exceeds the "Huge APP" partition size, consider optimizing your code or exploring custom partition tables.
