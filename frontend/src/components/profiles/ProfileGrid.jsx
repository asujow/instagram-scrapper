import React from "react";

import ProfileCard from "./ProfileCard";

export default function ProfileGrid({ profiles, selectedProfiles, onToggleProfile, onOpenProfile }) {
  if (!profiles.length) {
    return (
      <div className="bg-white border rounded-2xl p-12 text-center text-zinc-500">
        No profiles match your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.username}
          profile={profile}
          selected={selectedProfiles.includes(profile.username)}
          onSelect={onToggleProfile}
          onOpen={onOpenProfile}
        />
      ))}
    </div>
  );
}
