// api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    service: 'Dressly API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
}