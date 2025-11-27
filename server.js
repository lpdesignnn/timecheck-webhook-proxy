import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const CONVEX_URL = 'https://next-chicken-241.convex.site/raw';

// Log EVERY incoming request
app.use((req, res, next) => {
  console.log(`📨 [${req.method}] ${req.path}`);
  console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse raw text bodies as fallback
app.use(express.text({ type: '*/*', limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'HikVision Webhook Proxy',
    timestamp: new Date().toISOString()
  });
});

// Main webhook endpoint - POST
app.post('/webhook/hikvision', async (req, res) => {
  console.log('🎯 [WEBHOOK POST] Received from HikVision');
  console.log('🎯 Body type:', typeof req.body);
  console.log('🎯 Body:', JSON.stringify(req.body).substring(0, 1000));

  try {
    let bodyToSend = req.body;
    
    // If body is string, try to parse it
    if (typeof req.body === 'string') {
      try {
        bodyToSend = JSON.parse(req.body);
      } catch (e) {
        console.log('⚠️ Body is string, cannot parse as JSON');
      }
    }

    const response = await fetch(CONVEX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyToSend),
    });

    const result = await response.text();
    console.log('✅ Forwarded to Convex:', result);

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to forward webhook' });
  }
});

// Also handle GET (some devices send GET first)
app.get('/webhook/hikvision', (req, res) => {
  console.log('⚠️ [WEBHOOK GET] HikVision sent GET instead of POST');
  res.status(200).send('Webhook endpoint is ready. Use POST to send data.');
});

// Catch-all
app.all('*', async (req, res) => {
  console.log(`⚠️ [CATCH-ALL ${req.method}] ${req.path}`);
  console.log('⚠️ Body:', JSON.stringify(req.body).substring(0, 200));
  
  if (req.method === 'POST') {
    try {
      await fetch(CONVEX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      res.status(200).send('OK');
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  } else {
    res.status(404).send('Not found');
  }
});

// Start server with explicit host binding
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Webhook Proxy running on 0.0.0.0:${PORT}`);
  console.log(`🎯 Ready to receive webhooks from HikVision`);
  console.log(`📡 Will forward to: ${CONVEX_URL}`);
});
