import { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ChatRoom from "./components/ChatRoom";
import ProfilePanel from "./components/ProfilePanel";
import RoomList from "./components/RoomList";
import LoginPage from "./components/LoginPage";

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const handleJoin = (roomName) => {
    navigate(`/room/${encodeURIComponent(roomName)}`);
  };

  return (
    <div className="layout-shell">
      <aside className="left-rail">
        <div className="header-section">
          <h1>RoomPulse</h1>
          <p>Live rooms. Instant messages. Zero refresh.</p>
        </div>
        <div className="user-section">
          <div className="user-info">
            <strong>{user.displayName}</strong>
            <small>{user.email}</small>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
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
          <Route
            path="/room/:roomName"
            element={<ChatRoom token={token} user={user} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
