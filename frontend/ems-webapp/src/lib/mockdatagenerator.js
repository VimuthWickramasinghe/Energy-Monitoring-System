import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a list of mock sensor data objects.
 * @param {number} count - Number of data points to generate.
 * @returns {Array} Array of mock sensor data.
 */
export const generateMockData = (count = 20) => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Create timestamps in 5-minute intervals going backwards
    const timestamp = new Date(now.getTime() - i * 5 * 60000);
    
    // Generate realistic fluctuating values
    const voltage = parseFloat((220 + Math.random() * 10).toFixed(2));
    const current = parseFloat((0.5 + Math.random() * 4.5).toFixed(2));
    const power = parseFloat((voltage * current).toFixed(2));

    data.push({
      deviceId: uuidv4(),
      timestamp: timestamp.toISOString(),
      voltage: voltage,
      current: current,
      power: power,
      unit: {
        voltage: "V",
        current: "A",
        power: "W"
      }
    });
  }

  return data;
};

export const mockSensorData = generateMockData(50);

export const latestMockReading = mockSensorData[0];
