---
sidebar_position: 1
title: System Architecture
description: Technical architecture, hardware schematics, and data flow of the Energy Monitoring System.
---

# System Architecture

The Energy Monitoring System (EMS) is a full-stack IoT platform integrating custom hardware sensors, cloud database storage, and a real-time responsive web dashboard.

---

## 🏗️ Architecture Diagram

Below is the high-level system diagram showing data flows from physical current and voltage sensors to the end-user interface.

```mermaid
graph TD
    subgraph Hardware Layer
        V_Sens[ZMPT101B Voltage Sensor] -->|Analog Signal| ESP32[ESP32 Microcontroller]
        C_Sens[SCT-013 Current Clamp] -->|Analog Signal| ESP32
    end

    subgraph Backend & Communications
        ESP32 -->|WiFi / MQTT or WebSockets| BE[Node.js / Express Backend]
        BE -->|WebSocket Streams| FE[Next.js Webapp]
    end

    subgraph Persistence Layer
        BE -->|Store Real-time Logs| Mongo[(MongoDB Time-Series)]
        BE -->|Sync Core Stats| Supabase[(Supabase / Postgres)]
    end
```

---

## ⚡ Hardware Components

### 1. ESP32 Microcontroller
- Responsible for sampling raw analog signals from the sensors.
- Performs root-mean-square (RMS) computations locally.
- Sends processed telemetry data over local WiFi.

### 2. SCT-013 Current Sensor
- Non-invasive split-core current transformer.
- Measures alternating current (up to 100A).
- Interfaced via an analog burden resistor circuit to translate current ratios into ADC-readable voltage.

### 3. ZMPT101B Voltage Sensor
- Active single-phase AC voltage transformer module.
- Safely steps down high-voltage AC mains to low-voltage AC.
- Incorporates a trim potentiometer for calibrating the output amplitude.

---

## 💾 Database Schema

The EMS uses a hybrid database setup to optimize for both transactional consistency and high-frequency sensor streams:

### Supabase / PostgreSQL (Transactional & Auth)
Stores user accounts, system configuration, alert thresholds, and aggregated historical summaries (daily/monthly totals).

### MongoDB (Time-Series Metrics)
Stores raw, high-frequency telemetry samples:
```json
{
  "sensorId": "ESP32-NODE-01",
  "timestamp": "2026-05-28T11:48:00Z",
  "voltageRMS": 230.4,
  "currentRMS": 4.12,
  "activePower": 949.2,
  "powerFactor": 0.95
}
```
