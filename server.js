const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// قاعدة بيانات مؤقتة
let users = {};

// تسجيل دخول
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: "اسم غير صالح" });
  }

  if (!users[username]) {
    users[username] = {
      username,
      avatar:
        "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg"
    };
  }

  res.json({ success: true, user: users[username] });
});

// تحديث الملف الشخصي
app.post("/profile", (req, res) => {
  const { username, avatar } = req.body;

  if (!users[username]) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  users[username].avatar = avatar || users[username].avatar;

  res.json({ success: true });
});

// فحص السيرفر
app.get("/health", (req, res) => {
  res.json({ status: "OK", server: "Red Devil Online" });
});

// تشغيل
app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
