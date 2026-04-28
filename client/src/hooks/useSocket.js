import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  addRoomMessage,
  setConnectionState,
  setRoomHistory,
} from "../store/chatSlice";

const SOCKET_URL = window.location.protocol === "https:" 
  ? `wss://${window.location.host}`
  : `ws://${window.location.host}`;

export function useSocket({ roomName, user, token }) {
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomName || !user?.displayName || !token) {
      return undefined;
    }

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;
    dispatch(setConnectionState("connecting"));

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "auth",
          token,
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "authenticated") {
        dispatch(setConnectionState("open"));
        socket.send(
          JSON.stringify({
            type: "join",
            room: roomName,
            displayName: user.displayName,
          })
        );
        return;
      }

      if (data.type === "error") {
        console.error("WebSocket error:", data.message);
        dispatch(setConnectionState("error"));
        return;
      }

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
  }, [dispatch, roomName, user, token]);

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
