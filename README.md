# Energy-Monitoring-System
Monorepo 
Energy monitoring system with Wi-Fi and PLC (Power Line communication between devices) 

## File Structure
```text
├── backend/                   # Express.js API server
├── frontend/ems-webapp/       # Next.js web dashboard
├── firmware/ems-platformio/   # PlatformIO firmware for ESP32
├── design/                    # Sketches of the design Drawio
├── hardware/                  # schematics and Proteus Project/Ki-cad Project files
├── Research/                  # Matlab simulink files for simulation
└── README.md                  # Project overview
```


Backend express.js
Frontend next.js
Database mongoDB
esp32 code platformIO framework arduino
## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (Local or Atlas)
- **PlatformIO VS code extension** (for ESP32 development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Energy-Monitoring-System.git
   cd Energy-Monitoring-System
   ```

2. **Backend Setup:**
   Download Node.js  https://nodejs.org/en/download
   ```bash
   cd backend
   npm install
   cp .env.example .env # Configure your MongoDB URI and Port
   npm start
   ```

3. **Frontend Setup:**
   Download Node.js  https://nodejs.org/en/download
   ```bash
   cd frontend/ems-webapp
   npm install
   npm run dev
   ```

4. **Hardware Setup (ESP32):**
   - Open the `firmware/esp-platformio` folder in PlatformIO.
   - Build and upload the firmware to your ESP32 device.

### Features
- Real-time energy consumption tracking.
- Hybrid communication (Wi-Fi + PLC).
- Interactive dashboard for data visualization.
- Historical data logging and reporting.
