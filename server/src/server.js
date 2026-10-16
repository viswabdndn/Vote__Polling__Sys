require('dotenv').config();
const http = require('http');
const { validateEnv } = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');
const { startExpiryJob } = require('./services/pollExpiryService');
const app = require('./app');

// Validate critical environment variables before starting
validateEnv();

// Connect to MongoDB
connectDB();

// Initialize recurring poll expiration checker (runs every 60s)
startExpiryJob(60000);

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { server, app };
