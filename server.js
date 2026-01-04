const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const USERS = "users.json";
const MSGS = "messages.json";

if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");
if (!fs.existsSync(MSGS)) fs.writeFileSync(MSGS, "[]");

const upload = multer({ dest: "uploads/" });

function load(file){ return JSON.parse(fs.readFileSync(file)); }
function save(file,data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }

/* حساب الأدمن */
(async ()=>{
  let users = load(USERS);
  if(!users.red_admin){
    users.red_admin = {
      pass: await bcrypt.hash("R3dD3v!l_2026", 12),
      admin:true,
      token: crypto.randomBytes(32).toString("hex")
    };
    save(USERS,users);
  }
})();

/* تسجيل */
app.post("/register", async (req,res)=>{
  const {user,pass,name} = req.body;
  let users = load(USERS);
  if(users[user]) return res.sendStatus(403);
  users[user]={
    name,
    pass: await bcrypt.hash(pass,12),
    admin:false,
    token: crypto.randomBytes(32).toString("hex")
  };
  save(USERS,users);
  res.sendStatus(200);
});

/* دخول */
app.post("/login", async (req,res)=>{
  const {user,pass} = req.body;
  let users = load(USERS);
  if(!users[user]) return res.sendStatus(403);
  const ok = await bcrypt.compare(pass, users[user].pass);
  if(!ok) return res.sendStatus(403);
  res.json({token:users[user].token, name:users[user].name, admin:users[user].admin});
});

/* رفع ملفات */
app.post("/upload", upload.single("file"), (req,res)=>{
  res.json({url:`/uploads/${req.file.filename}`});
});

/* سوكيت */
io.on("connection", socket=>{
  socket.on("msg", data=>{
    let msgs = load(MSGS);
    msgs.push(data);
    save(MSGS,msgs);
    io.emit("msg",data);
  });
});

server.listen(3000);
