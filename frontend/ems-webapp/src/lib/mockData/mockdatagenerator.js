/**
 * Generates a list of mock sensor data objects.
 * @param {number} count - Number of data points to generate.
 * @returns {string} JSON string of mock sensor data.
 */
export const generateMockData = (count = 20) => {
  const data = [];
  const now = new Date();
  const deviceIds = ['ESP-32-001', 'ESP-32-002', 'ESP-32-003'];

  for (let i = 0; i < count; i++) {
    // Create timestamps in 15-minute intervals going backwards
    const timestamp = new Date(now.getTime() - i * 15 * 60000);
    const deviceId = deviceIds[i % deviceIds.length];
    
    // Generate realistic fluctuating values
    const voltage = parseFloat((228 + Math.random() * 5).toFixed(1));
    const current = deviceId === 'ESP-32-003' ? 0 : parseFloat((Math.random() * 35).toFixed(1));
    const apparent_power = parseFloat((voltage * current).toFixed(2));
    const power_factor = parseFloat((0.8 + Math.random() * 0.15).toFixed(2));
    const real_power = parseFloat((apparent_power * power_factor).toFixed(2));

    data.push({
      device_id: deviceId,
      time: timestamp.toISOString(),
      voltage: voltage,
      current: current,
      apparent_power: apparent_power,
      real_power: real_power,
      power_factor: power_factor
    });
  }

  return JSON.stringify(data);
};

export const mockSensorData = JSON.parse(generateMockData(50));

export const latestMockReading = mockSensorData[0];
