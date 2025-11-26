import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const CONVEX_URL = 'https://next-chicken-241.convex.site/raw';

// Middleware to parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'HikVision Webhook Proxy',
    timestamp: new Date().toISOString()
  });
});

// Main webhook endpoint
app.post('/webhook/hikvision', async (req, res) => {
  console.log('🎯 [WEBHOOK] Received POST from HikVision');
  console.log('🎯 [WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🎯 [WEBHOOK] Body type:', typeof req.body);
  console.log('🎯 [WEBHOOK] Body length:', JSON.stringify(req.body).length);
  console.log('🎯 [WEBHOOK] Body preview:', JSON.stringify(req.body).substring(0, 500));

  try {
    // Forward to Convex
    const response = await fetch(CONVEX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.text();
    console.log('✅ [WEBHOOK] Forwarded to Convex successfully');
    console.log('✅ [WEBHOOK] Convex response:', result);

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [WEBHOOK] Error forwarding to Convex:', error);
    res.status(500).json({ error: 'Failed to forward webhook' });
  }
});

// Catch-all for other POST requests
app.post('*', async (req, res) => {
  console.log('⚠️ [CATCH-ALL] POST to:', req.path);
  console.log('⚠️ [CATCH-ALL] Body:', JSON.stringify(req.body).substring(0, 200));
  
  try {
    const response = await fetch(CONVEX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.text();
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [CATCH-ALL] Error:', error);
    res.status(500).json({ error: 'Failed to forward' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway Webhook Proxy running on port ${PORT}`);
  console.log(`🎯 Ready to receive webhooks from HikVision`);
  console.log(`📡 Will forward to: ${CONVEX_URL}`);
});
