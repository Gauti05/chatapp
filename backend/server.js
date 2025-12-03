const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const channelRoutes = require("./routes/channel");
const messageRoutes = require("./routes/message");

const app = express();
const server = http.createServer(app);


const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); 


app.use(cookieParser());
app.use(express.json());


app.use((req, res, next) => {
  console.log(` ${req.method} ${req.path} - cookies: ${!!req.cookies?.token ? '✅' : '❌'}`);
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);


app.get("/debug/auth", (req, res) => {
  res.json({ 
    cookies: req.cookies,
    hasToken: !!req.cookies?.token 
  });
});

app.get("/", (req, res) => {
  res.json({ message: "API running " });
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("join", ({ userId, channelId }) => {
    socket.join(channelId);
    onlineUsers.set(userId, socket.id);
    io.to(channelId).emit("presence", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", (message) => {
    io.to(message.channel).emit("newMessage", message);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server: http://localhost:${PORT}`);
    
    });
  })
  .catch((err) => console.error(" MongoDB error:", err));
