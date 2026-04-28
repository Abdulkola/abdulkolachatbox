import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ChatRoom from "./components/ChatRoom";
import ProfilePanel from "./components/ProfilePanel";
import RoomList from "./components/RoomList";

export default function App() {
  const navigate = useNavigate();

  const handleJoin = (roomName) => {
    navigate(`/room/${encodeURIComponent(roomName)}`);
  };

  return (
    <div className="layout-shell">
      <aside className="left-rail">
        <h1>RoomPulse</h1>
        <p>Live rooms. Instant messages. Zero refresh.</p>
        <ProfilePanel />
        <RoomList onJoin={handleJoin} />
        <div className="tip-card">
          <h3>Tip</h3>
          <p>
            Open this app in two browser tabs and join the same room to see
            real-time updates.
          </p>
        </div>
      </aside>

      <main className="chat-main">
        <Routes>
          <Route
            path="/"
            element={
              <section className="welcome-card">
                <h2>Pick a room from the left panel</h2>
                <p>
                  Rooms are created automatically. Try <Link to="/room/general">general</Link>,{" "}
                  <Link to="/room/react-lab">react-lab</Link>, or your own custom name.
                </p>
              </section>
            }
          />
          <Route path="/room/:roomName" element={<ChatRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
