const nodemailer = require('nodemailer');

/**
 * ============================================================================
 * ALERT SERVICE MODULE
 * ============================================================================
 * Provides a reusable notification system for energy monitoring alerts.
 * Supports 4 alert types:
 * 1. Energy Overuse Alert
 * 2. Power Spike Alert
 * 3. Unusual Night Usage Alert
 * 4. Voltage Drop (Brownout) Alert
 * ============================================================================
 */

// Initialize Nodemailer transporter
const initializeMailer = () => {
  if (!nodemailer) {
    console.error('[Alert Service] Cannot initialize mailer: nodemailer module is missing.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

let mailer = null;

// Lazy initialize mailer (called once at first use)
const getMailer = () => {
  if (!mailer) {
    mailer = initializeMailer();
  }
  return mailer;
};

/**
 * Send Energy Alert via Email
 * @param {string} alertType - Type of alert (ENERGY_OVERUSE, POWER_SPIKE, NIGHT_USAGE, VOLTAGE_DROP)
 * @param {string} message - Detailed alert message
 * @param {object} sensorData - Current sensor readings
 * @param {string} recipientEmail - Email recipient (defaults to env variable)
 * @returns {Promise<boolean>} - True if email sent successfully
 */
async function sendEnergyAlert(alertType, message, sensorData = {}, recipientEmail = null) {
  try {
    // Use environment variable if no recipient specified
    const recipient = recipientEmail || process.env.ALERT_EMAIL_RECIPIENT;
    
    if (!recipient) {
      console.warn('[Alert Service] No recipient email configured. Set ALERT_EMAIL_RECIPIENT env variable.');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[Alert Service] Email credentials not configured. Set EMAIL_USER and EMAIL_PASS env variables.');
      return false;
    }

    const mailer = getMailer();
    
    if (!mailer) {
      console.warn('[Alert Service] Mailer not initialized. Skipping email.');
      return false;
    }
    
    // Build email subject based on alert type
    const alertTypeNames = {
      ENERGY_OVERUSE: 'Energy Overuse Alert',
      POWER_SPIKE: 'Power Spike Alert',
      NIGHT_USAGE: 'Unusual Night Usage Alert',
      VOLTAGE_DROP: 'Voltage Drop Alert'
    };

    const subject = `[EMS Alert] ${alertTypeNames[alertType] || alertType}`;
    
    // Build email body with sensor data
    const htmlBody = buildAlertEmailHTML(alertType, message, sensorData);
    
    // Send email
    const info = await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: htmlBody,
      text: `${alertTypeNames[alertType]}\n\n${message}`
    });

    console.log(`[Alert Service] Email sent for ${alertType} alert:`, info.messageId);
    return true;

  } catch (error) {
    console.error('[Alert Service] Error sending email:', error.message);
    return false;
  }
}

/**
 * Build HTML email body with alert details
 */
function buildAlertEmailHTML(alertType, message, sensorData) {
  const timestamp = new Date().toLocaleString();
  
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-left: 5px solid #dc3545; padding-left: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #dc3545; font-size: 24px; }
          .message { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .sensor-data { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .sensor-data table { width: 100%; border-collapse: collapse; }
          .sensor-data td { padding: 8px; border-bottom: 1px solid #ddd; }
          .sensor-data td:first-child { font-weight: bold; color: #333; width: 50%; }
          .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .alert-type { display: inline-block; background-color: #dc3545; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Energy Monitoring System Alert</h1>
            <span class="alert-type">${getAlertTypeLabel(alertType)}</span>
          </div>
          
          <div class="message">
            <strong>Alert Details:</strong><br/>
            ${message.replace(/\n/g, '<br/>')}
          </div>

          ${Object.keys(sensorData).length > 0 ? `
            <div class="sensor-data">
              <strong>Current Sensor Readings:</strong>
              <table>
                ${formatSensorDataHTML(sensorData)}
              </table>
            </div>
          ` : ''}

          <div class="footer">
            <strong>Timestamp:</strong> ${timestamp}<br/>
            <strong>System:</strong> Energy Monitoring System (EMS)<br/>
            <em>This is an automated alert. Please check your system immediately.</em>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get readable label for alert type
 */
function getAlertTypeLabel(alertType) {
  const labels = {
    ENERGY_OVERUSE: '🔴 Energy Overuse',
    POWER_SPIKE: '⚡ Power Spike',
    NIGHT_USAGE: '🌙 Night Usage Alert',
    VOLTAGE_DROP: '🔌 Voltage Drop'
  };
  return labels[alertType] || alertType;
}

/**
 * Format sensor data as HTML table rows
 */
function formatSensorDataHTML(sensorData) {
  let rows = '';
  const units = {
    voltage: 'V',
    current: 'A',
    real_power: 'W',
    apparent_power: 'VA',
    power_factor: '(0-1)',
    device_id: ''
  };

  for (const [key, value] of Object.entries(sensorData)) {
    if (value !== null && value !== undefined) {
      const unit = units[key] || '';
      const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
      rows += `<tr><td>${key}</td><td>${displayValue} ${unit}</td></tr>`;
    }
  }
  return rows;
}

// ============================================================================
// ALERT TRIGGER FUNCTIONS
// ============================================================================

/**
 * Check for Energy Overuse Alert
 * Triggered when total power (kW) exceeds safe threshold
 * 
 * @param {number} realPower - Real power in kW
 * @param {number} threshold - Safe power threshold in kW (default: 5)
 * @param {object} sensorData - Full sensor data object
 */
async function checkEnergyOveruse(realPower, sensorData, threshold = 5) {
  if (realPower > threshold) {
    const message = `High energy consumption detected!\n\nCurrent Power: ${realPower.toFixed(2)} kW\nThreshold: ${threshold} kW\n\nPlease check connected appliances and consider reducing usage.`;
    
    await sendEnergyAlert(
      'ENERGY_OVERUSE',
      message,
      sensorData
    );
    return true;
  }
  return false;
}

/**
 * Check for Power Spike Alert
 * Triggered if power consumption jumps drastically in short time
 * 
 * @param {number} currentPower - Current power reading in kW
 * @param {number} previousPower - Previous power reading in kW
 * @param {number} spikeThreshold - Maximum acceptable increase percentage (default: 50%)
 * @param {object} sensorData - Full sensor data object
 */
async function checkPowerSpike(currentPower, previousPower, sensorData, spikeThreshold = 50) {
  if (previousPower === 0 || previousPower === null) {
    return false; // Skip check if no previous reading
  }

  const percentageIncrease = ((currentPower - previousPower) / previousPower) * 100;
  
  if (percentageIncrease > spikeThreshold) {
    const message = `Sudden power spike detected!\n\nPrevious Power: ${previousPower.toFixed(2)} kW\nCurrent Power: ${currentPower.toFixed(2)} kW\nIncrease: ${percentageIncrease.toFixed(1)}%\n\nThis could indicate a fault or sudden device activation. Please investigate.`;
    
    await sendEnergyAlert(
      'POWER_SPIKE',
      message,
      sensorData
    );
    return true;
  }
  return false;
}

/**
 * Check for Unusual Night Usage Alert
 * Triggered if high energy detected during late-night hours (12 AM - 5 AM)
 * when building should be empty/dormant
 * 
 * @param {number} realPower - Real power in kW
 * @param {number} nightThreshold - Minimum power to trigger alert during night (default: 1 kW)
 * @param {object} sensorData - Full sensor data object
 */
async function checkNightUsage(realPower, sensorData, nightThreshold = 1) {
  const now = new Date();
  const hour = now.getHours();
  
  // Check if current time is between 12 AM (0) and 5 AM
  const isNightHours = hour >= 0 && hour < 5;
  
  if (isNightHours && realPower > nightThreshold) {
    const message = `Unusual night time energy usage detected!\n\nTime: ${now.toLocaleTimeString()}\nCurrent Power: ${realPower.toFixed(2)} kW\nNight Threshold: ${nightThreshold} kW\n\nThe building is expected to be dormant during night hours. Please investigate potential security issues or equipment left running.`;
    
    await sendEnergyAlert(
      'NIGHT_USAGE',
      message,
      sensorData
    );
    return true;
  }
  return false;
}

/**
 * Check for Voltage Drop (Brownout) Alert
 * Triggered if voltage falls below safe level (default: 210V)
 * Low voltage can damage equipment
 * 
 * @param {number} voltage - Voltage reading in V
 * @param {number} minVoltage - Minimum safe voltage (default: 210V)
 * @param {object} sensorData - Full sensor data object
 */
async function checkVoltageDrop(voltage, sensorData, minVoltage = 210) {
  if (voltage < minVoltage) {
    const message = `CRITICAL: Voltage drop detected (Brownout Condition)!\n\nCurrent Voltage: ${voltage.toFixed(1)} V\nMinimum Safe: ${minVoltage} V\nDeficit: ${(minVoltage - voltage).toFixed(1)} V\n\nLow voltage can damage sensitive equipment. This is a CRITICAL condition requiring immediate attention. Consider activating backup power systems.`;
    
    await sendEnergyAlert(
      'VOLTAGE_DROP',
      message,
      sensorData
    );
    return true;
  }
  return false;
}

/**
 * Process sensor data and check all alerts
 * Call this function whenever new sensor data arrives
 * 
 * @param {object} currentSensorData - Current sensor reading
 * @param {object} previousSensorData - Previous sensor reading (for spike detection)
 */
async function processAlerts(currentSensorData, previousSensorData = null) {
  try {
    const {
      voltage = 0,
      current = 0,
      real_power = 0,
      apparent_power = 0,
      power_factor = 0,
      device_id = 'unknown'
    } = currentSensorData;

    const previousPower = previousSensorData?.real_power || null;

    // Check all alert conditions
    await Promise.all([
      checkEnergyOveruse(real_power, currentSensorData, 5),
      checkPowerSpike(real_power, previousPower, currentSensorData, 50),
      checkNightUsage(real_power, currentSensorData, 1),
      checkVoltageDrop(voltage, currentSensorData, 210)
    ]);

  } catch (error) {
    console.error('[Alert Service] Error processing alerts:', error.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sendEnergyAlert,
  checkEnergyOveruse,
  checkPowerSpike,
  checkNightUsage,
  checkVoltageDrop,
  processAlerts,
  getMailer
};
