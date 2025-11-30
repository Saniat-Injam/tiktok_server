


// // server.js
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";
// import { initChatSocket } from "./sockets/chat_socket.js";

// dotenv.config();

// // ========================================
// // 1. FIREBASE ADMIN SETUP
// // ========================================
// let adminInitialized = false;

// try {
//   const serviceAccount = {
//     type: "service_account",
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     client_id: process.env.FIREBASE_CLIENT_ID,
//     auth_uri: "https://accounts.google.com/o/oauth2/auth",
//     token_uri: "https://oauth2.googleapis.com/token",
//     auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//     client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
//   };

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
// }

// // ========================================
// // 2. EXPRESS + SINGLE SOCKET.IO SERVER
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   transports: ["websocket", "polling"],
// });

// // ========================================
// // 3. CHAT NAMESPACE (Messenger-style chat)
// // ========================================
// initChatSocket(io.of("/chat")); // handles P2P chat

// // ========================================
// // 4. CALL NAMESPACE (Audio/Video calling)
// // ========================================
// const callNamespace = io.of("/call");
// const callUsers = new Map(); // userId → { socketId, fcmToken }

// callNamespace.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId;
//   console.log(`[CALL] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // Register user & FCM token
//   socket.on("register", async (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     callUsers.set(finalUserId, { socketId: socket.id, fcmToken: fcmToken || null });

//     if (adminInitialized && fcmToken) {
//       try {
//         await admin.firestore().collection("users").doc(finalUserId).set(
//           { fcmToken },
//           { merge: true }
//         );
//       } catch (err) {
//         console.error("[FIRESTORE ERROR]", err.message);
//       }
//     }
//   });

//   // Handle call signaling
//   ["offer", "answer", "ice-candidate", "end-call"].forEach((event) => {
//     socket.on(event, (data) => {
//       const receiver = callUsers.get(data.to);
//       if (receiver?.socketId) {
//         callNamespace.to(receiver.socketId).emit(event, data);
//       }
//     });
//   });

//   socket.on("disconnect", () => {
//     for (const [id, info] of callUsers.entries()) {
//       if (info.socketId === socket.id) {
//         callUsers.delete(id);
//         break;
//       }
//     }
//   });
// });

// // ========================================
// // 5. REST APIs
// // ========================================
// app.get("/users", async (req, res) => {
//   try {
//     const snapshot = await admin.firestore().collection("users").get();
//     const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/", (req, res) => {
//   res.send(`<h2>Server Running - Chat + Call</h2><p>${new Date()}</p>`);
// });

// // ========================================
// // 6. START SERVER
// // ========================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });





// // server.js
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";
// import { initChatSocket } from "./sockets/chat_socket.js";

// dotenv.config();

// // ========================================
// // 1. FIREBASE ADMIN SETUP
// // ========================================
// let adminInitialized = false;

// try {
//   const serviceAccount = {
//     type: "service_account",
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     client_id: process.env.FIREBASE_CLIENT_ID,
//     auth_uri: "https://accounts.google.com/o/oauth2/auth",
//     token_uri: "https://oauth2.googleapis.com/token",
//     auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//     client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
//   };

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
// }

// // ========================================
// // 2. EXPRESS + SINGLE SOCKET.IO SERVER
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   transports: ["websocket", "polling"],
// });

// // ========================================
// // 3. CHAT NAMESPACE (Messenger-style chat)
// // ========================================
// initChatSocket(io.of("/chat")); // handles P2P chat

// // ========================================
// // 4. CALL NAMESPACE (Audio/Video calling)
// // ========================================
// const callNamespace = io.of("/call");
// const callUsers = new Map(); // userId → { socketId, fcmToken }

// callNamespace.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId;
//   console.log(`[CALL] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // Register user & FCM token
//   socket.on("register", async (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     callUsers.set(finalUserId, { socketId: socket.id, fcmToken: fcmToken || null });

//     if (adminInitialized && fcmToken) {
//       try {
//         await admin.firestore().collection("users").doc(finalUserId).set(
//           { fcmToken },
//           { merge: true }
//         );
//       } catch (err) {
//         console.error("[FIRESTORE ERROR]", err.message);
//       }
//     }
//   });

//   // Handle call signaling
//   ["offer", "answer", "ice-candidate", "end-call"].forEach((event) => {
//     socket.on(event, (data) => {
//       const receiver = callUsers.get(data.to);
//       if (receiver?.socketId) {
//         callNamespace.to(receiver.socketId).emit(event, data);
//       }
//     });
//   });

//   socket.on("disconnect", () => {
//     for (const [id, info] of callUsers.entries()) {
//       if (info.socketId === socket.id) {
//         callUsers.delete(id);
//         break;
//       }
//     }
//   });
// });

// // ========================================
// // 5. LIVE NAMESPACE (Live streaming)
// // ========================================
// const liveNamespace = io.of("/live");
// const uidToSocket = new Map(); // uid -> socketId
// const peerIdToSocket = new Map(); // peerId -> socketId
// const roomToData = new Map(); // roomId -> {host: {peerId, uid, socketId}, coHosts: Map<uid, {peerId, socketId}>, viewers: Map<peerId, socketId>}

// liveNamespace.on("connection", (socket) => {
//   console.log(`[LIVE] Connected: ${socket.id}`);

//   socket.on("register", (data) => {
//     const { uid } = data;
//     if (uid) {
//       socket.data.uid = uid;
//       uidToSocket.set(uid, socket.id);
//     }
//   });

