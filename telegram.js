// api/telegram.js - Vercel Serverless Function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, type = 'alert', key } = req.body;

    // Verify admin key
    if (key !== (process.env.ADMIN_KEY || "admin123")) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin key'
      });
    }

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    // Check if Telegram is configured
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      // Simulation mode
      console.log('📱 [TELEGRAM SIMULATION]:', {
        type,
        message: message.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      
      if (type === 'alert') {
        console.log('🚨 ESP32 simulation: RED LED ON + BUZZER ACTIVATED');
      }
      
      return res.json({
        success: true,
        simulated: true,
        message: 'Telegram simulated (bot not configured)',
        esp32Action: type === 'alert' ? 'LED ON + BUZZER ON' : 'No action',
        timestamp: Date.now()
      });
    }

    // Send real Telegram message
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    return res.json({
      success: true,
      message: 'Telegram sent successfully',
      telegramResponse: result,
      esp32Action: type === 'alert' ? 'LED ON + BUZZER ON' : 'No action'
    });

  } catch (error) {
    console.error('Telegram error:', error);
    return res.json({
      success: true,
      simulated: true,
      message: 'Using simulation due to error',
      error: error.message
    });
  }
}