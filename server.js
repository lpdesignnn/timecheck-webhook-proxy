import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;
const CONVEX_URL = 'https://next-chicken-241.convex.site/raw';

// Log ALL incoming requests
app.use((req, res, next) => {
  console.log(`📨 [${req.method}] ${req.path}`);
  console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse text as fallback
app.use(express.text({ type: '*/*', limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'HikVision Webhook Proxy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Main webhook endpoint
app.post('/webhook/hikvision', async (req, res) => {
  console.log('🎯 [WEBHOOK] Received POST from HikVision');
  console.log('🎯 Body type:', typeof req.body);
  console.log('🎯 Body:', JSON.stringify(req.body).substring(0, 1000));

  try {
    let bodyToSend = req.body;
    
    if (typeof req.body === 'string') {
      try {
        bodyToSend = JSON.parse(req.body);
      } catch (e) {
        console.log('⚠️ Body is string, sending as-is');
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

// GET endpoint (some devices test with GET first)
app.get('/webhook/hikvision', (req, res) => {
  console.log('⚠️ [WEBHOOK GET] Received GET request');
  res.status(200).send('Webhook endpoint ready. Use POST to send data.');
});

// Catch-all
app.all('*', (req, res) => {
  console.log(`⚠️ [CATCH-ALL ${req.method}] ${req.path}`);
  res.status(404).send('Not found');
});

// CRITICAL: Bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
  console.log(`🎯 Ready to receive webhooks`);
  console.log(`📡 Will forward to: ${CONVEX_URL}`);
});
