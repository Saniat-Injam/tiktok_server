// ============================================
// CALL SOCKET HANDLER (One-to-One AV Calling)
// ============================================

export default function setupCallSocket(io) {
  const callNamespace = io.of("/call");

  callNamespace.on("connection", (socket) => {
    console.log("CALL SOCKET CONNECTED:", socket.id);

    // When user joins with userId
    socket.on("join", ({ userId }) => {
      socket.userId = userId;
      console.log(`User ${userId} joined call namespace`);
    });

    // ============================================
    // SIGNALING EVENTS
    // ============================================

    // Caller → Callee: sending offer SDP
    socket.on("call-offer", ({ to, offer, caller }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("call-offer", { offer, caller });
      }
    });

    // Callee → Caller: sending answer SDP
    socket.on("call-answer", ({ to, answer }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("call-answer", { answer });
      }
    });

    // ICE candidate exchange
    socket.on("ice-candidate", ({ to, candidate }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("ice-candidate", { candidate });
      }
    });

    // ============================================
    // CALL EVENTS
    // ============================================

    // Caller rings the receiver
    socket.on("call-user", ({ to, from }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("incoming-call", { from });
      }
    });

    // Receiver rejected the call
    socket.on("call-rejected", ({ to, reason }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("call-rejected", { reason });
      }
    });

    // Call ended by any party
    socket.on("call-ended", ({ to }) => {
      const targetSocket = findSocketByUserId(callNamespace, to);
      if (targetSocket) {
        targetSocket.emit("call-ended");
      }
    });

    socket.on("disconnect", () => {
      console.log(`Call socket disconnected: ${socket.id}`);
    });
  });
}

// Helper to find socket by userId
function findSocketByUserId(namespace, userId) {
  for (const [id, socket] of namespace.sockets) {
    if (socket.userId === userId) return socket;
  }
  return null;
}
