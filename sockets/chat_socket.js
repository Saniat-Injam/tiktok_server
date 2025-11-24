export default function chatSocket(io, socket, users) {
    // Join chat room
    socket.on("join-room", ({ userA, userB }) => {
      const room = `room_${[userA, userB].sort().join("_")}`;
      socket.join(room);
      console.log(`[CHAT] ${socket.id} joined ${room}`);
    });
  
    // Send message event
    socket.on("send-message", (msg) => {
      const { from, to, text, timestamp } = msg;
  
      const room = `room_${[from, to].sort().join("_")}`;
  
      // Emit to room (both users)
      io.to(room).emit("receive-message", msg);
      console.log(`[CHAT] ${from} → ${to}: ${text}`);
  
      // If the receiver is offline, store or send FCM later
      const receiver = users.get(to);
      if (!receiver?.socketId) {
        console.log(`[CHAT] Receiver offline: ${to}`);
      }
    });
  }
  