//   socket.on("join-host", (data) => {
//     const { roomId, peerId, uid } = data;
//     socket.data.peerId = peerId;
//     peerIdToSocket.set(peerId, socket.id);
//     if (!roomToData.has(roomId)) {
//       roomToData.set(roomId, {
//         host: { peerId, uid, socketId: socket.id },
//         coHosts: new Map(),
//         viewers: new Map(),
//       });
//       socket.join(roomId);
//       socket.emit("room-created");
//     }
//   });

//   socket.on("join-viewer", (data) => {
//     const { roomId, peerId } = data;
//     socket.data.peerId = peerId;
//     peerIdToSocket.set(peerId, socket.id);
//     const room = roomToData.get(roomId);
//     if (room) {
//       room.viewers.set(peerId, socket.id);
//       socket.join(roomId);
//       liveNamespace.to(room.host.socketId).emit("new-peer", { peerId, role: "viewer" });
//       liveNamespace.in(roomId).emit("viewer-count", room.viewers.size);
//     } else {
//       socket.emit("error", "Room not found");
//     }
//   });

//   socket.on("join-cohost", (data) => {
//     const { roomId, peerId, uid } = data;
//     socket.data.peerId = peerId;
//     peerIdToSocket.set(peerId, socket.id);
//     const room = roomToData.get(roomId);
//     if (room) {
//       room.coHosts.set(uid, { peerId, socketId: socket.id });
//       socket.join(roomId);
//       liveNamespace.to(room.host.socketId).emit("new-peer", { peerId, role: "cohost", uid });
//     } else {
//       socket.emit("error", "Room not found");
//     }
//   });

//   socket.on("start-live", (data) => {
//     const { roomId } = data;
//     if (adminInitialized) {
//       admin.firestore().collection("users").get().then((snapshot) => {
//         snapshot.docs.forEach((doc) => {
//           const token = doc.data().fcmToken;
//           if (token) {
//             admin.messaging().send({
//               token,
//               notification: {
//                 title: "Live Started!",
//                 body: "Tap to join live",
//               },
//               data: {
//                 roomId,
//               },
//             }).catch((err) => console.error("[FCM ERROR]", err));
//           }
//         });
//       }).catch((err) => console.error("[FIRESTORE ERROR]", err));
//     }
//   });

//   // Signaling events
//   ["offer", "answer", "ice-candidate"].forEach((event) => {
//     socket.on(event, (data) => {
//       const { to } = data;
//       const targetSocketId = peerIdToSocket.get(to);
//       if (targetSocketId) {
//         liveNamespace.to(targetSocketId).emit(event, {
//           from: socket.data.peerId,
//           ...data,
//         });
//       }
//     });
//   });

//   socket.on("leave-room", (data) => {
//     const { roomId, peerId } = data;
//     const room = roomToData.get(roomId);
//     if (room) {
//       if (room.host.peerId === peerId) {
//         liveNamespace.in(roomId).emit("room-ended");
//         roomToData.delete(roomId);
//       } else if (room.viewers.has(peerId)) {
//         room.viewers.delete(peerId);
//         liveNamespace.in(roomId).emit("viewer-count", room.viewers.size);
//       } else {
//         for (const [u, info] of room.coHosts.entries()) {
//           if (info.peerId === peerId) {
//             room.coHosts.delete(u);
//             break;
//           }
//         }
//       }
//     }
//     peerIdToSocket.delete(peerId);
//   });

//   socket.on("disconnect", () => {
//     const uid = socket.data.uid;
//     if (uid) uidToSocket.delete(uid);
//     const peerId = socket.data.peerId;
//     if (peerId) peerIdToSocket.delete(peerId);

//     for (const [roomId, room] of roomToData.entries()) {
//       if (room.host.socketId === socket.id) {
//         liveNamespace.in(roomId).emit("room-ended");
//         roomToData.delete(roomId);
//         break;
//       } else if (room.viewers.some((s) => s === socket.id)) {
//         room.viewers = new Map([...room.viewers].filter(([_, s]) => s !== socket.id));
//         liveNamespace.in(roomId).emit("viewer-count", room.viewers.size);
//       } else {
//         for (const [u, info] of room.coHosts.entries()) {
//           if (info.socketId === socket.id) {
//             room.coHosts.delete(u);
//             break;
//           }
//         }
//       }
//     }
//   });
// });

// // ========================================
// // 6. REST APIs
// // ========================================
// app.get("/users", async (req, res) => {
//   try {
//     const snapshot = await admin.firestore().collection("users").get();
//     const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/", (req, res) => {
//   res.send(`<h2>Server Running - Chat + Call</h2><p>${new Date()}</p>`);
// });

// // ========================================
// // 7. START SERVER
// // ========================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });




// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";

import { initChatSocket } from "./sockets/chat_socket.js";
import { initCallSocket } from "./sockets/call_socket.js";
import { initLiveSocket } from "./sockets/live_socket.js";

dotenv.config();

// ========================================
// 1. FIREBASE ADMIN SETUP
// ========================================
let adminInitialized = false;

try {
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
  adminInitialized = true;
  console.log("[FIREBASE] Admin SDK initialized successfully");
} catch (error) {
  console.error("[FIREBASE ERROR]", error.message);
}

// ========================================
// 2. EXPRESS + SOCKET.IO SERVER
// ========================================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

// ========================================
// 3. SOCKET NAMESPACES
// ========================================
initChatSocket(io.of("/chat"));
initCallSocket(io.of("/call"));
initLiveSocket(io.of("/live"));

// ========================================
// 4. REST APIs
// ========================================
app.get("/", (req, res) => {
  res.send(`<h2>Server Running - Chat + Call + Live</h2><p>${new Date()}</p>`);
});

app.get("/health", (req, res) => res.status(200).json({ status: "OK", time: new Date() }));

// Serve recorded live streams (HLS)
app.use("/recordings", express.static("recordings"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});