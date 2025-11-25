// // export default function chatSocket(io, socket, users) {
// //     // Join chat room
// //     socket.on("join-room", ({ userA, userB }) => {
// //       const room = `room_${[userA, userB].sort().join("_")}`;
// //       socket.join(room);
// //       console.log(`[CHAT] ${socket.id} joined ${room}`);
// //     });
  
// //     // Send message event
// //     socket.on("send-message", (msg) => {
// //       const { from, to, text, timestamp } = msg;
  
// //       const room = `room_${[from, to].sort().join("_")}`;
  
// //       // Emit to room (both users)
// //       io.to(room).emit("receive-message", msg);
// //       console.log(`[CHAT] ${from} → ${to}: ${text}`);
  
// //       // If the receiver is offline, store or send FCM later
// //       const receiver = users.get(to);
// //       if (!receiver?.socketId) {
// //         console.log(`[CHAT] Receiver offline: ${to}`);
// //       }
// //     });
// //   }
  
// // import { Server } from "socket.io";
// // import admin from "firebase-admin";

// // export const initChatSocket = (server) => {
// //   const io = new Server(server, {
// //     cors: { origin: "*", methods: ["GET", "POST"] },
// //     transports: ["websocket", "polling"],
// //   });

// //   const users = new Map(); // userId → socketId

// //   io.on("connection", (socket) => {
// //     const { userId } = socket.handshake.query;
// //     if (!userId) return;

// //     users.set(userId, socket.id);
// //     console.log(`[CHAT] Connected: ${socket.id} (user: ${userId})`);

// //     // SEND MESSAGE
// //     socket.on("send-message", async (data) => {
// //       const { to, text } = data;
// //       const timestamp = new Date().toISOString();

// //       // Save message in Firestore
// //       try {
// //         await admin.firestore().collection("messages").add({
// //           from: userId,
// //           to,
// //           text,
// //           timestamp,
// //         });
// //       } catch (err) {
// //         console.error("[CHAT FIRESTORE ERROR]", err.message);
// //       }

// //       // Emit to receiver if online
// //       const receiverSocketId = users.get(to);
// //       if (receiverSocketId) {
// //         io.to(receiverSocketId).emit("receive-message", {
// //           from: userId,
// //           text,
// //           timestamp,
// //         });
// //       }
// //     });

// //     socket.on("disconnect", () => {
// //       users.delete(userId);
// //       console.log(`[CHAT] Disconnected: ${userId}`);
// //     });
// //   });

// //   return io;
// // };



// // sockets/chat_socket.js
// import { Server } from "socket.io";
// import admin from "firebase-admin";

// export const initChatSocket = (server) => {
//   const io = new Server(server, {
//     cors: { origin: "*", methods: ["GET", "POST"] },
//   });

//   const onlineUsers = new Map(); // userId → socket.id

//   io.on("connection", (socket) => {
//     const userId = socket.handshake.query.userId;
//     if (!userId) {
//       socket.disconnect();
//       return;
//     }

//     onlineUsers.set(userId, socket.id);
//     console.log(`[CHAT] User connected: ${userId} → ${socket.id}`);

//     socket.on("register", ({ userId: id }) => {
//       if (id) onlineUsers.set(id, socket.id);
//     });

//     socket.on("message", async (data) => {
//       const { to, text, id, from, createdAt } = data;

//       const messageData = {
//         id: id || Date.now().toString(),
//         from: userId,
//         to,
//         text,
//         createdAt: createdAt || new Date().toISOString(),
//       };

//       // Save to Firestore
//       try {
//         await admin.firestore().collection("messages").add(messageData);
//       } catch (err) {
//         console.error("Firestore save error:", err);
//       }

//       // Send to receiver if online
//       const receiverSocket = onlineUsers.get(to);
//       if (receiverSocket) {
//         io.to(receiverSocket).emit("message", {
//           ...messageData,
//           from: { id: userId, name: from.name, profileImage: from.profileImage },
//         });
//       } else {
//         // Send FCM push if offline
//         try {
//           const userDoc = await admin.firestore().collection("users").doc(to).get();
//           const fcmToken = userDoc.data()?.fcmToken;
//           if (fcmToken) {
//             await admin.messaging().send({
//               token: fcmToken,
//               notification: {
//                 title: from.name || "New Message",
//                 body: text,
//               },
//               data: {
//                 type: "chat_message",
//                 fromUserId: userId,
//                 fromUserName: from.name || "",
//                 message: text,
//               },
//             });
//           }
//         } catch (err) {
//           console.log("FCM failed (user offline):", err.message);
//         }
//       }

//       // Also broadcast back to sender (for UI consistency)
//       socket.emit("message", {
//         ...messageData,
//         from: { id: userId, name: from.name, profileImage: from.profileImage },
//       });
//     });

//     socket.on("disconnect", () => {
//       onlineUsers.delete(userId);
//       console.log(`[CHAT] User disconnected: ${userId}`);
//     });
//   });
// };

// sockets/chat_socket.js


// export const initChatSocket = (namespace) => {  // ← Now accepts namespace
//   const onlineUsers = new Map();

//   namespace.on("connection", (socket) => {
//     const userId = socket.handshake.query.userId;
//     if (!userId) {
//       socket.disconnect();
//       return;
//     }

//     onlineUsers.set(userId, socket.id);
//     console.log(`[CHAT] User connected: ${userId}`);

//     socket.on("message", async (data) => {
//       // ... your existing message logic (keep it exactly as I gave you before)
//       // Just make sure you're using namespace.to() instead of io.to()
//       const receiverSocketId = onlineUsers.get(data.to);
//       if (receiverSocketId) {
//         namespace.to(receiverSocketId).emit("message", fullMessage);  // ← Use namespace
//       }
//       socket.emit("message", fullMessage);
//     });

//     socket.on("disconnect", () => {
//       onlineUsers.delete(userId);
//     });
//   });
// };

// sockets/chat_socket.js
import { createMessageObject } from "../models/message_model.js";

export const initChatSocket = (namespace) => {
  const onlineUsers = new Map(); // userId → socketId

  namespace.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.log("[CHAT] User connected without userId, disconnecting...");
      return socket.disconnect();
    }

    onlineUsers.set(userId, socket.id);
    console.log(`[CHAT] User connected: ${userId}`);

    // Listen for incoming messages
    socket.on("message", (data) => {
      const fullMessage = createMessageObject({
        from: userId,
        to: data.to,
        text: data.text,
      });

      const receiverSocketId = onlineUsers.get(data.to);

      // Send to receiver if online
      if (receiverSocketId) {
        namespace.to(receiverSocketId).emit("message", fullMessage);
      }

      // Send back to sender for confirmation
      socket.emit("message", fullMessage);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`[CHAT] User disconnected: ${userId}`);
    });
  });
};
