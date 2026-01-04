const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// مهم جدًا
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

let users = {};

// فحص
app.get("/api/ping", (req, res) => {
  res.json({ ok: true });
});

// تسجيل دخول
app.post("/api/login", (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { username } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({ error: "اسم غير صالح" });
  }

  if (!users[username]) {
    users[username] = {
      username,
      avatar:
        "https://cdn.discordapp.com/attachments/1328252771417194538/1457442598137499700/a0d3f87fe0d99e1cf38e51b8a1e3a564.jpg"
    };
  }

  res.json({
    success: true,
    user: users[username]
  });
});

// حفظ الملف الشخصي
app.post("/api/profile", (req, res) => {
  console.log("PROFILE BODY:", req.body);

  const { username, avatar } = req.body;

  if (!users[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (avatar && avatar.startsWith("http")) {
    users[username].avatar = avatar;
  }

  res.json({ success: true });
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("🔥 Red Devil Server running on", PORT);
});
