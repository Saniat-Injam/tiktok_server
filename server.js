
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";

// dotenv.config();

// // ========================================
// // 1. FIREBASE ADMIN SETUP (with error handling)
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

//   if (!serviceAccount.project_id) {
//     throw new Error("Missing FIREBASE_PROJECT_ID");
//   }

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
//   console.log("[FIREBASE] Running without FCM (calls will work via socket only)");
// }

// // ========================================
// // 2. EXPRESS + SOCKET.IO SETUP
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
//   transports: ["websocket", "polling"], // Allow fallback
//   // Handle query params (userId from Flutter)
//   allowRequest: (req, allow) => {
//     const userId = req.query.userId;
//     if (userId) {
//       console.log(`[SOCKET] Incoming connection from user: ${userId}`);
//     }
//     allow({ origins: "*", credentials: true });
//   },
// });

// // ========================================
// // 3. IN-MEMORY USER MAP
// // ========================================
// const users = new Map(); // userId → { socketId, fcmToken }

// // ========================================
// // 4. SOCKET.IO EVENTS
// // ========================================
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId; // From Flutter query
//   console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || 'unknown'})`);

//   // ─── REGISTER USER ─────────────────────
//   socket.on("register", (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     users.set(finalUserId, {
//       socketId: socket.id,
//       fcmToken: fcmToken || null,
//     });

//     console.log(`[REGISTER] ${finalUserId} → Socket: ${socket.id} | FCM: ${fcmToken?.substring(0, 20)}...`);
//   });

//   // ─── OFFER ─────────────
//   socket.on("offer", async (data) => {
//     const { from, to, sdp, type, callerName, isVideo, callId } = data;
//     console.log(`[OFFER] ${from} → ${to} | Video: ${isVideo} | ID: ${callId}`);

//     const receiver = users.get(to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("offer", data);
//       console.log(`[SOCKET] Offer to ${to}`);
//     } else {
//       // Offline → FCM (only if Firebase ready)
//       if (adminInitialized) {
//         try {
//           const userDoc = await admin.firestore().collection("users").doc(to).get();
//           const fcmToken = userDoc.data()?.fcmToken;
//           if (fcmToken) {
//             await sendCallNotification(fcmToken, data);
//             console.log(`[FCM] Sent to ${to}`);
//           } else {
//             console.log(`[FCM] No token for ${to}`);
//           }
//         } catch (err) {
//           console.error("[FCM ERROR]", err.message);
//         }
//       } else {
//         console.log(`[FCM] Skipped (Admin not initialized)`);
//       }
//     }
//   });

//   // ─── ANSWER ────────────
//   socket.on("answer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("answer", data);
//       console.log(`[ANSWER] To ${data.to}`);
//     }
//   });

//   // ─── ICE ──────────────
//   socket.on("ice-candidate", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("ice-candidate", data);
//     }
//   });

//   // ─── END CALL ─────────
//   socket.on("end-call", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("call-ended", data);
//       console.log(`[END-CALL] To ${data.to}`);
//     }
//   });

//   // ─── DISCONNECT ───────
//   socket.on("disconnect", (reason) => {
//     for (const [userId, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(userId);
//         console.log(`[DISCONNECT] ${userId} (${reason})`);
//         break;
//       }
//     }
//   });
// });

// // ========================================
// // 5. HEALTH CHECK
// // ========================================
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>WebRTC Signaling Server Running</h2>
//     <p>Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
//     <p>Online Users: ${users.size}</p>
//     <p>Firebase Ready: ${adminInitialized ? 'Yes' : 'No'}</p>
//   `);
// });

// // ========================================
// // 6. START SERVER
// // ========================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`\n🚀 Server running on port ${PORT}`);
//   //console.log(`URL: https://tiktok-server-1g37.onrender.com`);
//   console.log(`BD Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}\n`);
// });



// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";

// dotenv.config();

// // ========================================
// // 1. FIREBASE ADMIN SETUP (with error handling)
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

//   if (!serviceAccount.project_id) {
//     throw new Error("Missing FIREBASE_PROJECT_ID");
//   }

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
//   console.log("[FIREBASE] Running without FCM (calls will work via socket only)");
// }

