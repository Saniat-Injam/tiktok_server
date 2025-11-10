
// // server.js
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

// // Map of users: userId -> { socketId, fcmToken }
// const users = new Map();

// // --- SOCKET.IO EVENTS ---
// io.on("connection", (socket) => {
//   console.log("🟢 User connected:", socket.id);

//   // Register user
//   socket.on("register", (data) => {
//     const { userId, fcmToken } = data;
//     users.set(userId, { socketId: socket.id, fcmToken });
//     console.log(`✅ Registered ${userId} -> ${socket.id}`);
//   });

//   // Outgoing call
//   socket.on("call-user", async (data) => {
//     const { from, to, callerName, roomId, isVideo } = data;
//     const receiver = users.get(to);

//     if (receiver) {
//       io.to(receiver.socketId).emit("incoming-call", {
//         from,
//         callerName,
//         roomId,
//         isVideo,
//       });
//       console.log(`📞 Call signal sent to ${to}`);
//     } else {
//       // User offline → send FCM
//       const fcmToken = receiver?.fcmToken || data.fcmToken;
//       if (fcmToken) {
//         await sendCallNotification(fcmToken, { ...data, receiverId: to });
//         console.log(`📲 FCM call notification sent to ${to}`);
//       }
//     }
//   });

//   // Offer
//   socket.on("offer", (data) => {
//     const { to } = data;
//     const receiver = users.get(to);
//     if (receiver) {
//       io.to(receiver.socketId).emit("offer", data);
//       console.log(`📤 Offer forwarded to ${to}`);
//     }
//   });

//   // Answer
//   socket.on("answer", (data) => {
//     const { to } = data;
//     const receiver = users.get(to);
//     if (receiver) {
//       io.to(receiver.socketId).emit("answer", data);
//       console.log(`📥 Answer forwarded to ${to}`);
//     }
//   });

//   // ICE candidates
//   socket.on("ice-candidate", (data) => {
//     const { to } = data;
//     const receiver = users.get(to);
//     if (receiver) {
//       io.to(receiver.socketId).emit("ice-candidate", data);
//     }
//   });

//   // End call
//   socket.on("end-call", (data) => {
//     const { to } = data;
//     const receiver = users.get(to);
//     if (receiver) {
//       io.to(receiver.socketId).emit("call-ended");
//       console.log(`❌ Call ended with ${to}`);
//     }
//   });

//   // Disconnect
//   socket.on("disconnect", () => {
//     for (const [userId, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(userId);
//         console.log(`🔴 User disconnected: ${userId}`);
//         break;
//       }
//     }
//   });
// });

// // --- REST API for testing FCM ---
// app.post("/send", async (req, res) => {
//   const { title, body, token, topic } = req.body;
//   if (!title || !body || (!token && !topic)) {
//     return res.status(400).json({ success: false, message: "Missing title/body/token/topic" });
//   }

//   const message = {
//     notification: { title, body },
//     ...(token ? { token } : { topic }),
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ FCM Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get("/", (req, res) => res.send("✅ WebRTC Signaling + FCM Server running successfully!"));

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import http from "http";
import { Server } from "socket.io";
import { sendCallNotification } from "./fcm_service.js";

dotenv.config();

const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("register", (data) => {
    const { userId, fcmToken } = data;
    users.set(userId, { socketId: socket.id, fcmToken });
    console.log(`✅ Registered ${userId} -> ${socket.id}`);
  });

  socket.on("call-user", async (data) => {
    const { from, to, callerName, roomId, isVideo, fcmToken } = data;
    const receiver = users.get(to);

    if (receiver && receiver.socketId) {
      io.to(receiver.socketId).emit("incoming-call", { from, callerName, roomId, isVideo });
      console.log(`📞 Call signal sent to ${to}`);
    } else if (fcmToken) {
      await sendCallNotification(fcmToken, { ...data, receiverId: to });
      console.log(`📲 FCM call notification sent to ${to}`);
    }
  });

  socket.on("offer", (data) => {
    const { to } = data;
    const receiver = users.get(to);
    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("offer", data);
      console.log(`📤 Offer forwarded to ${to}`);
    }
  });

  socket.on("answer", (data) => {
    const { to } = data;
    const receiver = users.get(to);
    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("answer", data);
      console.log(`📥 Answer forwarded to ${to}`);
    }
  });

  socket.on("ice-candidate", (data) => {
    const { to } = data;
    const receiver = users.get(to);
    if (receiver?.socketId) io.to(receiver.socketId).emit("ice-candidate", data);
  });

  socket.on("end-call", (data) => {
    const { to } = data;
    const receiver = users.get(to);
    if (receiver?.socketId) io.to(receiver.socketId).emit("call-ended");
    console.log(`❌ Call ended with ${to}`);
  });

  socket.on("disconnect", () => {
    for (const [userId, info] of users.entries()) {
      if (info.socketId === socket.id) {
        users.delete(userId);
        console.log(`🔴 User disconnected: ${userId}`);
        break;
      }
    }
  });

  socket.on("connect_error", (err) => console.log("Connect error:", err));
});

// REST API for testing FCM
app.post("/send", async (req, res) => {
  const { title, body, token, topic } = req.body;
  if (!title || !body || (!token && !topic)) return res.status(400).json({ success: false, message: "Missing title/body/token/topic" });

  const message = { notification: { title, body }, ...(token ? { token } : { topic }) };
  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ FCM Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => res.send("✅ WebRTC Signaling + FCM Server running successfully!"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
