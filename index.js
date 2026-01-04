import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import ipBan, { banIP } from "./ipBan.js";
import { encrypt } from "./crypto.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(ipBan);

app.use(rateLimit({
  windowMs: 10_000,
  max: 40
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.use((socket, next) => {
  try {
    jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("send-message", (text) => {
    const encrypted = encrypt(text);
    io.emit("new-message", encrypted);
  });

  socket.on("admin-ban", (ip) => {
    if (socket.handshake.auth.admin === true) {
      banIP(ip);
    }
  });
});

server.listen(process.env.PORT || 3000);