// // ========================================
// // 2. EXPRESS + SOCKET.IO SETUP
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// // ************** FIXED allowRequest() **************
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
//   transports: ["websocket", "polling"],
//   allowRequest: (req, callback) => {
//     try {
//       // Parse query params from Engine.IO URL
//       const url = new URL(req.url, "http://localhost");
//       const userId = url.searchParams.get("userId");

//       if (userId) {
//         console.log(`[SOCKET] Incoming connection from user: ${userId}`);
//       }
//     } catch (err) {
//       console.log("[allowRequest ERROR]", err.message);
//     }

//     // Allow the connection (correct format)
//     callback(null, true);
//   },
// });

// // ========================================
// // 3. IN-MEMORY USER MAP
// // ========================================
// const users = new Map(); // userId → { socketId, fcmToken }

// // ========================================
// // 4. SOCKET.IO EVENTS
// // ========================================
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId;
//   console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // ─── REGISTER USER ─────────────────────
//   socket.on("register", (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     users.set(finalUserId, {
//       socketId: socket.id,
//       fcmToken: fcmToken || null,
//     });

//     console.log(
//       `[REGISTER] ${finalUserId} → Socket: ${socket.id} | FCM: ${fcmToken?.substring(0, 20)}...`
//     );
//   });

//   // ─── OFFER ─────────────
//   socket.on("offer", async (data) => {
//     const { from, to } = data;
//     console.log(`[OFFER] ${from} → ${to}`);

//     const receiver = users.get(to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("offer", data);
//       console.log(`[SOCKET] Offer sent to ${to}`);
//     } else {
//       if (adminInitialized) {
//         try {
//           const userDoc = await admin.firestore().collection("users").doc(to).get();
//           const fcmToken = userDoc.data()?.fcmToken;
//           if (fcmToken) {
//             await sendCallNotification(fcmToken, data);
//             console.log(`[FCM] Sent call notification to ${to}`);
//           } else {
//             console.log(`[FCM] No token for ${to}`);
//           }
//         } catch (err) {
//           console.error("[FCM ERROR]", err.message);
//         }
//       } else {
//         console.log("[FCM] Skipped (Firebase not initialized)");
//       }
//     }
//   });

//   // ─── ANSWER ────────────
//   socket.on("answer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("answer", data);
//       console.log(`[ANSWER] To ${data.to}`);
//     }
//   });

//   // ─── ICE ──────────────
//   socket.on("ice-candidate", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("ice-candidate", data);
//     }
//   });

//   // ─── END CALL ─────────
//   socket.on("end-call", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("call-ended", data);
//       console.log(`[END CALL] To ${data.to}`);
//     }
//   });

//   // ─── DISCONNECT ───────
//   socket.on("disconnect", (reason) => {
//     for (const [id, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(id);
//         console.log(`[DISCONNECT] ${id} (${reason})`);
//         break;
//       }
//     }
//   });
// });

// // ========================================
// // 5. HEALTH CHECK
// // ========================================
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>WebRTC Signaling Server Running</h2>
//     <p>Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
//     <p>Online Users: ${users.size}</p>
//     <p>Firebase Ready: ${adminInitialized ? "Yes" : "No"}</p>
//   `);
// });

// // ========================================
// // 6. START SERVER
// // ========================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`\n🚀 Server running on port ${PORT}`);
//   console.log(`BD Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}\n`);
// });




// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";

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

//   if (!serviceAccount.project_id) throw new Error("Missing FIREBASE_PROJECT_ID");

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
//   console.log("[FIREBASE] Running without FCM (calls work via socket only)");
// }

// // ========================================
// // 2. EXPRESS + SOCKET.IO SETUP
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   transports: ["websocket", "polling"],
//   allowRequest: (req, callback) => {
//     // allow all connections
//     callback(null, true);
//   },
// });

// // ========================================
// // 3. IN-MEMORY USER MAP
// // ========================================
// const users = new Map(); // userId → { socketId, fcmToken }

