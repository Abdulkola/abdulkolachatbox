import { createContext, useContext, useMemo, useState } from "react";

const UserContext = createContext(null);

function randomHandle() {
  const value = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `guest-${value}`;
}

export function UserProvider({ children }) {
  const [profile, setProfile] = useState({
    id: crypto.randomUUID(),
    displayName: randomHandle(),
  });

  const value = useMemo(() => ({ profile, setProfile }), [profile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const value = useContext(UserContext);
  if (!value) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return value;
}
