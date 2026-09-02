import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import { getOrCreateSpaceAIUser } from "./lib/spaceai.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes setup
app.get("/", (req, res) => {
  res.send("Welcome to Quick Chat API");
});
app.use("/api/status", (req, res) => res.send("Server is live"));

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/ai", aiRouter);

// Connect to MongoDB in the background so the API can still start
const initializeDatabase = async () => {
  try {
    await connectDB();
    await getOrCreateSpaceAIUser();
  } catch (error) {
    console.warn("MongoDB unavailable at startup:", error.message);
  }
};

await initializeDatabase();

const listenOnPort = (port) =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });

const startServer = async (port) => {
  const firstPort = port;
  while (port < firstPort + 10) {
    try {
      await listenOnPort(port);
      console.log(
        `Server is running on PORT: ${port} => http://localhost:${port}/api/status`
      );
      return;
    } catch (error) {
      if (error.code !== "EADDRINUSE") throw error;
      port += 1;
      console.warn(`Port ${port - 1} is busy. Trying ${port} instead.`);
    }
  }

  throw new Error(`No available port found between ${firstPort} and ${port - 1}`);
};

if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 5001;
  await startServer(PORT);
}

// Export server for Vercel
export default server;
