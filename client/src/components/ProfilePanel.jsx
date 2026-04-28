import { useState } from "react";
import { useUser } from "../context/UserContext";

export default function ProfilePanel() {
  const { profile, setProfile } = useUser();
  const [draft, setDraft] = useState(profile.displayName);

  const saveProfile = () => {
    const nextDisplayName = draft.trim();
    if (!nextDisplayName) {
      return;
    }

    setProfile((prev) => ({
      ...prev,
      displayName: nextDisplayName,
    }));
  };

  return (
    <section className="panel">
      <h2>User Profile</h2>
      <label htmlFor="displayName">Display name</label>
      <input
        id="displayName"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={24}
      />
      <button onClick={saveProfile}>Save</button>
    </section>
  );
}