// // ========================================
// // 4. SOCKET.IO EVENTS
// // ========================================
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId;
//   console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // ─── REGISTER USER ─────────────────────
//   socket.on("register", async (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     // Update in-memory map
//     users.set(finalUserId, {
//       socketId: socket.id,
//       fcmToken: fcmToken || null,
//     });

//     console.log(
//       `[REGISTER] ${finalUserId} → Socket: ${socket.id} | FCM: ${fcmToken?.substring(0, 20)}...`
//     );

//     // Persist FCM token in Firestore
//     if (adminInitialized && fcmToken) {
//       try {
//         await admin.firestore().collection("users").doc(finalUserId).set(
//           { fcmToken },
//           { merge: true }
//         );
//         console.log(`[FIRESTORE] FCM token saved for ${finalUserId}`);
//       } catch (err) {
//         console.error("[FIRESTORE ERROR]", err.message);
//       }
//     }
//   });

//   // ─── OFFER ─────────────
//   socket.on("offer", async (data) => {
//     const { from, to } = data;
//     console.log(`[OFFER] ${from} → ${to}`);

//     const receiver = users.get(to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("offer", data);
//       console.log(`[SOCKET] Offer sent to ${to}`);
//     } else if (adminInitialized) {
//       // Use Firestore token if user is offline
//       try {
//         const userDoc = await admin.firestore().collection("users").doc(to).get();
//         const fcmToken = userDoc.data()?.fcmToken;
//         if (fcmToken) {
//           await sendCallNotification(fcmToken, data);
//           console.log(`[FCM] Sent call notification to ${to}`);
//         } else {
//           console.log(`[FCM] No token for ${to}`);
//         }
//       } catch (err) {
//         console.error("[FCM ERROR]", err.message);
//       }
//     }
//   });

//   // ─── ANSWER ────────────
//   socket.on("answer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("answer", data);
//       console.log(`[ANSWER] To ${data.to}`);
//     }
//   });

//   // ─── ICE ──────────────
//   socket.on("ice-candidate", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("ice-candidate", data);
//   });

//   // ─── END CALL ─────────
//   socket.on("end-call", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("call-ended", data);
//     console.log(`[END CALL] To ${data.to}`);
//   });

//   // ─── DISCONNECT ───────
//   socket.on("disconnect", (reason) => {
//     for (const [id, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(id);
//         console.log(`[DISCONNECT] ${id} (${reason})`);
//         break;
//       }
//     }
//   });
// });

// // ========================================
// // 5. HEALTH CHECK
// // ========================================
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>WebRTC Signaling Server Running</h2>
//     <p>Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
//     <p>Online Users: ${users.size}</p>
//     <p>Firebase Ready: ${adminInitialized ? "Yes" : "No"}</p>
//   `);
// });

// // ========================================
// // 6. START SERVER
// // ========================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`\n🚀 Server running on port ${PORT}`);
//   console.log(
//     `BD Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}\n`
//   );
// });




// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";
// import { sendCallNotification } from "./fcm_service.js";

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

//   if (!serviceAccount.project_id) throw new Error("Missing FIREBASE_PROJECT_ID");

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

//   adminInitialized = true;
//   console.log("[FIREBASE] Admin SDK initialized successfully");
// } catch (error) {
//   console.error("[FIREBASE ERROR]", error.message);
//   console.log("[FIREBASE] Running without FCM (calls work via socket only)");
// }

// // ========================================
// // 2. EXPRESS + SOCKET.IO SETUP
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   transports: ["websocket", "polling"],
//   allowRequest: (req, callback) => callback(null, true),
// });

// // ========================================
// // 3. IN-MEMORY USER MAP
// // ========================================
// const users = new Map(); // userId → { socketId, fcmToken }

