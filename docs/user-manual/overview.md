---
sidebar_position: 1
title: User Manual Overview
description: Learn how to navigate and use the Energy Monitoring System (EMS) dashboard and alerts.
---

# User Manual Overview

Welcome to the **Energy Monitoring System (EMS)** user manual. This guide is designed for home owners, building administrators, and energy managers to understand how to interact with the EMS application.

> [!NOTE]
> The EMS portal helps visualize active power consumption, calculate savings, configure threshold alerts, and audit historical reports.

---

## 🖥️ Live Dashboard

The main dashboard provides real-time insights into your electrical consumption:

1. **Current Power Usage Gauge**: Displays real-time wattage consumption (Watts / Kilowatts) updated every few seconds.
2. **Voltage & Current Indicators**: Shows incoming supply voltage (V) and current draw (A) measured at the main distribution board.
3. **Daily Consumption Graph**: Illustrates today's usage pattern compared to the previous day.
4. **Estimated Cost Calculator**: Estimates your monthly electricity bill based on current tariff rates and daily averages.

---

## ⚙️ Setting up a New Device

Follow these steps to integrate your hardware with the EMS platform:

### 1. Physical Installation
> [!CAUTION]
> **Safety First:** Ensure all mains power lines are switched OFF at the circuit breaker before installation.

- Connect the **SCT-013 Current Clamp** around the live wire.
- Connect the **ZMPT101B Voltage Sensor** to the AC source.
- Verify all wiring matches the hardware schematic before powering on.

<!-- [IMAGE: Hardware connection diagram or photo] -->

### 2. WiFi Provisioning & Registration
1. **Enter Pairing Mode:** Power on the device. Wait until the status LED blinks blue, indicating it is in WiFi Provisioning mode.
2. **Enable Bluetooth:** Ensure Bluetooth is enabled on your smartphone or computer.
3. **Add Module:** In the EMS Webapp, navigate to **Devices** and click **Add Module**.
4. **Scan for Device:** Look for a device name starting with `ems-esp-...`.
5. **Configure:** Select your building and phase number (default to Phase 1 for single-phase setups).
6. **Finalize:** Once provisioning is successful, click **Register Device** to link it to your profile.

<!-- [GIF: Screen recording of the WiFi provisioning process] -->
<!-- [VIDEO: Full walkthrough of device registration] -->

### 3. Verify Data
Once registered, navigate to the **Analytics** page to view your real-time energy stream.
---

## 🔔 Alert Configuration

Configure the alerting system to stay notified when power metrics breach safety thresholds or budgets:

1. **Safety Overload Alerts**: Triggered when active current (Amperes) exceeds the safe rating of the household circuit breakers.
2. **Daily Budget Alerts**: Sends notifications when daily consumption exceeds a user-defined threshold (e.g., 20 kWh).
3. **Configuring Alerts**:
   - Navigate to **Settings** > **Alerts** in the webapp.
   - Enter your maximum desired limit.
   - Click **Save**. Alerts will trigger in-app notifications and email warnings.

---

## 📊 Exporting Reports

To perform audits or keep local backups of your power metrics:

- Select a custom date range (e.g., last week, last month) on the **Analytics** page.
- Choose your desired file format:
  - **CSV**: For spreadsheet analysis and graphing.
  - **PDF**: For visual report summaries ready for printing.
- Click **Export Report** to start the download.
