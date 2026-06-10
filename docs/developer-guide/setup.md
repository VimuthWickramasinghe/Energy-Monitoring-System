---
sidebar_position: 1
title: Environment Setup
description: Guide on setting up your local environment for EMS frontend, backend, firmware, and documentation.
---

# Developer Environment Setup

Follow this guide to set up the Energy Monitoring System codebase on your local machine.

---

## 🗂️ Workspace Layout

The repository is structured into distinct project components:

*   [`/frontend/ems-webapp`](file:///c:/projects/ems/frontend/ems-webapp): Next.js application for user dashboards.
*   [`/backend`](file:///c:/projects/ems/backend): Node.js / Express API handling WebSocket data and database routing.
*   [`/firmware`](file:///c:/projects/ems/firmware): C++/Arduino firmware for ESP32 microcontrollers.
*   [`/dev-docs`](file:///c:/projects/ems/dev-docs): Docusaurus developer documentation site.

---

## 🚀 Step-by-Step Setup

### Prerequisites

Ensure you have the following tools installed:
- **Node.js** (v18.x or later)
- **Arduino IDE** or **PlatformIO** (for firmware development)
- **MongoDB** (locally or an Atlas cluster URI)
- **Supabase Account** (for Auth and PostgreSQL)
-  *Mosquito client*
-  *Websockets* Socket.io
-  *Google Cloud*

---

### 1. Set Up the Frontend Webapp

1. Navigate to the frontend directory:
   ```bash
   cd frontend/ems-webapp
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file inside `frontend/ems-webapp/` and populate it with your Firebase/Supabase configuration credentials:

4. Start the development server:
   ```bash
   npm run dev
   ```

---

### 2. Set Up the Documentation Site

1. Navigate to the `dev-docs` directory:
   ```bash
   cd dev-docs
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Docusaurus locally:
   ```bash
   npm run start
   ```
   The site will load at `http://localhost:3000`.

---

## 🔧 Contribution Guidelines

- **Branching Policy**: Always create feature branches from `main` (e.g., `feature/live-graphs`, `bugfix/alert-delay`).
- **Code Style**:
  - Frontend uses Prettier and ESLint. Run `npm run lint` before committing.
  - Firmware should follow clear formatting with descriptive variable names.
