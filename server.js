import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  sanitizeBody,
  verifyToken
} from './middleware/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { Message } from './models/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
await connectDB();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL]
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS Protection
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

app.use(limiter);

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

app.post('/api/auth/login', authLimiter);
app.post('/api/auth/signup', authLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeBody);
app.use(requestLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Socket.IO with JWT Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  // Verify token
  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  });
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their own room
  socket.join(`user_${socket.userId}`);

  // Handle sending message
  socket.on('send_message', async (data) => {
    try {
      const { recipientId, groupId, content, messageType } = data;

      // Save message to database
      const message = await Message.create({
        sender: socket.userId,
        recipient: recipientId || null,
        group: groupId || null,
        content,
        messageType,
        isEncrypted: true,
        ipAddress: socket.handshake.address
      });

      await message.populate('sender', 'username avatar');

      // Send to recipient or group
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('receive_message', {
          ...message.toObject(),
          isNewMessage: true
        });
      } else if (groupId) {
        io.to(`group_${groupId}`).emit('receive_message', {
          ...message.toObject(),
          isNewMessage: true
        });
      }

      socket.emit('message_sent', { success: true, message });
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Join group
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
    socket.emit('joined_group', { groupId });
  });

  // Leave group
  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  // Typing indicator
  socket.on('user_typing', (data) => {
    const { recipientId, groupId } = data;

    if (recipientId) {
      io.to(`user_${recipientId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.username
      });
    } else if (groupId) {
      socket.to(`group_${groupId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.username
      });
    }
  });

  // Stop typing
  socket.on('user_stop_typing', (data) => {
    const { recipientId, groupId } = data;

    if (recipientId) {
      io.to(`user_${recipientId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    } else if (groupId) {
      socket.to(`group_${groupId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    }
  });

  // Online status
  socket.on('user_online', () => {
    io.emit('user_status_changed', {
      userId: socket.userId,
      status: 'online'
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    io.emit('user_status_changed', {
      userId: socket.userId,
      status: 'offline'
    });
  });
});

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
