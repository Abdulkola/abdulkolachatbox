import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { setCurrentRoom } from "../store/chatSlice";

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatRoom({ token, user }) {
  const { roomName: encodedRoomName } = useParams();
  const roomName = useMemo(
    () => decodeURIComponent(encodedRoomName || "").trim(),
    [encodedRoomName]
  );

  const dispatch = useDispatch();
  const [draft, setDraft] = useState("");

  const messages = useSelector(
    (state) => state.chat.messagesByRoom[roomName] || []
  );
  const connectionState = useSelector((state) => state.chat.connectionState);

  useEffect(() => {
    dispatch(setCurrentRoom(roomName));
  }, [dispatch, roomName]);

  const { sendMessage } = useSocket({ roomName, user, token });

  const onSubmit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    sendMessage(text);
    setDraft("");
  };

  return (
    <section className="chat-room">
      <header className="chat-header">
        <div>
          <h2>#{roomName}</h2>
          <p>{messages.length} messages</p>
        </div>
        <span className={`status ${connectionState}`}>{connectionState}</span>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <p className="empty">No messages yet. Start the room conversation.</p>
        )}

        {messages.map((message) => {
          const own = message.user === user.displayName;
          if (message.kind === "system") {
            return (
              <div key={message.id} className="system-message">
                <span>{message.text}</span>
                <small>{formatTime(message.timestamp)}</small>
              </div>
            );
          }

          return (
            <article
              key={message.id}
              className={`bubble ${own ? "mine" : "theirs"}`}
            >
              <header>
                <strong>{message.user}</strong>
                <small>{formatTime(message.timestamp)}</small>
              </header>
              <p>{message.text}</p>
            </article>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="composer">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message"
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