// // ========================================
// // 4. SOCKET.IO EVENTS
// // ========================================
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId || null;
//   console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // REGISTER USER
//   socket.on("register", async (data) => {
//     const { userId: regUserId, fcmToken } = data;
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     users.set(finalUserId, {
//       socketId: socket.id,
//       fcmToken: fcmToken || null,
//     });

//     console.log(
//       `[REGISTER] ${finalUserId} → Socket: ${socket.id} | FCM: ${fcmToken ? fcmToken.substring(0, 20) + "..." : "none"}`
//     );

//     if (adminInitialized && fcmToken) {
//       try {
//         await admin.firestore().collection("users").doc(finalUserId).set(
//           { fcmToken },
//           { merge: true }
//         );
//         console.log(`[FIRESTORE] FCM token saved for ${finalUserId}`);
//       } catch (err) {
//         console.error("[FIRESTORE ERROR]", err.message);
//       }
//     }
//   });

//   // OFFER
//   socket.on("offer", async (data) => {
//     const { to } = data;
//     const receiver = users.get(to);
//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("offer", data);
//     } else if (adminInitialized) {
//       try {
//         const userDoc = await admin.firestore().collection("users").doc(to).get();
//         const fcmToken = userDoc.data()?.fcmToken;
//         if (fcmToken) await sendCallNotification(fcmToken, data);
//       } catch (err) {
//         console.error("[FCM ERROR]", err.message);
//       }
//     }
//   });

//   // ANSWER
//   socket.on("answer", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("answer", data);
//   });

//   // ICE CANDIDATE
//   socket.on("ice-candidate", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("ice-candidate", data);
//   });

//   // END CALL
//   socket.on("end-call", (data) => {
//     const receiver = users.get(data.to);
//     if (receiver?.socketId) io.to(receiver.socketId).emit("call-ended", data);
//   });

//   // DISCONNECT
//   socket.on("disconnect", (reason) => {
//     for (const [id, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(id);
//         console.log(`[DISCONNECT] ${id} (${reason})`);
//         break;
//       }
//     }
//   });
// });

// // HEALTH CHECK
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>WebRTC Signaling Server Running</h2>
//     <p>Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
//     <p>Online Users: ${users.size}</p>
//     <p>Firebase Ready: ${adminInitialized ? "Yes" : "No"}</p>
//   `);
// });

// // START SERVER
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });



// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import admin from "firebase-admin";
// import cors from "cors";
// import dotenv from "dotenv";

// import { sendCallNotification } from "./fcm_service.js";
// import chatSocket from "./sockets/chat_socket.js";

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
// // 2. EXPRESS + SOCKET.IO SETUP
// // ========================================
// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   transports: ["websocket", "polling"],
//   allowRequest: (req, callback) => callback(null, true),
// });

// // ========================================
// // 3. IN-MEMORY USER MAP
// // ========================================
// const users = new Map(); // userId → { socketId, fcmToken }

// // ========================================
// // 4. SOCKET.IO EVENTS
// // ========================================
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId || null;

//   console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || "unknown"})`);

//   // -------------------------------
//   // REGISTER USER
//   // -------------------------------
//   socket.on("register", async ({ userId: regUserId, fcmToken }) => {
//     const finalUserId = regUserId || userId;
//     if (!finalUserId) return;

//     users.set(finalUserId, { socketId: socket.id, fcmToken });

//     console.log(`[REGISTER] ${finalUserId} → Socket: ${socket.id}`);

//     if (adminInitialized && fcmToken) {
//       try {
//         await admin.firestore().collection("users").doc(finalUserId).set(
//           { fcmToken },
//           { merge: true }
//         );
//         console.log(`[FIRESTORE] FCM token saved for ${finalUserId}`);
//       } catch (err) {
//         console.error("[FIRESTORE ERROR]", err.message);
//       }
//     }
//   });

//   // -------------------------------
//   // CALLING EVENTS (your original code)
//   // -------------------------------
//   socket.on("offer", async (data) => {
//     const receiver = users.get(data.to);

//     if (receiver?.socketId) {
//       io.to(receiver.socketId).emit("offer", data);
//     } else if (adminInitialized) {
//       try {
//         const userDoc = await admin.firestore().collection("users").doc(data.to).get();
//         const fcmToken = userDoc.data()?.fcmToken;

//         if (fcmToken) await sendCallNotification(fcmToken, data);
//       } catch (err) {
//         console.error("[FCM ERROR]", err.message);
//       }
//     }
//   });

