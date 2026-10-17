const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initDatabase = require('./initDb');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const { testConnection } = require('./db');
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    service: 'AuraTrack PERN Inventory & Risk API',
  });
});

// Initialize Cron Jobs
require('./cron/riskDateChecker');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 PERN Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check available at http://localhost:${PORT}/api/health`);
  await initDatabase();
});
