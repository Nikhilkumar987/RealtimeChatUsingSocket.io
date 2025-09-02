import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const userSocketMap = {}; // {userId: [socketId1, socketId2, ...]}
const sessionSocketMap = {}; // {sessionId: socketId}

export function getReceiverSocketId(userId) {
  const sockets = userSocketMap[userId];
  return sockets && sockets.length > 0 ? sockets[0] : null; // Return first socket for backward compatibility
}

export function getAllReceiverSocketIds(userId) {
  return userSocketMap[userId] || [];
}

// used to store online users// {userId: socketId}

// Periodic cleanup of stale connections
setInterval(() => {
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  let hasChanges = false;
  
  for (const [userId, socketIds] of Object.entries(userSocketMap)) {
    const validSockets = socketIds.filter(socketId => connectedSockets.includes(socketId));
    if (validSockets.length !== socketIds.length) {
      console.log(`Cleaning up stale connections for user ${userId}:`, socketIds.filter(id => !validSockets.includes(id)));
      userSocketMap[userId] = validSockets;
      hasChanges = true;
    }
  }
  
  // Clean up empty user entries
  for (const [userId, socketIds] of Object.entries(userSocketMap)) {
    if (socketIds.length === 0) {
      delete userSocketMap[userId];
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }
}, 30000); // Check every 30 seconds

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  const sessionId = socket.handshake.query.sessionId;
  
  if (userId) {
    // Store session mapping
    if (sessionId) {
      sessionSocketMap[sessionId] = socket.id;
    }
    
    // Add socket to user's socket list (allow multiple sessions per user)
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    userSocketMap[userId].push(socket.id);
    
    console.log(`User ${userId} connected with socket ${socket.id}, session: ${sessionId}`);
    console.log(`User ${userId} now has ${userSocketMap[userId].length} active sessions`);
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", (reason) => {
    console.log("A user disconnected", socket.id, "Reason:", reason);
    
    if (userId) {
      // Remove socket from user's socket list
      if (userSocketMap[userId]) {
        userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
        if (userSocketMap[userId].length === 0) {
          delete userSocketMap[userId];
        }
      }
      console.log(`User ${userId} disconnected socket ${socket.id}`);
    }
    
    // Clean up session mapping
    if (sessionId && sessionSocketMap[sessionId] === socket.id) {
      delete sessionSocketMap[sessionId];
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };