let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins a specific poll room to receive live updates
    socket.on('joinPoll', (pollId) => {
      socket.join(`poll_${pollId}`);
      console.log(`📡 Socket ${socket.id} joined poll_${pollId}`);
    });

    socket.on('leavePoll', (pollId) => {
      socket.leave(`poll_${pollId}`);
      console.log(`👋 Socket ${socket.id} left poll_${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
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
