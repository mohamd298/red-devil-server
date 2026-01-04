const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Environment Variables
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "red_admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "R3dD3v!l_2026";

// ملفات المستخدمين والرسائل
const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, "[]");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

function load(file) { return JSON.parse(fs.readFileSync(file)); }
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// إنشاء حساب الأدمن
(async () => {
  let users = load(USERS_FILE);
  if (!users[ADMIN_USER]) {
    users[ADMIN_USER] = {
      name: "ADMIN",
      pass: await bcrypt.hash(ADMIN_PASS, 12),
      admin: true,
      token: crypto.randomBytes(32).toString("hex"),
      avatar: "/uploads/admin.png"
    };
    save(USERS_FILE, users);
  }
})();

// تسجيل مستخدم جديد (باسم فقط)
app.post("/register", async (req, res) => {
  const { user } = req.body;
  let users = load(USERS_FILE);
  if (users[user]) return res.sendStatus(403);
  users[user] = {
    name: user,
    pass: await bcrypt.hash("default_pass", 12),
    admin: false,
    token: crypto.randomBytes(32).toString("hex"),
    avatar: "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg"
  };
  save(USERS_FILE, users);
  res.sendStatus(200);
});

// تسجيل دخول
app.post("/login", async (req, res) => {
  const { user } = req.body;
  let users = load(USERS_FILE);
  if (!users[user]) return res.sendStatus(403);
  res.json({ token: users[user].token });
});

// حفظ / تعديل الاسم والصورة بعد تسجيل الدخول
app.post("/profile", (req, res) => {
  const { token, name } = req.body;
  if(!token || !name) return res.sendStatus(400);

  let users = load(USERS_FILE);
  let userKey = Object.keys(users).find(u => users[u].token === token);
  if (!userKey) return res.sendStatus(403);

  users[userKey].name = name;

  // حفظ صورة إذا موجودة، وإذا لم يرفع المستخدم صورة يتم وضع الصورة الافتراضية
  if (req.files && req.files.avatar) {
    let avatar = req.files.avatar;
    let ext = path.extname(avatar.name);
    let filename = `${userKey}${ext}`;
    avatar.mv(`uploads/${filename}`, err => { if(err) console.log(err); });
    users[userKey].avatar = `/uploads/${filename}`;
  } else if(!users[userKey].avatar){
    users[userKey].avatar = "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg";
  }

  save(USERS_FILE, users);
  res.json({ success: true });
});

// Endpoint لإرجاع بيانات المستخدمين (لـ profile load)
app.get("/users.json", (req,res)=>{
  res.json(load(USERS_FILE));
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
