require('dotenv').config();
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const seedAdmin = require('./src/seed/adminSeeder');
const seedComplaints = require('./src/seed/complaintSeeder');
const { syncCategoryEnum } = require('./src/utils/categoryHelper');
const { initEscalationMonitor } = require('./src/services/escalationService');

const port = process.env.PORT || 5000;
let server;

const start = async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
    await connectDB();
    await seedAdmin();
    await seedComplaints();
    await syncCategoryEnum();
    server = app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
    initEscalationMonitor();

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  shutdown('unhandledRejection');
});

start();
