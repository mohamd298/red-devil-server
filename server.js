const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 10000;
const USERS_FILE = "users.json";

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const load = () => JSON.parse(fs.readFileSync(USERS_FILE));
const save = d => fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2));

/* 🔥 Route فحص الاتصال */
app.get("/", (req, res) => {
  res.json({ status: "OK", server: "Red Devil Online" });
});

/* تسجيل / دخول */
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "no username" });

  let users = load();
  if (!users[username]) {
    users[username] = {
      name: username,
      token: crypto.randomBytes(32).toString("hex"),
      avatar: "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg"
    };
    save(users);
  }

  res.json({
    token: users[username].token
  });
});

/* حفظ الملف الشخصي */
app.post("/profile", (req, res) => {
  const { token, name } = req.body;
  let users = load();
  let userKey = Object.keys(users).find(u => users[u].token === token);
  if (!userKey) return res.status(403).json({ error: "bad token" });

  users[userKey].name = name;

  if (req.files?.avatar) {
    const img = req.files.avatar;
    const filename = `${userKey}${path.extname(img.name)}`;
    img.mv(`uploads/${filename}`);
    users[userKey].avatar = `/uploads/${filename}`;
  }

  save(users);
  res.json({ success: true });
});

/* WebSocket */
io.on("connection", socket => {
  socket.on("msg", msg => io.emit("msg", msg));
});

server.listen(PORT, () =>
  console.log("🔥 Red Devil Server Running")
);
