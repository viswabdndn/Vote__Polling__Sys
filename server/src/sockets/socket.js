const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
    : ['http://localhost:5173'];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Socket origin not allowed'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate socket handshake using JWT
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      if (!token) {
        return next(new Error('Authentication error: Missing authentication token.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User no longer exists.'));
      }

      if (user.isActive === false) {
        return next(new Error('Authentication error: Account has been deactivated.'));
      }

      // Attach authenticated user to socket instance
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Authenticated socket connected: ${socket.id} (User: ${socket.user.name})`);

    // Strictly validate pollId format before allowing client to join a room
    socket.on('joinPoll', (pollId) => {
      if (typeof pollId === 'string' && /^[0-9a-fA-F]{24}$/.test(pollId)) {
        socket.join(`poll_${pollId}`);
        console.log(`📡 Socket ${socket.id} joined poll_${pollId}`);
      } else {
        socket.emit('socketError', { message: 'Invalid Poll ID provided for room subscription.' });
      }
    });

    socket.on('leavePoll', (pollId) => {
      if (typeof pollId === 'string' && /^[0-9a-fA-F]{24}$/.test(pollId)) {
        socket.leave(`poll_${pollId}`);
        console.log(`👋 Socket ${socket.id} left poll_${pollId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`ℹ️ Socket disconnected (${reason}): ${socket.id}`);
    });

    socket.on('error', (err) => {
      console.error(`⚠️ Socket error (${socket.id}):`, err?.message || err);
    });
  });

  return io;
};

// Emit vote update to all clients viewing a specific poll
const emitVoteUpdate = (pollId, resultsData) => {
  if (io) {
    io.to(`poll_${pollId}`).emit('voteUpdated', resultsData);
    console.log(`📢 Emitted voteUpdated to poll_${pollId}`);
  }
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, emitVoteUpdate, getIO };
