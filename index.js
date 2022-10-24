const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origins: ["http://127.0.0.1:5500"] },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});

io.on("connection", (socket) => {
  const getRoomClients = (roomid) => {
    return io.sockets.adapter.rooms.get(roomid) || new Set();
  };

  socket.on("board-click", (payload) => {
    socket.to(payload.roomid).emit("board-click", payload);
  });

  socket.on("recover-state", (payload) => {
    socket.to(payload.roomid).emit("recover-state", payload);
  });

  socket.on("join-room", (payload) => {
    const { roomid } = payload;
    const clients = getRoomClients(roomid);

    socket.join(roomid);

    if (clients.size === 2) {
      socket.to(roomid).emit("two-players-join", { socketId: socket.id });
    }

    if (clients.size > 2) {
      io.to(socket.id).emit("unable-join");
      socket.leave(roomid);
    }
  });

  socket.on("disconnecting", () => {
    const [socketId, roomid] = [...socket.rooms];
    io.to(roomid).emit("player-disconnect", { socketId });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
