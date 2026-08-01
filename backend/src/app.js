require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const staffRoutes = require('./routes/staffRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(compression());

// HTTP Request and Response-Time Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`\n[${req.method}] ${req.originalUrl}\nResponse Time: ${duration}ms\n`);
  });
  next();
});

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173, https://campuscare-ruby.vercel.app')
    .split(',')
    .map((url) => url.trim())
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

app.get('/api/health', async (req, res) => {
  const start = Date.now();
  const isDbConnected = mongoose.connection.readyState === 1;
  let dbResponseTime = '0ms';
  if (isDbConnected) {
    try {
      await mongoose.connection.db.admin().ping();
      dbResponseTime = `${Date.now() - start}ms`;
    } catch (err) {
      // ignore
    }
  }
  res.json({
    success: true,
    database: isDbConnected ? 'connected' : 'disconnected',
    responseTime: dbResponseTime
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/student', studentRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

