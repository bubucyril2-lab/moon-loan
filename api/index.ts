import { app } from '../server.js';

// Health check for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Vercel API is running',
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

export default app;
