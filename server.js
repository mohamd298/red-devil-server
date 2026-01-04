const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// مجلد لتخزين الصور مؤقتًا
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const users = {};

// اختبار السيرفر
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, server: "Red Devil Server Online" });
});

// تسجيل الدخول
app.post("/api/login", (req, res) => {
  const { username } = req.body;
  if (!username || username.length < 3)
    return res.status(400).json({ success: false, error: "اسم المستخدم غير صالح" });

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

// حفظ / تعديل الملف الشخصي (رفع صورة أو رابط)
app.post("/api/profile", async (req, res) => {
  const { username } = req.body;
  if (!username || !users[username])
    return res.status(404).json({ success: false, error: "User not found" });

  let avatarUrl = users[username].avatar;

  // إذا المستخدم رفع ملف
  if (req.files && req.files.avatar) {
    const avatarFile = req.files.avatar;
    const filePath = path.join(UPLOAD_DIR, Date.now() + "_" + avatarFile.name);
    await avatarFile.mv(filePath);
    avatarUrl = `https://red-devil-server.onrender.com/uploads/${path.basename(filePath)}`;
    users[username].avatar = avatarUrl;
  } 
  // إذا وضع رابط مباشر
  else if (req.body.avatar && req.body.avatar.startsWith("http")) {
    avatarUrl = req.body.avatar;
    users[username].avatar = avatarUrl;
  }

  res.json({ success: true, user: users[username] });
});

// خدمة الملفات المرفوعة
app.use("/uploads", express.static(UPLOAD_DIR));

// fallback لأي شيء غير موجود
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => console.log("🔥 Red Devil Server running on port", PORT));
