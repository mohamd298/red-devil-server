const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, "[]");

function load(file) {
  return JSON.parse(fs.readFileSync(file));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* إنشاء حساب الأدمن */
(async () => {
  let users = load(USERS_FILE);
  if (!users.red_admin) {
    users.red_admin = {
      name: "ADMIN",
      pass: await bcrypt.hash("R3dD3v!l_2026", 12),
      admin: true,
      token: crypto.randomBytes(32).toString("hex")
    };
    save(USERS_FILE, users);
  }
})();

/* تسجيل مستخدم */
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

/* تسجيل دخول */
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

/* سوكيت الرسائل */
io.on("connection", socket => {
  socket.on("msg", data => {
    let msgs = load(MSG_FILE);
    msgs.push(data);
    save(MSG_FILE, msgs);
    io.emit("msg", data);
  });
});

server.listen(3000, () => {
  console.log("🔥 Red Devil Server Running");
});
