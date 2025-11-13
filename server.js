// import express from "express";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import http from "http";
// import { Server } from "socket.io";
// import { sendCallNotification } from "./fcm_service.js";

// // Load environment variables
// dotenv.config();

// // Handle unexpected errors safely
// process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
// process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));

// // Setup Firebase Admin SDK
// const serviceAccount = {
//   type: process.env.FIREBASE_TYPE,
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//   client_email: process.env.FIREBASE_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_CLIENT_ID,
//   auth_uri: process.env.FIREBASE_AUTH_URI,
//   token_uri: process.env.FIREBASE_TOKEN_URI,
//   auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
//   client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
//   universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
// };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// // Express setup
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Socket.io setup
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
//   transports: ["websocket", "polling"],
// });

// // Active users
// const users = new Map();

// io.on("connection", (socket) => {
//   console.log("🟢 User connected:", socket.id);

//   socket.on("register", (data) => {
//     const { userId, fcmToken } = data;
//     users.set(userId, { socketId: socket.id, fcmToken });
//     console.log(`✅ Registered ${userId} -> ${socket.id}`);
//   });

//   socket.on("call-user", async (data) => {
//     const { from, to, callerName, roomId, isVideo, fcmToken } = data;
//     const receiver = users.get(to);

//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("incoming-call", { from, callerName, roomId, isVideo });
//       console.log(`📞 Call signal sent to ${to}`);
//     } else if (fcmToken) {
//       await sendCallNotification(fcmToken, { ...data, receiverId: to });
//       console.log(`📲 FCM call notification sent to ${to}`);
//     }
//   });

//   socket.on("offer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("offer", data);
//   });

//   socket.on("answer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("answer", data);
//   });

//   socket.on("ice-candidate", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("ice-candidate", data);
//   });

//   socket.on("end-call", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("call-ended");
//     console.log(`❌ Call ended with ${data.to}`);
//   });

//   socket.on("disconnect", () => {
//     for (const [userId, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(userId);
//         console.log(`🔴 User disconnected: ${userId}`);
//         break;
//       }
//     }
//   });

//   socket.on("connect_error", (err) => console.log("Connect error:", err));
// });

// // REST API
// app.post("/send", async (req, res) => {
//   const { title, body, token, topic } = req.body;
//   if (!title || !body || (!token && !topic))
//     return res.status(400).json({ success: false, message: "Missing title/body/token/topic" });

//   const message = { notification: { title, body }, ...(token ? { token } : { topic }) };

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
import http from "http";
import { Server } from "socket.io";
import { sendCallNotification } from "./fcm_service.js";

// Load environment variables
dotenv.config();

// Handle unexpected errors safely
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));

// Setup Firebase Admin SDK
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

// Active users
const users = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("register", (data) => {
    const { userId, fcmToken } = data;
    users.set(userId, { socketId: socket.id, fcmToken });
    console.log(`✅ Registered ${userId} -> ${socket.id}`);
  });

  socket.on("offer", async (data) => {
    const { from, to, sdp, type, callerName, isVideo } = data;
    const receiver = users.get(to);

    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("offer", data);
      console.log(`📞 Offer sent to ${to}`);
    } else {
      // Fetch FCM token from Firestore for offline users
      const receiverDoc = await admin.firestore().collection('users').doc(to).get();
      const fcmToken = receiverDoc.data()?.fcmToken;
      if (fcmToken) {
        await sendCallNotification(fcmToken, data);
        console.log(`📲 FCM call notification sent to ${to}`);
      } else {
        console.log(`❌ No FCM token for ${to}`);
      }
    }
  });

  socket.on("answer", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) io.to(receiver.socketId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) io.to(receiver.socketId).emit("ice-candidate", data);
  });

  socket.on("end-call", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) io.to(receiver.socketId).emit("call-ended");
    console.log(`❌ Call ended with ${data.to}`);
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

// REST API
app.post("/send", async (req, res) => {
  const { title, body, token, topic } = req.body;
  if (!title || !body || (!token && !topic))
    return res.status(400).json({ success: false, message: "Missing title/body/token/topic" });

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