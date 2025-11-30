
// sockets/call_socket.js
import { sendCallNotification } from "../fcm_service.js";

export const initCallSocket = (callNamespace) => {
  const users = new Map(); // userId → { socketId, fcmToken }

  callNamespace.on("connection", (socket) => {
    console.log(`[CALL] Connected: ${socket.id}`);

    socket.on("register", ({ userId, fcmToken }) => {
      if (!userId) return socket.emit("error", "userId required");

      users.set(userId, { socketId: socket.id, fcmToken: fcmToken || null });
      socket.userId = userId;
      console.log(`[CALL] Registered: ${userId}`);
    });

    // Incoming call initiation
    socket.on("call-user", async ({ to, callerName, isVideo, callId }) => {
      const receiver = users.get(to);
      if (!receiver) return console.log(`[CALL] User ${to} not online`);

      // Send WebSocket event
      callNamespace.to(receiver.socketId).emit("incoming-call", {
        from: socket.userId,
        callerName,
        isVideo,
        callId,
      });

      // Send FCM if app is in background
      if (receiver.fcmToken) {
        await sendCallNotification(receiver.fcmToken, {
          from: socket.userId,
          callerName,
          isVideo,
          callId,
        });
      }
    });

    // WebRTC Signaling
    ["offer", "answer", "ice-candidate", "call-rejected", "call-ended"].forEach((event) => {
      socket.on(event, (data) => {
        const target = users.get(data.to);
        if (target?.socketId) {
          callNamespace.to(target.socketId).emit(event, {
            ...data,
            from: socket.userId,
          });
        }
      });
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        users.delete(socket.userId);
        console.log(`[CALL] Disconnected: ${socket.userId}`);
      }
    });

    socket.on("error", (err) => {
      console.error(`[CALL SOCKET ERROR] ${socket.id}:`, err.message);
    });
  });
};