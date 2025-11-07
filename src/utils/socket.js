const { Server } = require('socket.io');
const { eventBus } = require('./eventBus');

let io;
let listenerRegistered = false;

const registerEventListeners = () => {
  if (listenerRegistered) return;
  listenerRegistered = true;

  eventBus.on('status:update', (payload) => {
    if (io) {
      io.emit('status:update', payload);
    }
  });
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_URL || '').split(',').filter(Boolean) || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
  });

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log('Client connected', socket.id);
    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Client disconnected', socket.id);
    });
  });

  registerEventListeners();

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
