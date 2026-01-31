// api/state.js - Vercel Serverless Function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize state in memory (will reset on cold start)
  let globalState = {
    light: "OFF",
    occupancy: "EMPTY",
    lastUpdate: Date.now(),
    alerts: 0,
    connectedDevices: {},
    adminKey: process.env.ADMIN_KEY || "admin123"
  };

  try {
    const { action, deviceId, key, light, occupancy } = req.body;

    // Clean up old devices
    const now = Date.now();
    Object.keys(globalState.connectedDevices).forEach(id => {
      if (now - globalState.connectedDevices[id] > 300000) {
        delete globalState.connectedDevices[id];
      }
    });

    switch (action) {
      case 'get_state':
        if (deviceId) {
          globalState.connectedDevices[deviceId] = Date.now();
        }
        
        return res.json({
          success: true,
          state: {
            light: globalState.light,
            occupancy: globalState.occupancy,
            lastUpdate: globalState.lastUpdate,
            alerts: globalState.alerts,
            connectedDevices: Object.keys(globalState.connectedDevices).length
          }
        });

      case 'update_state':
        if (key !== globalState.adminKey) {
          return res.status(401).json({
            success: false,
            error: 'Invalid admin key. Use: admin123'
          });
        }

        if (light) globalState.light = light;
        if (occupancy) globalState.occupancy = occupancy;
        
        globalState.lastUpdate = Date.now();

        const alertTriggered = globalState.light === "ON" && globalState.occupancy === "EMPTY";
        
        console.log(`✅ State updated: Light=${globalState.light}, Occupancy=${globalState.occupancy}`);
        
        return res.json({
          success: true,
          state: {
            light: globalState.light,
            occupancy: globalState.occupancy,
            lastUpdate: globalState.lastUpdate
          },
          alertTriggered,
          message: alertTriggered ? '🚨 ALERT! Lights ON + Room EMPTY' : '✅ State updated'
        });

      case 'register_alert':
        globalState.alerts++;
        return res.json({ success: true, alerts: globalState.alerts });

      default:
        return res.json({
          success: true,
          state: {
            light: globalState.light,
            occupancy: globalState.occupancy,
            lastUpdate: globalState.lastUpdate
          }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}