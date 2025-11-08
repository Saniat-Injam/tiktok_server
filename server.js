// // Full Express + Socket.IO + FCM integrated server:

// import express from "express";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { readFileSync } from "fs";
// import http from "http";
// import { Server } from "socket.io";
// import { sendCallNotification } from "./fcm_service.js";

// dotenv.config();

// // Initialize Firebase Admin
// const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// let users = {}; // { userId: socketId }

// // --- SOCKET.IO EVENTS ---
// io.on("connection", (socket) => {
//   console.log("🟢 User connected:", socket.id);

//   // Register user
//   socket.on("register", (userId) => {
//     users[userId] = socket.id;
//     console.log(`✅ Registered ${userId} -> ${socket.id}`);
//   });

//   // Handle outgoing call
//   socket.on("call-user", async (data) => {
//     const { callerId, callerName, receiverId, isVideo, roomId, fcmToken } = data;
//     const receiverSocket = users[receiverId];

//     if (receiverSocket) {
//       io.to(receiverSocket).emit("incoming-call", {
//         callerId,
//         callerName,
//         isVideo,
//         roomId,
//       });
//       console.log(`📞 Call signal sent to ${receiverId}`);
//     } else if (fcmToken) {
//       // Receiver is offline → send FCM push
//       await sendCallNotification(fcmToken, data);
//       console.log(`📲 FCM call notification sent to ${receiverId}`);
//     }
//   });

//   // Handle answer
//   socket.on("answer-call", (data) => {
//     const { callerId, sdp } = data;
//     const callerSocket = users[callerId];
//     if (callerSocket) {
//       io.to(callerSocket).emit("call-answered", { sdp });
//       console.log(`✅ Call answered by ${data.receiverId}`);
//     }
//   });

//   // Handle ICE candidates
//   socket.on("ice-candidate", (data) => {
//     const { targetId, candidate } = data;
//     const targetSocket = users[targetId];
//     if (targetSocket) {
//       io.to(targetSocket).emit("ice-candidate", candidate);
//     }
//   });

//   // End call
//   socket.on("end-call", (data) => {
//     const { targetId } = data;
//     const targetSocket = users[targetId];
//     if (targetSocket) {
//       io.to(targetSocket).emit("call-ended");
//       console.log(`❌ Call ended with ${targetId}`);
//     }
//   });

//   // Disconnect
//   socket.on("disconnect", () => {
//     for (const [userId, sockId] of Object.entries(users)) {
//       if (sockId === socket.id) {
//         delete users[userId];
//         console.log(`🔴 User disconnected: ${userId}`);
//         break;
//       }
//     }
//   });
// });

// // --- REST API (for notification testing) ---
// app.post("/send", async (req, res) => {
//   const { title, body, topic, token } = req.body;

//   if (!title || !body || (!topic && !token)) {
//     return res.status(400).json({ success: false, message: "Missing title/body/token/topic" });
//   }

//   const message = {
//     notification: { title, body },
//     ...(topic ? { topic } : { token }),
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ FCM Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get("/", (req, res) => {
//   res.send("✅ WebRTC Signaling + FCM Server running successfully!");
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// server.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Users map: userId -> socketId
const users = new Map();

// --- SOCKET.IO EVENTS ---
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Register user
  socket.on("register", (userId) => {
    users.set(userId, socket.id);
    console.log(`✅ Registered ${userId} -> ${socket.id}`);
  });

  // Call user
  socket.on("call-user", (data) => {
    const { from, to, roomId, isVideo } = data;
    const targetSocket = users.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, roomId, isVideo });
      console.log(`📞 Signaled call to ${to}`);
    } else {
      console.log(`⚠️ User ${to} not online`);
    }
  });

  // Answer call
  socket.on("answer-call", (data) => {
    const { to, sdp } = data;
    const targetSocket = users.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-answered", { sdp });
      console.log(`✅ Call answered for ${to}`);
    }
  });

  // ICE candidates
  socket.on("ice-candidate", (data) => {
    const { to, candidate } = data;
    const targetSocket = users.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", candidate);
    }
  });

  // End call
  socket.on("end-call", (to) => {
    const targetSocket = users.get(to);
    if (targetSocket) io.to(targetSocket).emit("call-ended");
    console.log(`❌ Call ended with ${to}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const [userId, sockId] of users.entries()) {
      if (sockId === socket.id) {
        users.delete(userId);
        console.log(`🔴 User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Health check
app.get("/", (req, res) => res.send("✅ WebRTC Signaling Server running!"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
