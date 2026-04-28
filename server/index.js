import { createServer } from "http";
import { randomUUID } from "crypto";
import WebSocket, { WebSocketServer } from "ws";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

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

const rooms = new Map();

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

function serveStatic(filePath, res) {
  try {
    const ext = extname(filePath);
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const content = readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

function serveIndexHTML(res) {
  try {
    const indexPath = join(clientDistPath, "index.html");
    const content = readFileSync(indexPath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end("Internal server error");
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Try to serve static files from dist directory
  if (req.url !== "/" && req.url.includes(".")) {
    const filePath = join(clientDistPath, req.url);
    // Prevent directory traversal
    if (filePath.startsWith(clientDistPath)) {
      if (existsSync(filePath)) {
        serveStatic(filePath, res);
        return;
      }
    }
  }

  // For all other routes, serve index.html (client-side routing)
  serveIndexHTML(res);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  socket.meta = {
    user: null,
    roomName: null,
  };

  send(socket, { type: "connected" });

  socket.on("message", (rawData) => {
    const data = safeJsonParse(rawData.toString());
    if (!data || typeof data !== "object") {
      return;
    }

    if (data.type === "join") {
      const roomName = String(data.room || "").trim();
      const user = data.user;
      if (!roomName || !user?.id || !user?.displayName) {
        return;
      }

      if (socket.meta.roomName) {
        const previousRoom = rooms.get(socket.meta.roomName);
        previousRoom?.clients.delete(socket);
      }

      const room = ensureRoom(roomName);
      room.clients.add(socket);
      socket.meta = { roomName, user };

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
          text: `${user.displayName} joined ${roomName}`,
          timestamp: new Date().toISOString(),
        },
      });

      return;
    }

    if (data.type === "message") {
      const roomName = socket.meta.roomName;
      const user = socket.meta.user;
      const text = String(data.text || "").trim();

      if (!roomName || !user || !text) {
        return;
      }

      const room = ensureRoom(roomName);
      const message = createMessage(user, text);
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
    if (!socket.meta.roomName || !socket.meta.user) {
      return;
    }

    const room = rooms.get(socket.meta.roomName);
    room?.clients.delete(socket);

    broadcast(socket.meta.roomName, {
      type: "system",
      room: socket.meta.roomName,
      message: {
        id: randomUUID(),
        text: `${socket.meta.user.displayName} left ${socket.meta.roomName}`,
        timestamp: new Date().toISOString(),
      },
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket chat server listening on http://localhost:${PORT}`);
});
