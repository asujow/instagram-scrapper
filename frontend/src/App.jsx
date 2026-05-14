import { useEffect, useState } from "react";

import ImportBox from "./components/ImportBox";
import ProfileCard from "./components/ProfileCard";

export default function App() {
  const [profiles, setProfiles] = useState([]);

  async function loadProfiles() {
    const res = await fetch("/api/profiles");
    const data = await res.json();

    setProfiles(data);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8 flex flex-col gap-8">
      <h1 className="text-4xl font-bold">
        Instagram Profile Tagger
      </h1>

      <ImportBox onImport={loadProfiles} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.username}
            profile={profile}
          />
        ))}
      </div>
    </div>
  );
}