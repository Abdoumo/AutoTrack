const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const initDatabase = require('./initDb');

dotenv.config();

// Enforce critical security environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn('⚠️ WARNING [SECURITY]: JWT_SECRET is missing or less than 16 characters. A secure 32+ character key is strongly advised for production.');
}

const app = express();

// Disable technology disclosure header
app.disable('x-powered-by');

// 1. Helmet HTTP Security Headers (OWASP Recommended)
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by reverse proxy or frontend Vite build
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  })
);

// 3. Body Parser with Payload Limit (Mitigates Large Payload Memory Exhaustion DoS)
app.use(express.json({ limit: '50kb' }));

// 4. Rate Limiters
// General API rate limiter (protects against high-frequency DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez patienter 15 minutes.' },
});
app.use('/api/', apiLimiter);

// Strict rate limiter for Authentication (mitigates credential stuffing & brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/register attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Nombre maximal de tentatives atteint. Réessayez dans 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 5. Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint (Safe diagnostic overview)
app.get('/api/health', async (req, res) => {
  const { testConnection } = require('./db');
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    database: {
      connected: dbStatus.connected,
      user: dbStatus.user || null,
      error: dbStatus.error ? 'Database not reachable. Check server/.env DATABASE_URL.' : null,
    },
    timestamp: new Date().toISOString(),
    service: 'AuraTrack PERN Inventory & Risk API',
    security: {
      helmet: true,
      rateLimit: true,
      strictCors: true,
    },
  });
});

// Initialize Cron Jobs
require('./cron/riskDateChecker');

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé.' });
});

// Global Error Handler (Prevents stack traces leaking to clients)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Une erreur interne est survenue.',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 PERN Server running on http://localhost:${PORT}`);
  console.log(`🛡️ Security enabled: Helmet headers, Rate-limiting, Input validation & CORS guard`);
  console.log(`📡 Health Check available at http://localhost:${PORT}/api/health`);
  await initDatabase();
});
