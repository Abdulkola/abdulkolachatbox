# Real-Time Chat Application

A room-based chat app built with React + Redux on the client and a Node.js WebSocket server.

## Features

- Real-time messaging over WebSocket
- Join/create named rooms
- Per-room message history (stored in Redux)
- Basic user profile via React Context
- Route-based room navigation with React Router
- Custom `useSocket` hook for socket lifecycle and event handling

## Tech Concepts Included

- `useEffect` for WebSocket lifecycle (`open`, `message`, `close`, `error`)
- `useRef` to persist the socket instance without re-rendering
- Redux Toolkit for room state and message history
- Custom hook (`useSocket`) for connection logic
- Context (`UserContext`) for current user profile
- React Router (`/room/:roomName`) for room navigation

## Project Structure

- `server/` Node WebSocket server (`ws`)
- `client/` React app (Vite)

## Run Locally

1. Install server dependencies
   - `cd server`
   - `npm install`
2. Install client dependencies
   - `cd ../client`
   - `npm install`
3. Start server (Terminal 1)
   - `cd server`
   - `npm run dev`
4. Start client (Terminal 2)
   - `cd client`
   - `npm run dev`
5. Open the Vite URL (usually `http://localhost:5173`)

## WebSocket Message Contract

Client -> Server:

- Join room
  - `{ "type": "join", "room": "general", "user": { "id": "...", "displayName": "..." } }`
- Send message
  - `{ "type": "message", "text": "hello" }`

Server -> Client:

- Connection acknowledgment
  - `{ "type": "connected" }`
- Room history
  - `{ "type": "history", "room": "general", "messages": [...] }`
- New chat message
  - `{ "type": "message", "room": "general", "message": {...} }`
- System notice (join/leave)
  - `{ "type": "system", "room": "general", "message": {...} }`

## Notes

- Message history is in-memory and resets when the server restarts.
- Server keeps up to 100 messages per room.
