import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  addRoomMessage,
  setConnectionState,
  setRoomHistory,
} from "../store/chatSlice";

const SOCKET_URL = "ws://localhost:8080";

export function useSocket({ roomName, user }) {
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomName || !user?.id || !user?.displayName) {
      return undefined;
    }

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;
    dispatch(setConnectionState("connecting"));

    socket.addEventListener("open", () => {
      dispatch(setConnectionState("open"));
      socket.send(
        JSON.stringify({
          type: "join",
          room: roomName,
          user,
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "history") {
        dispatch(
          setRoomHistory({
            room: data.room,
            messages: data.messages,
          })
        );
      }

      if (data.type === "message" || data.type === "system") {
        dispatch(
          addRoomMessage({
            room: data.room,
            message: {
              ...data.message,
              kind: data.type,
            },
          })
        );
      }
    });

    socket.addEventListener("close", () => {
      dispatch(setConnectionState("closed"));
    });

    socket.addEventListener("error", () => {
      dispatch(setConnectionState("error"));
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [dispatch, roomName, user]);

  const sendMessage = (text) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "message",
        text,
      })
    );
  };

  return { sendMessage };
}
