const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// بيانات مؤقتة
const users = {};

// ===== اختبار السيرفر =====
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, server: "Red Devil Server Online" });
});

// ===== تسجيل دخول =====
app.post("/api/login", (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({ success: false, error: "اسم المستخدم غير صالح" });
  }

  if (!users[username]) {
    users[username] = {
      username,
      avatar:
        "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg",
      joinedAt: Date.now()
    };
  }

  res.json({ success: true, user: users[username] });
});

// ===== حفظ / تعديل الملف الشخصي =====
app.post("/api/profile", (req, res) => {
  const { username, avatar } = req.body;

  if (!username || !users[username]) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (avatar && avatar.startsWith("http")) {
    users[username].avatar = avatar;
  }

  res.json({ success: true, user: users[username] });
});

// ===== fallback لأي endpoint غير موجود =====
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ===== تشغيل السيرفر =====
app.listen(PORT, () => console.log("🔥 Red Devil Server running on port", PORT));
