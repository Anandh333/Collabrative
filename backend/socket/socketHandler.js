// socket/socketHandler.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSocket = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Join user to their personal room
    socket.join(`user_${socket.user._id}`);

    // Join role-based room
    socket.join(`role_${socket.user.role}`);

    // Handle joining task rooms for real-time updates
    socket.on('joinTask', (taskId) => {
      socket.join(`task_${taskId}`);
      console.log(`User ${socket.user.name} joined task room: ${taskId}`);
    });

    socket.on('leaveTask', (taskId) => {
      socket.leave(`task_${taskId}`);
      console.log(`User ${socket.user.name} left task room: ${taskId}`);
    });

    // Handle real-time task status updates
    socket.on('updateTaskStatus', (data) => {
      // Broadcast to all connected clients
      io.emit('taskStatusUpdated', data);
    });

    // Handle typing indicators for collaborative editing
    socket.on('typing', (data) => {
      socket.to(`task_${data.taskId}`).emit('userTyping', {
        user: socket.user.name,
        taskId: data.taskId
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(`task_${data.taskId}`).emit('userStoppedTyping', {
        user: socket.user.name,
        taskId: data.taskId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = initializeSocket;