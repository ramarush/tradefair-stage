import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pkg from "pg";
const { Client } = pkg;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users with their socket IDs and user info
const connectedUsers = new Map();

// JWT secret from environment - must match the one in lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024';

// PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/tradefair",
});

// Middleware for socket authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error - no token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('WebSocket JWT decoded:', decoded);
    
    // Fetch user from database to get current roles
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isActive: true,
          isAdmin: true,
          isStaff: true
        }
      });

      if (!user) {
        await prisma.$disconnect();
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        await prisma.$disconnect();
        return next(new Error('Account is inactive'));
      }

      socket.userId = user.id;
      socket.isAdmin = user.isAdmin;
      socket.isStaff = user.isStaff;
      
      await prisma.$disconnect();
      next()
    } catch (dbError) {
      await prisma.$disconnect();
      console.error('Database error during WebSocket auth:', dbError);
      return next(new Error('Authentication database error'));
    }
  } catch (err) {
    console.error('JWT verification error:', err);
    return next(new Error('Authentication error - invalid token'));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected (Admin: ${socket.isAdmin || socket.isStaff})`);
  
  // Store user connection
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    isAdmin: socket.isAdmin || socket.isStaff,
    socket: socket
  });

  // Handle user joining specific rooms
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.userId} joined room: ${room}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    connectedUsers.delete(socket.userId);
  });

  // Send initial connection confirmation
  socket.emit('connected', {
    message: 'Connected to real-time server',
    userId: socket.userId,
    isAdmin: socket.isAdmin || socket.isStaff
  });
});

// Helper functions to get sockets
function getUserSockets(userId) {
  const userConnection = connectedUsers.get(userId);
  return userConnection ? [userConnection.socket] : [];
}

function getAdminSockets() {
  const adminSockets = [];
  connectedUsers.forEach((connection, userId) => {
    if (connection.isAdmin || connection.isStaff) {
      adminSockets.push(connection.socket);
    }
  });
  return adminSockets;
}

// Function to broadcast transaction updates
function broadcastTransactionUpdate(notification) {
  try {
    console.log('Broadcasting notification:', notification);
    
    // Send to the user who owns the transaction (for both create and update)
    const userSockets = getUserSockets(notification.user_id);
    if(notification.event==='UPDATE'){
      userSockets.forEach(socket => {
        socket.emit('transactionUpdateUser', {
          event: notification.event,
          data: notification
        });
      });
    }

    // Send to admin users only for new transactions (event = INSERT)
    if (notification.event === 'INSERT') {
      const adminSockets = getAdminSockets();
      adminSockets.forEach(socket => {
        socket.emit('transactionUpdateAdmin', {
          event: notification.event,
          data: notification
        });
      });
      console.log(`Notified admins about new transaction ${notification.id}`);
    }

  } catch (error) {
    console.error('Error broadcasting transaction update:', error);
  }
}

async function start() {
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Listen for transaction notifications˝
    await client.query("LISTEN transactions_channel");
    console.log("Listening for transaction notifications");

    // Handle PostgreSQL notifications
    client.on("notification", (msg) => {
      console.log("PostgreSQL notification received:", msg.channel);
      try {
        const notification = JSON.parse(msg.payload);
        broadcastTransactionUpdate(notification);
      } catch (error) {
        console.error("Error parsing notification payload:", error);
      }
    });

    // Start the WebSocket server
    const PORT = process.env.WEBSOCKET_PORT || 3001;
    server.listen(PORT, () => {
      console.log(`WebSocket server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Error starting server:", error);
    
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.end();
  server.close();
  process.exit(0);
});

start().catch((err) => console.error("Error:", err));
