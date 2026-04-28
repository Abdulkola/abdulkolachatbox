import "dotenv/config";
import { createServer } from "http";
import { randomUUID } from "crypto";
import WebSocket, { WebSocketServer } from "ws";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import { verifyWebSocketToken } from "./middleware/auth.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDistPath = join(__dirname, "../client/dist");

const PORT = Number(process.env.PORT) || 8080;
const MAX_HISTORY = 100;

// MIME types for common file extensions
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const app = express();
const rooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// Routes
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Serve static files
app.get("*", (req, res) => {
  if (req.url.includes(".")) {
    const filePath = join(clientDistPath, req.url);
    if (filePath.startsWith(clientDistPath) && existsSync(filePath)) {
      try {
        const ext = extname(filePath);
        const mimeType = mimeTypes[ext] || "application/octet-stream";
        const content = readFileSync(filePath);
        res.setHeader("Content-Type", mimeType);
        res.send(content);
        return;
      } catch {
        res.status(404).send("Not found");
        return;
      }
    }
  }

  // Serve index.html for all other routes (SPA)
  try {
    const indexPath = join(clientDistPath, "index.html");
    const content = readFileSync(indexPath);
    res.setHeader("Content-Type", "text/html");
    res.send(content);
  } catch {
    res.status(500).send("Internal server error");
  }
});

// Room management functions
function ensureRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      history: [],
      clients: new Set(),
    });
  }
  return rooms.get(roomName);
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function send(client, payload) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(payload));
  }
}

function broadcast(roomName, payload) {
  const room = rooms.get(roomName);
  if (!room) {
    return;
  }

  for (const client of room.clients) {
    send(client, payload);
  }
}

function createMessage(user, text) {
  return {
    id: randomUUID(),
    user,
    text,
    timestamp: new Date().toISOString(),
  };
}

// WebSocket server
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  socket.meta = {
    user: null,
    roomName: null,
    authenticated: false,
  };

  socket.on("message", (rawData) => {
    const data = safeJsonParse(rawData.toString());
    if (!data || typeof data !== "object") {
      return;
    }

    // Authenticate with JWT token
    if (data.type === "auth") {
      const user = verifyWebSocketToken(data.token);
      if (user) {
        socket.meta.authenticated = true;
        socket.meta.user = user;
        send(socket, { type: "authenticated" });
      } else {
        send(socket, { type: "error", message: "Authentication failed" });
        socket.close();
      }
      return;
    }

    if (!socket.meta.authenticated) {
      send(socket, { type: "error", message: "Not authenticated" });
      return;
    }

    if (data.type === "join") {
      const roomName = String(data.room || "").trim();
      const displayName = data.displayName;

      if (!roomName || !displayName) {
        return;
      }

      if (socket.meta.roomName) {
        const previousRoom = rooms.get(socket.meta.roomName);
        previousRoom?.clients.delete(socket);
      }

      const room = ensureRoom(roomName);
      room.clients.add(socket);
      socket.meta = { ...socket.meta, roomName, displayName };

      send(socket, {
        type: "history",
        room: roomName,
        messages: room.history,
      });

      broadcast(roomName, {
        type: "system",
        room: roomName,
        message: {
          id: randomUUID(),
          text: `${displayName} joined ${roomName}`,
          timestamp: new Date().toISOString(),
        },
      });

      return;
    }

    if (data.type === "message") {
      const roomName = socket.meta.roomName;
      const displayName = socket.meta.displayName;
      const text = String(data.text || "").trim();

      if (!roomName || !displayName || !text) {
        return;
      }

      const room = ensureRoom(roomName);
      const message = createMessage(displayName, text);
      room.history.push(message);

      if (room.history.length > MAX_HISTORY) {
        room.history.shift();
      }

      broadcast(roomName, {
        type: "message",
        room: roomName,
        message,
      });
    }
  });

  socket.on("close", () => {
    if (!socket.meta.roomName || !socket.meta.displayName) {
      return;
    }

    const room = rooms.get(socket.meta.roomName);
    room?.clients.delete(socket);

    broadcast(socket.meta.roomName, {
      type: "system",
      room: socket.meta.roomName,
      message: {
        id: randomUUID(),
        text: `${socket.meta.displayName} left ${socket.meta.roomName}`,
        timestamp: new Date().toISOString(),
      },
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
