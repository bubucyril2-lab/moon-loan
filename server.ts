import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PORT = 3000;
export const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// Maintenance Mode toggle state (Defaults to true to activate 503 Service Unavailable)
let isMaintenanceMode = process.env.MAINTENANCE_MODE !== 'false';

// Maintenance toggle & status endpoint
app.get('/api/maintenance/status', (req, res) => {
  res.json({ maintenance: isMaintenanceMode });
});

app.post('/api/maintenance/toggle', (req, res) => {
  isMaintenanceMode = !isMaintenanceMode;
  res.json({ maintenance: isMaintenanceMode, message: `Maintenance mode is now ${isMaintenanceMode ? 'ENABLED (503 active)' : 'DISABLED'}` });
});

// 503 Middleware for /api routes when maintenance mode is enabled
app.use('/api', (req, res, next) => {
  // Allow health check and maintenance toggle endpoints
  if (req.path === '/health' || req.path.startsWith('/maintenance')) {
    return next();
  }

  if (isMaintenanceMode) {
    res.setHeader('Retry-After', '3600');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'ECONEST BANK server is currently undergoing scheduled maintenance.',
      statusCode: 503,
      retryAfterSeconds: 3600
    });
  }

  next();
});

// Health check
app.get('/api/health', (req, res) => {
  if (isMaintenanceMode) {
    res.setHeader('Retry-After', '3600');
    return res.status(503).json({ status: 'maintenance', message: '503 Service Unavailable' });
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