//   socket.on("answer", (data) => {
//     const r = users.get(data.to);
//     if (r?.socketId) io.to(r.socketId).emit("answer", data);
//   });

//   socket.on("ice-candidate", (data) => {
//     const r = users.get(data.to);
//     if (r?.socketId) io.to(r.socketId).emit("ice-candidate", data);
//   });

//   socket.on("end-call", (data) => {
//     const r = users.get(data.to);
//     if (r?.socketId) io.to(r.socketId).emit("call-ended", data);
//   });

//   // -------------------------------
//   // CHAT SOCKET (NEW)
//   // -------------------------------
//   chatSocket(io, socket, users);

//   // -------------------------------
//   // DISCONNECT
//   // -------------------------------
//   socket.on("disconnect", (reason) => {
//     for (const [id, info] of users.entries()) {
//       if (info.socketId === socket.id) {
//         users.delete(id);
//         console.log(`[DISCONNECT] ${id} (${reason})`);
//         break;
//       }
//     }
//   });
// });

// // HEALTH CHECK
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>WebRTC + Chat Server Running</h2>
//     <p>Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
//     <p>Online Users: ${users.size}</p>
//     <p>Firebase Ready: ${adminInitialized}</p>
//   `);
// });

// // START SERVER
// const PORT = process.env.PORT || 3000;

// server.listen(PORT, "0.0.0.0", () =>
//   console.log(`Server running on port ${PORT}`)
// );




import express from "express";
import http from "http";
import { Server } from "socket.io";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";

// NEW: Socket modules
import callSocket from "./sockets/call_socket.js";
import chatSocket from "./sockets/chat_socket.js";

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

  if (!serviceAccount.project_id) throw new Error("Missing FIREBASE_PROJECT_ID");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  adminInitialized = true;
  console.log("[FIREBASE] Admin SDK initialized successfully");
} catch (error) {
  console.error("[FIREBASE ERROR]", error.message);
  console.log("[FIREBASE] Running without FCM");
}

// ========================================
// 2. EXPRESS + SOCKET.IO SETUP
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
// 3. IN-MEMORY USER MAP
// userId → { socketId, fcmToken }
// ========================================
const users = new Map();

// ========================================
// 4. SOCKET CONNECTION
// ========================================
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId || null;
  console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId || "unknown"})`);

  // REGISTER USER
  socket.on("register", async ({ userId: regUserId, fcmToken }) => {
    const finalUserId = regUserId || userId;
    if (!finalUserId) return;

    users.set(finalUserId, {
      socketId: socket.id,
      fcmToken: fcmToken || null,
    });

    console.log(
      `[REGISTER] ${finalUserId} → Socket: ${socket.id} | FCM: ${
        fcmToken ? fcmToken.substring(0, 20) + "..." : "none"
      }`
    );

    // SAVE TOKEN TO FIRESTORE IF AVAILABLE
    if (adminInitialized && fcmToken) {
      try {
        await admin.firestore().collection("users").doc(finalUserId).set(
          { fcmToken },
          { merge: true }
        );
        console.log(`[FIRESTORE] Token saved for ${finalUserId}`);
      } catch (err) {
        console.error("[FIRESTORE ERROR]", err.message);
      }
    }
  });

  // ATTACH CALLING SOCKET LOGIC
  callSocket(io, socket, users);

  // ATTACH CHAT SOCKET LOGIC
  chatSocket(io, socket, users);

  // USER DISCONNECT
  socket.on("disconnect", (reason) => {
    for (const [id, info] of users.entries()) {
      if (info.socketId === socket.id) {
        users.delete(id);
        console.log(`[DISCONNECT] ${id} (${reason})`);
        break;
      }
    }
  });
});

// ========================================
// 5. SERVER HEALTH CHECK
// ========================================
app.get("/", (req, res) => {
  res.send(`
    <h2>Backend Server Running</h2>
    <p>Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
    <p>Online Users: ${users.size}</p>
    <p>Firebase Ready: ${adminInitialized ? "Yes" : "No"}</p>
  `);
});

// ========================================
// 6. START SERVER
// ========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
