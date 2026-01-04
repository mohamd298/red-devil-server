const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // كل الملفات داخل public
app.use("/uploads", express.static("uploads"));

// Environment Variables
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "red_admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "R3dD3v!l_2026";
const SECRET_KEY = process.env.SECRET_KEY || "R3dD3v!l_S3cr3t_2026";

// ملفات المستخدمين والرسائل
const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, "[]");

function load(file) { return JSON.parse(fs.readFileSync(file)); }
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// إنشاء حساب الأدمن عند التشغيل
(async () => {
  let users = load(USERS_FILE);
  if (!users[ADMIN_USER]) {
    users[ADMIN_USER] = {
      name: "ADMIN",
      pass: await bcrypt.hash(ADMIN_PASS, 12),
      admin: true,
      token: crypto.randomBytes(32).toString("hex")
    };
    save(USERS_FILE, users);
  }
})();

// تسجيل مستخدم جديد
app.post("/register", async (req, res) => {
  const { user, pass, name } = req.body;
  let users = load(USERS_FILE);
  if (users[user]) return res.sendStatus(403);
  users[user] = {
    name,
    pass: await bcrypt.hash(pass, 12),
    admin: false,
    token: crypto.randomBytes(32).toString("hex")
  };
  save(USERS_FILE, users);
  res.sendStatus(200);
});

// تسجيل دخول
app.post("/login", async (req, res) => {
  const { user, pass } = req.body;
  let users = load(USERS_FILE);
  if (!users[user]) return res.sendStatus(403);
  const ok = await bcrypt.compare(pass, users[user].pass);
  if (!ok) return res.sendStatus(403);
  res.json({
    token: users[user].token,
    name: users[user].name,
    admin: users[user].admin
  });
});

// WebSocket للرسائل
io.on("connection", socket => {
  socket.on("msg", data => {
    let msgs = load(MSG_FILE);
    msgs.push(data);
    save(MSG_FILE, msgs);
    io.emit("msg", data);
  });
});

server.listen(PORT, () => console.log(`🔥 Red Devil Server Running on port ${PORT}`));
