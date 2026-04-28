import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentRoom: "",
  connectionState: "idle",
  messagesByRoom: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentRoom(state, action) {
      state.currentRoom = action.payload;
    },
    setConnectionState(state, action) {
      state.connectionState = action.payload;
    },
    setRoomHistory(state, action) {
      const { room, messages } = action.payload;
      state.messagesByRoom[room] = messages;
    },
    addRoomMessage(state, action) {
      const { room, message } = action.payload;
      if (!state.messagesByRoom[room]) {
        state.messagesByRoom[room] = [];
      }
      state.messagesByRoom[room].push(message);
    },
  },
});

export const {
  setCurrentRoom,
  setConnectionState,
  setRoomHistory,
  addRoomMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
