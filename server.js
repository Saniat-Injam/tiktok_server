
import express from "express";
import http from "http";
import { Server } from "socket.io";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";
import { sendCallNotification } from "./fcm_service.js";

dotenv.config();

// ========================================
// 1. FIREBASE ADMIN SETUP
// ========================================
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ========================================
// 2. EXPRESS + SOCKET.IO SETUP
// ========================================
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// ========================================
// 3. IN-MEMORY USER MAP
// ========================================
const users = new Map(); // userId → { socketId, fcmToken }

// ========================================
// 4. SOCKET.IO EVENTS
// ========================================
io.on("connection", (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  // ─── REGISTER USER ─────────────────────
  socket.on("register", (data) => {
    const { userId, fcmToken } = data;
    if (!userId) return;

    users.set(userId, {
      socketId: socket.id,
      fcmToken: fcmToken || null
    });

    console.log(`[REGISTER] ${userId} → Socket: ${socket.id} | FCM: ${fcmToken?.substring(0, 20)}...`);
  });

  // ─── OFFER (CALL INITIATED) ─────────────
  socket.on("offer", async (data) => {
    const { from, to, sdp, type, callerName, isVideo, callId } = data;

    console.log(`[OFFER] From: ${from} → To: ${to} | Video: ${isVideo} | CallID: ${callId}`);
    console.log(`         SDP Length: ${sdp?.length} | Online: ${!!users.get(to)?.socketId}`);

    const receiver = users.get(to);

    if (receiver?.socketId) {
      // Online → Send via Socket
      io.to(receiver.socketId).emit("offer", data);
      console.log(`[SOCKET] Offer forwarded to ${to}`);
    } else {
      // Offline → Send via FCM
      try {
        const userDoc = await admin.firestore().collection("users").doc(to).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (fcmToken) {
          await sendCallNotification(fcmToken, data);
          console.log(`[FCM] Offer sent to ${to}`);
        } else {
          console.log(`[FCM] No FCM token for ${to}`);
        }
      } catch (err) {
        console.error("[FCM ERROR]", err.message);
      }
    }
  });

  // ─── ANSWER ────────────────────────────
  socket.on("answer", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("answer", data);
      console.log(`[ANSWER] Sent to ${data.to}`);
    }
  });

  // ─── ICE CANDIDATE ─────────────────────
  socket.on("ice-candidate", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("ice-candidate", data);
    }
  });

  // ─── END CALL ──────────────────────────
  socket.on("end-call", (data) => {
    const receiver = users.get(data.to);
    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("call-ended", data);
      console.log(`[END-CALL] Signal sent to ${data.to}`);
    }
  });

  // ─── DISCONNECT ────────────────────────
  socket.on("disconnect", () => {
    for (const [userId, info] of users.entries()) {
      if (info.socketId === socket.id) {
        users.delete(userId);
        console.log(`[DISCONNECT] ${userId} removed`);
        break;
      }
    }
  });
});

// ========================================
// 5. HEALTH CHECK
// ========================================
app.get("/", (req, res) => {
  res.send(`
    <h2>WebRTC Signaling Server Running</h2>
    <p>Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
    <p>Online Users: ${users.size}</p>
  `);
});

// ========================================
// 6. START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\nServer running on https://tiktok-server-1g37.onrender.com:${PORT}`);
  console.log(`BD Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}\n`);
});