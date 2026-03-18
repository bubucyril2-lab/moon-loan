import { app } from '../server';

// Health check for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel API is running' });
});

export default app;
