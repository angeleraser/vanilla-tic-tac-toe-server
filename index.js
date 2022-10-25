const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origins: ["http://127.0.0.1:5500"] },
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.write(`<h1>Tic Tac Toe Server - Start on Port: ${PORT} </h1>`);
  res.end();
});

server.listen(PORT, () => {
  console.log("listening on port: " + PORT);
});

const EVENTS = {
  BOARD_CLICK: "board-click",
  JOIN_ROOM: "join-room",
  ALLOW_WRITE: "allow-write",
  UNABLE_JOIN: "unable-join",
  TWO_PLAYERS_JOIN: "two-players-join",
  PLAYER_DISCONNECT: "player-disconnect",
  RECOVER_STATE: "recover-state",
  RESET: "reset",
  QUIT: "quit",
};

io.on("connection", (socket) => {
  const getRoomClients = (roomid) => {
    return io.sockets.adapter.rooms.get(roomid) || new Set();
  };

  socket.on(EVENTS.BOARD_CLICK, (payload) => {
    socket.to(payload.roomid).emit(EVENTS.BOARD_CLICK, payload);
  });

  socket.on(EVENTS.RECOVER_STATE, (payload) => {
    socket.to(payload.roomid).emit(EVENTS.RECOVER_STATE, payload);
  });

  socket.on(EVENTS.JOIN_ROOM, (payload) => {
    const { roomid } = payload;
    const clients = getRoomClients(roomid);

    socket.join(roomid);

    if (clients.size === 2) {
      socket.to(roomid).emit(EVENTS.TWO_PLAYERS_JOIN, { socketId: socket.id });
    }

    if (clients.size > 2) {
      io.to(socket.id).emit(EVENTS.UNABLE_JOIN);
      socket.leave(roomid);
    }
  });

  socket.on(EVENTS.RESET, ({ roomid }) => {
    socket.to(roomid).emit(EVENTS.RESET, { socketId: socket.id });
  });

  socket.on(EVENTS.QUIT, ({ roomid }) => {
    socket.to(roomid).emit(EVENTS.QUIT, { socketId: socket.id });
  });

  socket.on("disconnecting", () => {
    const [socketId, roomid] = [...socket.rooms];
    io.to(roomid).emit("player-disconnect", { socketId });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
