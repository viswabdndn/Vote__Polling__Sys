require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(
  cors({
    origin: true, // Allow local network devices (mobiles/laptops) and localhost
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Online Polling API is running ✅' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
