// sockets/live_socket.js
export const initLiveSocket = (liveNamespace) => {
  const peerIdToSocket = new Map();
  const socketIdToPeerId = new Map();
  const roomToData = new Map();

  liveNamespace.on("connection", (socket) => {
    console.log(`[LIVE] Connected: ${socket.id}`);

    socket.on("join-host", ({ roomId, peerId, uid }) => {
      if (roomToData.has(roomId)) {
        return socket.emit("error", "Room already exists");
      }

      socket.join(roomId);
      socket.data = { roomId, peerId, uid, role: "host" };

      peerIdToSocket.set(peerId, socket.id);
      socketIdToPeerId.set(socket.id, peerId);

      roomToData.set(roomId, {
        host: { peerId, uid, socketId: socket.id },
        coHosts: new Map(),
        viewers: new Map(),
      });

      socket.emit("room-created");
      console.log(`[LIVE] Host created room: ${roomId}`);
    });

    socket.on("join-viewer", ({ roomId, peerId }) => {
      const room = roomToData.get(roomId);
      if (!room) return socket.emit("error", "Room not found");

      socket.join(roomId);
      socket.data = { roomId, peerId, role: "viewer" };

      peerIdToSocket.set(peerId, socket.id);
      socketIdToPeerId.set(socket.id, peerId);
      room.viewers.set(peerId, socket.id);

      liveNamespace.to(room.host.socketId).emit("new-peer", { peerId, role: "viewer" });
      liveNamespace.in(roomId).emit("viewer-count", room.viewers.size);
    });

    socket.on("join-cohost", ({ roomId, peerId, uid }) => {
      const room = roomToData.get(roomId);
      if (!room) return socket.emit("error", "Room not found");

      socket.join(roomId);
      socket.data = { roomId, peerId, uid, role: "cohost" };

      peerIdToSocket.set(peerId, socket.id);
      socketIdToPeerId.set(socket.id, peerId);
      room.coHosts.set(uid, { peerId, socketId: socket.id });

      // Notify host
      liveNamespace.to(room.host.socketId).emit("new-peer", { peerId, role: "cohost", uid });
      // Notify co-host about host
      socket.emit("new-peer", { peerId: room.host.peerId, role: "host" });
    });

    // Signaling
    socket.on("offer", ({ to, sdp, type }) => {
      const target = peerIdToSocket.get(to);
      if (target) {
        liveNamespace.to(target).emit("offer", { from: socket.data.peerId, sdp, type });
      }
    });

    socket.on("answer", ({ to, sdp, type }) => {
      const target = peerIdToSocket.get(to);
      if (target) {
        liveNamespace.to(target).emit("answer", { from: socket.data.peerId, sdp, type });
      }
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      const target = peerIdToSocket.get(to);
      if (target) {
        liveNamespace.to(target).emit("ice-candidate", { from: socket.data.peerId, candidate });
      }
    });

    socket.on("disconnect", () => {
      const peerId = socketIdToPeerId.get(socket.id);
      if (!peerId) return;

      for (const [roomId, room] of roomToData.entries()) {
        if (room.host.peerId === peerId) {
          liveNamespace.in(roomId).emit("room-ended");
          roomToData.delete(roomId);
        } else if (room.viewers.has(peerId)) {
          room.viewers.delete(peerId);
          liveNamespace.in(roomId).emit("viewer-count", room.viewers.size);
        } else {
          for (const [uid, info] of room.coHosts.entries()) {
            if (info.peerId === peerId) {
              room.coHosts.delete(uid);
              break;
            }
          }
        }
        socket.leave(roomId);
      }
      peerIdToSocket.delete(peerId);
      socketIdToPeerId.delete(socket.id);
    });
  });
};