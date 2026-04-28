import { useState } from "react";

const SUGGESTED_ROOMS = ["general", "react-lab", "help-desk", "music"];

export default function RoomList({ onJoin }) {
  const [customRoom, setCustomRoom] = useState("");

  const joinCustomRoom = (event) => {
    event.preventDefault();
    const room = customRoom.trim();
    if (!room) {
      return;
    }
    onJoin(room);
    setCustomRoom("");
  };

  return (
    <section className="panel">
      <h2>Rooms</h2>
      <ul className="room-list">
        {SUGGESTED_ROOMS.map((room) => (
          <li key={room}>
            <button className="ghost" onClick={() => onJoin(room)}>
              #{room}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={joinCustomRoom} className="room-form">
        <input
          value={customRoom}
          onChange={(event) => setCustomRoom(event.target.value)}
          placeholder="create-or-join"
          maxLength={24}
        />
        <button type="submit">Join</button>
      </form>
    </section>
  );
}
